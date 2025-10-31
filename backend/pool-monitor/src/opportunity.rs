/*!
 * Arbitrage opportunity detection
 */

use crate::config::Config;
use crate::types::{ArbitrageOpportunity, DexType, PoolPrice};
use chrono::Utc;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{debug, info};
use uuid::Uuid;

pub struct OpportunityDetector {
    config: Arc<Config>,
    pool_prices: Arc<RwLock<HashMap<String, PoolPrice>>>,
    opportunities: Arc<RwLock<Vec<ArbitrageOpportunity>>>,
}

impl OpportunityDetector {
    pub fn new(config: Arc<Config>) -> Self {
        Self {
            config,
            pool_prices: Arc::new(RwLock::new(HashMap::new())),
            opportunities: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Update pool price and detect opportunities
    pub async fn update_pool_price(&self, price: PoolPrice) {
        let key = format!("{}:{}", price.dex, price.pool_address);

        // Update price in cache
        {
            let mut prices = self.pool_prices.write().await;
            prices.insert(key.clone(), price.clone());
        }

        // Detect opportunities with this new price
        self.detect_opportunities(&price).await;
    }

    /// Detect arbitrage opportunities for a given pool price
    async fn detect_opportunities(&self, new_price: &PoolPrice) {
        let prices = self.pool_prices.read().await;

        // Find all pools with the same token pair
        let matching_pools: Vec<&PoolPrice> = prices
            .values()
            .filter(|p| {
                (p.token_a == new_price.token_a && p.token_b == new_price.token_b)
                    || (p.token_a == new_price.token_b && p.token_b == new_price.token_a)
            })
            .filter(|p| {
                // Don't compare pool with itself
                !(p.dex.to_string() == new_price.dex.to_string()
                    && p.pool_address == new_price.pool_address)
            })
            .collect();

        // Compare prices and find opportunities
        for other_price in matching_pools {
            // Handle inverted pairs
            let (buy_price, sell_price) = if new_price.token_a == other_price.token_a {
                (new_price.price, other_price.price)
            } else {
                (new_price.price, 1.0 / other_price.price)
            };

            // Calculate profit in basis points
            let profit_bps = if buy_price < sell_price {
                ArbitrageOpportunity::calculate_profit_bps(buy_price, sell_price)
            } else {
                ArbitrageOpportunity::calculate_profit_bps(sell_price, buy_price)
            };

            // Check if profit meets minimum threshold
            if profit_bps >= self.config.min_profit_bps {
                let (buy_dex, buy_pool, sell_dex, sell_pool) = if buy_price < sell_price {
                    (
                        new_price.dex.clone(),
                        new_price.pool_address.clone(),
                        other_price.dex.clone(),
                        other_price.pool_address.clone(),
                    )
                } else {
                    (
                        other_price.dex.clone(),
                        other_price.pool_address.clone(),
                        new_price.dex.clone(),
                        new_price.pool_address.clone(),
                    )
                };

                // Calculate expected profit
                // Assume 1 SOL (1_000_000_000 lamports) trade amount for simplicity
                let trade_amount_lamports = 1_000_000_000u64;
                let profit_ratio = (profit_bps as f64) / 10000.0;
                let expected_profit = (trade_amount_lamports as f64 * profit_ratio) as u64;

                let opportunity = ArbitrageOpportunity {
                    id: Uuid::new_v4().to_string(),
                    buy_dex,
                    buy_pool,
                    sell_dex,
                    sell_pool,
                    token_a: new_price.token_a.clone(),
                    token_b: new_price.token_b.clone(),
                    buy_price: buy_price.min(sell_price),
                    sell_price: buy_price.max(sell_price),
                    profit_bps,
                    expected_profit,
                    suggested_amount: trade_amount_lamports,
                    timestamp: Utc::now().timestamp(),
                };

                info!(
                    "🎯 Arbitrage opportunity detected: {} → {} (profit: {} bps, expected: {} lamports)",
                    opportunity.buy_dex,
                    opportunity.sell_dex,
                    opportunity.profit_bps,
                    opportunity.expected_profit
                );

                // Store opportunity
                let mut opportunities = self.opportunities.write().await;
                opportunities.push(opportunity.clone());

                // Clean up old opportunities (older than TTL)
                let ttl_threshold = Utc::now().timestamp() - self.config.opportunity_ttl_seconds as i64;
                opportunities.retain(|opp| opp.timestamp > ttl_threshold);
            }
        }
    }

    /// Get all current opportunities
    pub async fn get_opportunities(&self) -> Vec<ArbitrageOpportunity> {
        let opportunities = self.opportunities.read().await;
        opportunities.clone()
    }

    /// Get opportunity by ID
    pub async fn get_opportunity(&self, id: &str) -> Option<ArbitrageOpportunity> {
        let opportunities = self.opportunities.read().await;
        opportunities.iter().find(|opp| opp.id == id).cloned()
    }

    /// Clear all opportunities
    pub async fn clear_opportunities(&self) {
        let mut opportunities = self.opportunities.write().await;
        opportunities.clear();
        debug!("Cleared all opportunities");
    }
}
