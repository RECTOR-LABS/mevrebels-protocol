/*!
 * Redis publisher for broadcasting opportunities
 */

use anyhow::Result;
use redis::{AsyncCommands, Client};
use serde_json;
use std::time::Duration;
use tokio::time;
use tracing::{error, info};

use crate::types::ArbitrageOpportunity;

pub struct OpportunityPublisher {
    redis_client: Client,
}

impl OpportunityPublisher {
    pub async fn new(redis_url: &str) -> Result<Self> {
        let redis_client = Client::open(redis_url)?;

        // Test connection
        let mut conn = redis_client.get_multiplexed_async_connection().await?;
        let _: () = conn.ping().await?;

        info!("Redis publisher connected");

        Ok(Self { redis_client })
    }

    /// Publish an opportunity to Redis pub/sub
    pub async fn publish(&self, opportunity: &ArbitrageOpportunity) -> Result<()> {
        let mut conn = self.redis_client.get_multiplexed_async_connection().await?;

        let payload = serde_json::to_string(opportunity)?;

        // Publish to "opportunities" channel
        let _: () = conn.publish("opportunities", &payload).await?;

        // Also store in Redis with TTL for caching
        let key = format!("opportunity:{}", opportunity.id);
        let _: () = conn
            .set_ex(&key, &payload, 10) // 10 second TTL
            .await?;

        info!(
            "Published opportunity {} to Redis ({} bps profit)",
            opportunity.id, opportunity.profit_bps
        );

        Ok(())
    }

    /// Start publishing loop (placeholder for now)
    pub async fn start_publishing(&self) {
        info!("Opportunity publisher started");

        loop {
            time::sleep(Duration::from_secs(1)).await;
            // Opportunities are published immediately when detected
            // This loop is for future background tasks
        }
    }

    /// Get recent opportunities from Redis cache
    pub async fn get_recent_opportunities(&self) -> Result<Vec<ArbitrageOpportunity>> {
        let mut conn = self.redis_client.get_multiplexed_async_connection().await?;

        // Get all opportunity keys
        let keys: Vec<String> = conn.keys("opportunity:*").await?;

        let mut opportunities = Vec::new();

        for key in keys {
            if let Ok(payload) = conn.get::<_, String>(&key).await {
                if let Ok(opportunity) = serde_json::from_str::<ArbitrageOpportunity>(&payload) {
                    opportunities.push(opportunity);
                }
            }
        }

        Ok(opportunities)
    }
}
