/*!
 * Webhook handlers
 */

use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Json, Response},
    TypedHeader,
};
use headers::{HeaderMap, HeaderValue};
use hmac::{Hmac, Mac};
use serde_json::{json, Value};
use sha2::Sha256;
use sqlx::PgPool;
use tracing::{error, info, warn};

use crate::config::Config;
use crate::database::{get_strategy_by_address, record_execution};
use crate::parser::parse_execution_transaction;
use crate::types::{ExecutionRecord, HeliusWebhook};

type HmacSha256 = Hmac<Sha256>;

pub async fn health_check() -> impl IntoResponse {
    Json(json!({
        "status": "healthy",
        "service": "transaction-monitor"
    }))
}

pub async fn helius_webhook(
    State((config, db_pool)): State<(Config, PgPool)>,
    headers: HeaderMap,
    body: String,
) -> Response {
    // Verify webhook signature
    if !config.helius_webhook_secret.is_empty() {
        if let Some(signature) = headers.get("x-webhook-signature") {
            if !verify_signature(&body, signature.to_str().unwrap_or(""), &config.helius_webhook_secret)
            {
                warn!("Invalid webhook signature");
                return (StatusCode::UNAUTHORIZED, "Invalid signature").into_response();
            }
        } else {
            warn!("Missing webhook signature");
            return (StatusCode::UNAUTHORIZED, "Missing signature").into_response();
        }
    }

    // Parse webhook payload
    let webhook: HeliusWebhook = match serde_json::from_str(&body) {
        Ok(w) => w,
        Err(e) => {
            error!("Failed to parse webhook payload: {}", e);
            return (StatusCode::BAD_REQUEST, "Invalid payload").into_response();
        }
    };

    // Verify webhook type
    if webhook.r#type != "ENHANCED" {
        warn!("Unsupported webhook type: {}", webhook.r#type);
        return Json(json!({ "status": "ignored" })).into_response();
    }

    info!("Received webhook with {} transactions", webhook.transactions.len());

    let mut processed = 0;
    let mut errors = 0;

    // Process each transaction
    for tx in &webhook.transactions {
        match process_transaction(&config, &db_pool, tx).await {
            Ok(true) => processed += 1,
            Ok(false) => {}
            Err(e) => {
                error!("Error processing transaction {}: {}", tx.signature, e);
                errors += 1;
            }
        }
    }

    info!(
        "Processed {} transactions ({} successful, {} errors)",
        webhook.transactions.len(),
        processed,
        errors
    );

    Json(json!({
        "status": "success",
        "transactions_received": webhook.transactions.len(),
        "transactions_processed": processed,
        "errors": errors
    }))
    .into_response()
}

async fn process_transaction(
    config: &Config,
    db_pool: &PgPool,
    tx: &crate::types::HeliusTransaction,
) -> Result<bool, anyhow::Error> {
    // Check if transaction involves our programs
    let involves_our_programs = if let Some(tx_data) = &tx.transaction {
        if let Some(msg) = &tx_data.message {
            if let Some(keys) = &msg.account_keys {
                keys.iter().any(|key| {
                    key == &config.strategy_registry_program_id
                        || key == &config.execution_engine_program_id
                })
            } else {
                false
            }
        } else {
            false
        }
    } else {
        false
    };

    if !involves_our_programs {
        return Ok(false);
    }

    // Parse execution details
    let alert = match parse_execution_transaction(tx) {
        Some(a) => a,
        None => {
            info!("Transaction {} doesn't contain execution data", tx.signature);
            return Ok(false);
        }
    };

    info!(
        "Execution alert: {} (success={}, profit={:?})",
        alert.signature, alert.success, alert.profit_lamports
    );

    // Look up strategy UUID
    let strategy_id = get_strategy_by_address(db_pool, &alert.strategy_address).await?;

    // Record execution in database
    let record = ExecutionRecord {
        signature: alert.signature.clone(),
        strategy_id,
        executor: alert.executor.clone(),
        profit_lamports: alert.profit_lamports.unwrap_or(0),
        gas_used: tx.meta.as_ref().and_then(|m| m.fee).unwrap_or(0) as i32,
        success: alert.success,
    };

    record_execution(db_pool, &record).await?;

    Ok(true)
}

fn verify_signature(payload: &str, signature: &str, secret: &str) -> bool {
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC can take key of any size");
    mac.update(payload.as_bytes());

    let expected = hex::encode(mac.finalize().into_bytes());
    expected == signature
}
