/*!
 * Shared data types
 */

use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DexType {
    Raydium,
    Orca,
    Meteora,
    Phoenix,
    Lifinity,
}

impl fmt::Display for DexType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DexType::Raydium => write!(f, "raydium"),
            DexType::Orca => write!(f, "orca"),
            DexType::Meteora => write!(f, "meteora"),
            DexType::Phoenix => write!(f, "phoenix"),
            DexType::Lifinity => write!(f, "lifinity"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PoolPrice {
    pub dex: DexType,
    pub pool_address: String,
    pub token_a: String,
    pub token_b: String,
    pub price: f64,           // token_b per token_a
    pub liquidity_a: u64,
    pub liquidity_b: u64,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArbitrageOpportunity {
    pub id: String,
    pub buy_dex: DexType,
    pub buy_pool: String,
    pub sell_dex: DexType,
    pub sell_pool: String,
    pub token_a: String,
    pub token_b: String,
    pub buy_price: f64,
    pub sell_price: f64,
    pub profit_bps: u16,          // Profit in basis points (1 bps = 0.01%)
    pub expected_profit: u64,     // Expected profit in lamports
    pub suggested_amount: u64,    // Suggested trade amount in lamports
    pub timestamp: i64,
}

impl ArbitrageOpportunity {
    pub fn calculate_profit_bps(buy_price: f64, sell_price: f64) -> u16 {
        let profit_ratio = (sell_price - buy_price) / buy_price;
        (profit_ratio * 10000.0) as u16
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RaydiumPoolUpdate {
    pub pool_id: String,
    pub token_a_mint: String,
    pub token_b_mint: String,
    pub token_a_amount: String,
    pub token_b_amount: String,
    pub price: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrcaPool {
    pub address: String,
    pub token_a: OrcaToken,
    pub token_b: OrcaToken,
    pub liquidity: OrcaLiquidity,
    pub price: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrcaToken {
    pub mint: String,
    pub decimals: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrcaLiquidity {
    pub token_a: u64,
    pub token_b: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MeteoraPool {
    pub address: String,
    pub name: String,
    pub mint_x: String,
    pub mint_y: String,
    pub reserve_x: String,
    pub reserve_y: String,
    pub current_price: f64,
}
