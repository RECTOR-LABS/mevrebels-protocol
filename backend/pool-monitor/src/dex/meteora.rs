/*!
 * Meteora DEX integration
 *
 * Monitors Meteora DLMM (Dynamic Liquidity Market Maker) pools via REST API
 */

use crate::config::Config;
use crate::opportunity::OpportunityDetector;
use crate::types::{DexType, PoolPrice};
use anyhow::Result;
use chrono::Utc;
use reqwest::Client;
use serde::Deserialize;
use std::sync::Arc;
use std::time::Duration;
use tokio::time;
use tracing::{error, info};

#[derive(Debug, Deserialize)]
struct MeteoraPoolsResponse {
    data: Vec<MeteoraPool>,
}

#[derive(Debug, Deserialize)]
struct MeteoraPool {
    address: String,
    name: String,
    mint_x: String,
    mint_y: String,
    reserve_x: String,
    reserve_y: String,
    reserve_x_amount: u64,
    reserve_y_amount: u64,
    bin_step: u64,
    current_price: f64,
    apr: f64,
    apy: f64,
    farm_apr: Option<f64>,
    farm_apy: Option<f64>,
    hide: Option<bool>,
}

pub struct MeteoraMonitor {
    config: Arc<Config>,
    detector: Arc<OpportunityDetector>,
    http_client: Client,
}

impl MeteoraMonitor {
    pub fn new(config: Arc<Config>, detector: Arc<OpportunityDetector>) -> Self {
        Self {
            config,
            detector,
            http_client: Client::new(),
        }
    }

    pub async fn start(&self) -> Result<()> {
        info!("Starting Meteora monitor...");

        let api_url = format!("{}/pair/all", self.config.meteora_api);

        loop {
            match self.fetch_pools(&api_url).await {
                Ok(pools) => {
                    info!("Fetched {} Meteora DLMM pools", pools.len());

                    // Process each pool
                    for pool in pools {
                        // Skip hidden pools
                        if pool.hide.unwrap_or(false) {
                            continue;
                        }

                        if let Some(price) = self.parse_pool(&pool) {
                            self.detector.update_pool_price(price).await;
                        }
                    }
                }
                Err(e) => {
                    error!("Error fetching Meteora pools: {}", e);
                }
            }

            // Poll every 30 seconds
            time::sleep(Duration::from_secs(30)).await;
        }
    }

    async fn fetch_pools(&self, url: &str) -> Result<Vec<MeteoraPool>> {
        let response = self
            .http_client
            .get(url)
            .timeout(Duration::from_secs(10))
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Meteora API error: {}",
                response.status()
            ));
        }

        let body = response.json::<MeteoraPoolsResponse>().await?;
        Ok(body.data)
    }

    fn parse_pool(&self, pool: &MeteoraPool) -> Option<PoolPrice> {
        // Meteora provides current_price directly
        let price = pool.current_price;

        if price <= 0.0 {
            return None;
        }

        // Use reserve amounts from the pool data
        let liquidity_x = pool.reserve_x_amount;
        let liquidity_y = pool.reserve_y_amount;

        if liquidity_x == 0 || liquidity_y == 0 {
            return None;
        }

        Some(PoolPrice {
            dex: DexType::Meteora,
            pool_address: pool.address.clone(),
            token_a: pool.mint_x.clone(),
            token_b: pool.mint_y.clone(),
            price,
            liquidity_a: liquidity_x,
            liquidity_b: liquidity_y,
            timestamp: Utc::now().timestamp(),
        })
    }
}
