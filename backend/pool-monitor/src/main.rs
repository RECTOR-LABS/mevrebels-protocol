/*!
 * MEVrebels Pool Monitor
 *
 * Monitors DEX pools (Raydium, Orca, Meteora) for arbitrage opportunities
 */

mod config;
mod dex;
mod opportunity;
mod publisher;
mod types;

use anyhow::Result;
use std::sync::Arc;
use tokio::signal;
use tracing::{error, info};
use tracing_subscriber;

use crate::config::Config;
use crate::dex::{raydium::RaydiumMonitor, orca::OrcaMonitor, meteora::MeteoraMonitor};
use crate::opportunity::OpportunityDetector;
use crate::publisher::OpportunityPublisher;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .init();

    info!("Starting MEVrebels Pool Monitor...");

    // Load configuration
    let config = Arc::new(Config::from_env()?);
    info!("Configuration loaded");

    // Initialize Redis publisher
    let publisher = Arc::new(OpportunityPublisher::new(&config.redis_url).await?);
    info!("Redis publisher initialized");

    // Initialize opportunity detector
    let detector = Arc::new(OpportunityDetector::new(config.clone()));
    info!("Opportunity detector initialized");

    // Start DEX monitors
    let raydium_monitor = RaydiumMonitor::new(config.clone(), detector.clone());
    let orca_monitor = OrcaMonitor::new(config.clone(), detector.clone());
    let meteora_monitor = MeteoraMonitor::new(config.clone(), detector.clone());

    info!("Starting DEX monitors...");

    // Spawn monitor tasks
    let raydium_handle = tokio::spawn(async move {
        if let Err(e) = raydium_monitor.start().await {
            error!("Raydium monitor error: {}", e);
        }
    });

    let orca_handle = tokio::spawn(async move {
        if let Err(e) = orca_monitor.start().await {
            error!("Orca monitor error: {}", e);
        }
    });

    let meteora_handle = tokio::spawn(async move {
        if let Err(e) = meteora_monitor.start().await {
            error!("Meteora monitor error: {}", e);
        }
    });

    // Spawn opportunity publisher task
    let publisher_handle = tokio::spawn(async move {
        publisher.start_publishing().await;
    });

    info!("✅ Pool Monitor started successfully");
    info!("Monitoring Raydium, Orca, and Meteora pools...");

    // Wait for shutdown signal
    signal::ctrl_c().await?;
    info!("Shutdown signal received, stopping monitors...");

    // Cancel tasks
    raydium_handle.abort();
    orca_handle.abort();
    meteora_handle.abort();
    publisher_handle.abort();

    info!("Pool Monitor stopped");
    Ok(())
}
