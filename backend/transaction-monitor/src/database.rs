/*!
 * Database operations
 */

use anyhow::Result;
use sqlx::{postgres::PgPoolOptions, PgPool};
use tracing::{error, info};

use crate::types::ExecutionRecord;

pub async fn init_db_pool(database_url: &str) -> Result<PgPool> {
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await?;

    info!("Database connection pool created");
    Ok(pool)
}

pub async fn record_execution(pool: &PgPool, record: &ExecutionRecord) -> Result<()> {
    let result = sqlx::query!(
        r#"
        INSERT INTO executions (strategy_id, executor, signature, profit_lamports, gas_used, success)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (signature) DO NOTHING
        "#,
        record.strategy_id,
        record.executor,
        record.signature,
        record.profit_lamports,
        record.gas_used,
        record.success,
    )
    .execute(pool)
    .await;

    match result {
        Ok(_) => {
            info!(
                "Recorded execution: {} (success={}, profit={})",
                record.signature, record.success, record.profit_lamports
            );
            Ok(())
        }
        Err(e) => {
            error!("Failed to record execution: {}", e);
            Err(e.into())
        }
    }
}

pub async fn get_strategy_by_address(pool: &PgPool, address: &str) -> Result<Option<String>> {
    let result = sqlx::query_scalar!(
        r#"
        SELECT id FROM strategies
        WHERE creator = $1 OR strategy_id::text = $1
        LIMIT 1
        "#,
        address
    )
    .fetch_optional(pool)
    .await?;

    Ok(result)
}
