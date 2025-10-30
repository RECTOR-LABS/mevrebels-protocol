/*!
 * Raydium DEX integration
 *
 * Monitors Raydium AMM pools via REST API (WebSocket not publicly available)
 */

use crate::config::Config;
use crate::opportunity::OpportunityDetector;
use crate::types::{DexType, PoolPrice};
use anyhow::Result;
use chrono::Utc;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;
use tokio::time;
use tracing::{error, info, warn};

#[derive(Debug, Deserialize)]
struct RaydiumPoolsResponse {
    data: Vec<RaydiumPool>,
}

#[derive(Debug, Deserialize)]
struct RaydiumPool {
    #[serde(rename = "ammId")]
    amm_id: String,
    #[serde(rename = "baseMint")]
    base_mint: String,
    #[serde(rename = "quoteMint")]
    quote_mint: String,
    #[serde(rename = "lpMint")]
    lp_mint: String,
    #[serde(rename = "baseDecimals")]
    base_decimals: u8,
    #[serde(rename = "quoteDecimals")]
    quote_decimals: u8,
    #[serde(rename = "lpDecimals")]
    lp_decimals: u8,
    #[serde(rename = "lpSupply")]
    lp_supply: String,
    #[serde(rename = "baseReserve")]
    base_reserve: String,
    #[serde(rename = "quoteReserve")]
    quote_reserve: String,
}

pub struct RaydiumMonitor {
    config: Arc<Config>,
    detector: Arc<OpportunityDetector>,
    http_client: Client,
}

impl RaydiumMonitor {
    pub fn new(config: Arc<Config>, detector: Arc<OpportunityDetector>) -> Self {
        Self {
            config,
            detector,
            http_client: Client::new(),
        }
    }

    pub async fn start(&self) -> Result<()> {
        info!("Starting Raydium monitor...");

        // Note: Raydium doesn't have a public WebSocket API
        // We'll poll their REST API instead
        let api_url = "https://api.raydium.io/v2/ammV3/ammPools";

        loop {
            match self.fetch_pools(api_url).await {
                Ok(pools) => {
                    info!("Fetched {} Raydium pools", pools.len());

                    // Process each pool
                    for pool in pools {
                        if let Some(price) = self.parse_pool(&pool) {
                            self.detector.update_pool_price(price).await;
                        }
                    }
                }
                Err(e) => {
                    error!("Error fetching Raydium pools: {}", e);
                }
            }

            // Poll every 30 seconds (avoid rate limiting)
            time::sleep(Duration::from_secs(30)).await;
        }
    }

    async fn fetch_pools(&self, url: &str) -> Result<Vec<RaydiumPool>> {
        let response = self
            .http_client
            .get(url)
            .timeout(Duration::from_secs(10))
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Raydium API error: {}",
                response.status()
            ));
        }

        let body = response.json::<RaydiumPoolsResponse>().await?;
        Ok(body.data)
    }

    fn parse_pool(&self, pool: &RaydiumPool) -> Option<PoolPrice> {
        // Parse reserves
        let base_reserve = pool.base_reserve.parse::<u64>().ok()?;
        let quote_reserve = pool.quote_reserve.parse::<u64>().ok()?;

        if base_reserve == 0 || quote_reserve == 0 {
            return None;
        }

        // Calculate price (quote per base)
        let base_decimals_factor = 10u64.pow(pool.base_decimals as u32) as f64;
        let quote_decimals_factor = 10u64.pow(pool.quote_decimals as u32) as f64;

        let price = (quote_reserve as f64 / quote_decimals_factor)
            / (base_reserve as f64 / base_decimals_factor);

        Some(PoolPrice {
            dex: DexType::Raydium,
            pool_address: pool.amm_id.clone(),
            token_a: pool.base_mint.clone(),
            token_b: pool.quote_mint.clone(),
            price,
            liquidity_a: base_reserve,
            liquidity_b: quote_reserve,
            timestamp: Utc::now().timestamp(),
        })
    }
}
