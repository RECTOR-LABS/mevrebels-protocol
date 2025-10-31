/*!
 * Orca DEX integration
 *
 * Monitors Orca Whirlpools via REST API
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
struct OrcaWhirlpoolsResponse {
    whirlpools: Vec<OrcaWhirlpool>,
}

#[derive(Debug, Deserialize)]
struct OrcaWhirlpool {
    address: String,
    #[serde(rename = "tokenA")]
    token_a: OrcaToken,
    #[serde(rename = "tokenB")]
    token_b: OrcaToken,
    whirlpool_data: WhirlpoolData,
}

#[derive(Debug, Deserialize)]
struct OrcaToken {
    mint: String,
    decimals: u8,
}

#[derive(Debug, Deserialize)]
struct WhirlpoolData {
    #[serde(rename = "tokenVaultA")]
    token_vault_a: String,
    #[serde(rename = "tokenVaultB")]
    token_vault_b: String,
    #[serde(rename = "sqrtPrice")]
    sqrt_price: String,
}

pub struct OrcaMonitor {
    config: Arc<Config>,
    detector: Arc<OpportunityDetector>,
    http_client: Client,
}

impl OrcaMonitor {
    pub fn new(config: Arc<Config>, detector: Arc<OpportunityDetector>) -> Self {
        Self {
            config,
            detector,
            http_client: Client::new(),
        }
    }

    pub async fn start(&self) -> Result<()> {
        info!("Starting Orca monitor...");

        let api_url = format!("{}/v1/whirlpool/list", self.config.orca_api);

        loop {
            match self.fetch_whirlpools(&api_url).await {
                Ok(whirlpools) => {
                    info!("Fetched {} Orca whirlpools", whirlpools.len());

                    // Process each whirlpool
                    for whirlpool in whirlpools {
                        if let Some(price) = self.parse_whirlpool(&whirlpool) {
                            self.detector.update_pool_price(price).await;
                        }
                    }
                }
                Err(e) => {
                    error!("Error fetching Orca whirlpools: {}", e);
                }
            }

            // Poll every 30 seconds
            time::sleep(Duration::from_secs(30)).await;
        }
    }

    async fn fetch_whirlpools(&self, url: &str) -> Result<Vec<OrcaWhirlpool>> {
        let response = self
            .http_client
            .get(url)
            .timeout(Duration::from_secs(10))
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!("Orca API error: {}", response.status()));
        }

        let body = response.json::<OrcaWhirlpoolsResponse>().await?;
        Ok(body.whirlpools)
    }

    fn parse_whirlpool(&self, whirlpool: &OrcaWhirlpool) -> Option<PoolPrice> {
        // Parse sqrt_price to calculate actual price
        // In Whirlpool, price = (sqrt_price / 2^64)^2
        let sqrt_price_str = &whirlpool.whirlpool_data.sqrt_price;
        let sqrt_price_u128 = sqrt_price_str.parse::<u128>().ok()?;

        if sqrt_price_u128 == 0 {
            return None;
        }

        // Calculate price (simplified calculation)
        // Real implementation should use Q64.64 fixed-point math
        let sqrt_price_f64 = sqrt_price_u128 as f64 / (1u128 << 64) as f64;
        let price = sqrt_price_f64 * sqrt_price_f64;

        // For now, use mock liquidity values (real implementation would fetch vault balances)
        let liquidity_a = 1_000_000_000u64; // 1 SOL equivalent
        let liquidity_b = 1_000_000_000u64;

        Some(PoolPrice {
            dex: DexType::Orca,
            pool_address: whirlpool.address.clone(),
            token_a: whirlpool.token_a.mint.clone(),
            token_b: whirlpool.token_b.mint.clone(),
            price,
            liquidity_a,
            liquidity_b,
            timestamp: Utc::now().timestamp(),
        })
    }
}
