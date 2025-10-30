/*!
 * Configuration management
 */

use anyhow::Result;
use std::env;

#[derive(Clone)]
pub struct Config {
    pub database_url: String,
    pub helius_rpc: String,
    pub helius_webhook_secret: String,
    pub strategy_registry_program_id: String,
    pub execution_engine_program_id: String,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        dotenvy::dotenv().ok();

        Ok(Config {
            database_url: env::var("DATABASE_URL").expect("DATABASE_URL must be set"),
            helius_rpc: env::var("HELIUS_RPC").expect("HELIUS_RPC must be set"),
            helius_webhook_secret: env::var("HELIUS_WEBHOOK_SECRET").unwrap_or_default(),
            strategy_registry_program_id: env::var("STRATEGY_REGISTRY_PROGRAM_ID")
                .expect("STRATEGY_REGISTRY_PROGRAM_ID must be set"),
            execution_engine_program_id: env::var("EXECUTION_ENGINE_PROGRAM_ID")
                .expect("EXECUTION_ENGINE_PROGRAM_ID must be set"),
        })
    }
}
