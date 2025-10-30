use anchor_lang::prelude::*;
use crate::{
    constants::*,
    error::StrategyError,
    state::*,
};

#[event]
pub struct StrategyExecuted {
    pub strategy_id: u64,
    pub creator: Pubkey,
    pub executor: Pubkey,
    pub profit: u64,
    pub success: bool,
    pub execution_count: u64,
    pub success_count: u64,
    pub timestamp: i64,
}

#[derive(Accounts)]
pub struct UpdateMetrics<'info> {
    #[account(
        mut,
        seeds = [
            STRATEGY_SEED,
            strategy.creator.as_ref(),
            &strategy.strategy_id.to_le_bytes()
        ],
        bump = strategy.bump
    )]
    pub strategy: Account<'info, StrategyAccount>,

    /// Executor of the strategy (not necessarily the creator)
    pub executor: Signer<'info>,
}

pub fn handler(
    ctx: Context<UpdateMetrics>,
    profit: u64,
    success: bool,
) -> Result<()> {
    let strategy = &mut ctx.accounts.strategy;
    let clock = Clock::get()?;

    // Verify strategy is approved
    require!(
        strategy.is_executable(),
        StrategyError::StrategyNotApproved
    );

    // Update execution count with overflow check
    strategy.execution_count = strategy.execution_count
        .checked_add(1)
        .ok_or(StrategyError::ArithmeticOverflow)?;

    // Update success count if execution was successful
    if success {
        strategy.success_count = strategy.success_count
            .checked_add(1)
            .ok_or(StrategyError::ArithmeticOverflow)?;

        // Update total profit with overflow check
        strategy.total_profit = strategy.total_profit
            .checked_add(profit)
            .ok_or(StrategyError::ArithmeticOverflow)?;
    }

    // Update last execution timestamp
    strategy.last_execution = clock.unix_timestamp;

    // Emit event
    emit!(StrategyExecuted {
        strategy_id: strategy.strategy_id,
        creator: strategy.creator,
        executor: ctx.accounts.executor.key(),
        profit,
        success,
        execution_count: strategy.execution_count,
        success_count: strategy.success_count,
        timestamp: clock.unix_timestamp,
    });

    msg!(
        "Strategy executed: ID={}, Success={}, Profit={}, Success Rate={}%",
        strategy.strategy_id,
        success,
        profit,
        strategy.success_rate()
    );

    Ok(())
}

/// View function to get strategy statistics
/// This is a read-only function that doesn't require a transaction
#[derive(Accounts)]
pub struct GetStrategyStats<'info> {
    #[account(
        seeds = [
            STRATEGY_SEED,
            strategy.creator.as_ref(),
            &strategy.strategy_id.to_le_bytes()
        ],
        bump = strategy.bump
    )]
    pub strategy: Account<'info, StrategyAccount>,
}

pub fn get_strategy_stats(ctx: Context<GetStrategyStats>) -> Result<StrategyStats> {
    let strategy = &ctx.accounts.strategy;
    Ok(StrategyStats::from(&**strategy))
}
