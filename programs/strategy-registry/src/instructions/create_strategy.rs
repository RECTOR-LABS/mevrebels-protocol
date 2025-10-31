use anchor_lang::prelude::*;
use crate::{
    constants::*,
    error::StrategyError,
    state::*,
};

#[event]
pub struct StrategyCreated {
    pub strategy_id: u64,
    pub creator: Pubkey,
    pub dexs: Vec<DexType>,
    pub token_pairs: Vec<TokenPair>,
    pub profit_threshold: u16,
    pub max_slippage: u16,
    pub timestamp: i64,
}

#[derive(Accounts)]
#[instruction(strategy_id: u64)]
pub struct CreateStrategy<'info> {
    #[account(
        init,
        payer = creator,
        space = StrategyAccount::space(MAX_DEXS, MAX_TOKEN_PAIRS),
        seeds = [
            STRATEGY_SEED,
            creator.key().as_ref(),
            &strategy_id.to_le_bytes()
        ],
        bump
    )]
    pub strategy: Account<'info, StrategyAccount>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateStrategy>,
    strategy_id: u64,
    dexs: Vec<DexType>,
    token_pairs: Vec<TokenPair>,
    profit_threshold: u16,
    max_slippage: u16,
) -> Result<()> {
    let strategy = &mut ctx.accounts.strategy;
    let clock = Clock::get()?;

    // Validation: Profit threshold >= 0.1% (10 bps)
    require!(
        profit_threshold >= MIN_PROFIT_THRESHOLD_BPS,
        StrategyError::ProfitThresholdTooLow
    );

    // Validation: Max slippage <= 5% (500 bps)
    require!(
        max_slippage <= MAX_SLIPPAGE_BPS,
        StrategyError::SlippageTooHigh
    );

    // Validation: At least one DEX
    require!(!dexs.is_empty(), StrategyError::NoDexSpecified);

    // Validation: At least one token pair
    require!(!token_pairs.is_empty(), StrategyError::NoTokenPairSpecified);

    // Validation: Check for invalid token pairs (same token for both sides)
    for pair in &token_pairs {
        require!(
            pair.token_a != pair.token_b,
            StrategyError::InvalidTokenPair
        );
    }

    // Validation: Check max limits
    require!(
        dexs.len() <= MAX_DEXS,
        StrategyError::NoDexSpecified
    );

    require!(
        token_pairs.len() <= MAX_TOKEN_PAIRS,
        StrategyError::NoTokenPairSpecified
    );

    // Initialize strategy account
    strategy.creator = ctx.accounts.creator.key();
    strategy.strategy_id = strategy_id;
    strategy.dexs = dexs.clone();
    strategy.token_pairs = token_pairs.clone();
    strategy.profit_threshold = profit_threshold;
    strategy.max_slippage = max_slippage;
    strategy.status = StrategyStatus::Pending;
    strategy.total_profit = 0;
    strategy.execution_count = 0;
    strategy.success_count = 0;
    strategy.last_execution = 0;
    strategy.bump = ctx.bumps.strategy;

    // Emit event for off-chain indexing
    emit!(StrategyCreated {
        strategy_id,
        creator: ctx.accounts.creator.key(),
        dexs,
        token_pairs,
        profit_threshold,
        max_slippage,
        timestamp: clock.unix_timestamp,
    });

    msg!("Strategy created: ID={}, Creator={}", strategy_id, ctx.accounts.creator.key());

    Ok(())
}
