/*!
 * Configuration management
 */

use anyhow::Result;
use std::env;

#[derive(Clone)]
pub struct Config {
    pub helius_rpc: String,
    pub redis_url: String,
    pub min_profit_bps: u16,
    pub opportunity_ttl_seconds: u64,
    pub raydium_ws: String,
    pub orca_api: String,
    pub meteora_api: String,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        dotenvy::dotenv().ok();

        Ok(Config {
            helius_rpc: env::var("HELIUS_RPC")
                .expect("HELIUS_RPC must be set"),
            redis_url: env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
            min_profit_bps: env::var("MIN_PROFIT_BPS")
                .unwrap_or_else(|_| "50".to_string())
                .parse()
                .expect("MIN_PROFIT_BPS must be a valid u16"),
            opportunity_ttl_seconds: env::var("OPPORTUNITY_TTL_SECONDS")
                .unwrap_or_else(|_| "10".to_string())
                .parse()
                .expect("OPPORTUNITY_TTL_SECONDS must be a valid u64"),
            raydium_ws: "wss://api.raydium.io/v2/ws".to_string(),
            orca_api: "https://api.orca.so".to_string(),
            meteora_api: "https://dlmm-api.meteora.ag".to_string(),
        })
    }
}
