pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("6JSrB5FXwC9WxPsY1s7w1wnK51TzjX4mwQ9PEiTUzxC1");

#[program]
pub mod strategy_registry {
    use super::*;

    /// Initialize admin config (one-time setup for hackathon)
    pub fn initialize_admin(ctx: Context<InitializeAdmin>) -> Result<()> {
        approve_strategy::initialize_admin(ctx)
    }

    /// Create a new arbitrage strategy
    pub fn create_strategy(
        ctx: Context<CreateStrategy>,
        strategy_id: u64,
        dexs: Vec<DexType>,
        token_pairs: Vec<TokenPair>,
        profit_threshold: u16,
        max_slippage: u16,
    ) -> Result<()> {
        create_strategy::handler(ctx, strategy_id, dexs, token_pairs, profit_threshold, max_slippage)
    }

    /// Approve a pending strategy (admin-only for hackathon)
    pub fn approve_strategy(ctx: Context<ApproveStrategy>) -> Result<()> {
        approve_strategy::approve_strategy(ctx)
    }

    /// Reject a pending strategy (admin-only for hackathon)
    pub fn reject_strategy(ctx: Context<RejectStrategy>) -> Result<()> {
        approve_strategy::reject_strategy(ctx)
    }

    /// Update strategy metrics after execution (called by execution engine)
    pub fn update_metrics(
        ctx: Context<UpdateMetrics>,
        profit: u64,
        success: bool,
    ) -> Result<()> {
        update_metrics::handler(ctx, profit, success)
    }

    /// Get strategy statistics (view function)
    pub fn get_strategy_stats(ctx: Context<GetStrategyStats>) -> Result<StrategyStats> {
        update_metrics::get_strategy_stats(ctx)
    }
}
