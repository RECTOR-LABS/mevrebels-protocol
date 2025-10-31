/*!
 * MEVrebels Transaction Monitor
 *
 * Receives Helius webhooks and monitors strategy execution transactions
 */

mod config;
mod database;
mod types;
mod webhook;
mod parser;

use anyhow::Result;
use axum::{
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tracing::info;
use tracing_subscriber;

use crate::config::Config;
use crate::database::init_db_pool;
use crate::webhook::{health_check, helius_webhook};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .init();

    info!("Starting MEVrebels Transaction Monitor...");

    // Load configuration
    let config = Config::from_env()?;
    info!("Configuration loaded");

    // Initialize database connection pool
    let db_pool = init_db_pool(&config.database_url).await?;
    info!("Database connection pool initialized");

    // Create CORS layer
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build router
    let app = Router::new()
        .route("/health", get(health_check))
        .route("/webhook/helius", post(helius_webhook))
        .layer(cors)
        .with_state((config, db_pool));

    // Bind server
    let addr = SocketAddr::from(([0, 0, 0, 0], 3003));
    info!("Transaction Monitor listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
