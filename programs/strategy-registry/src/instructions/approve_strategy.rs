use anchor_lang::prelude::*;
use crate::{
    constants::*,
    error::StrategyError,
    state::*,
};

#[event]
pub struct StrategyApproved {
    pub strategy_id: u64,
    pub creator: Pubkey,
    pub approver: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct StrategyRejected {
    pub strategy_id: u64,
    pub creator: Pubkey,
    pub rejecter: Pubkey,
    pub timestamp: i64,
}

/// Admin config account for hackathon (simplified governance)
/// PDA seeds: [b"config"]
#[account]
pub struct AdminConfig {
    pub admin: Pubkey,
    pub bump: u8,
}

impl AdminConfig {
    pub const fn space() -> usize {
        8 +  // discriminator
        32 + // admin pubkey
        1    // bump
    }
}

#[derive(Accounts)]
pub struct ApproveStrategy<'info> {
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

    #[account(
        seeds = [CONFIG_SEED],
        bump = admin_config.bump
    )]
    pub admin_config: Account<'info, AdminConfig>,

    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct RejectStrategy<'info> {
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

    #[account(
        seeds = [CONFIG_SEED],
        bump = admin_config.bump
    )]
    pub admin_config: Account<'info, AdminConfig>,

    pub admin: Signer<'info>,
}

/// Initialize admin config (one-time setup)
#[derive(Accounts)]
pub struct InitializeAdmin<'info> {
    #[account(
        init,
        payer = admin,
        space = AdminConfig::space(),
        seeds = [CONFIG_SEED],
        bump
    )]
    pub admin_config: Account<'info, AdminConfig>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_admin(ctx: Context<InitializeAdmin>) -> Result<()> {
    let admin_config = &mut ctx.accounts.admin_config;
    admin_config.admin = ctx.accounts.admin.key();
    admin_config.bump = ctx.bumps.admin_config;

    msg!("Admin initialized: {}", ctx.accounts.admin.key());
    Ok(())
}

pub fn approve_strategy(ctx: Context<ApproveStrategy>) -> Result<()> {
    let strategy = &mut ctx.accounts.strategy;
    let clock = Clock::get()?;

    // Verify admin authority
    // For hackathon: Also allows DAO governance PDA to approve via CPI
    // The governance PDA will sign the transaction when executing approved proposals
    require!(
        ctx.accounts.admin.key() == ctx.accounts.admin_config.admin,
        StrategyError::UnauthorizedApprover
    );

    // Verify strategy is in Pending status
    require!(
        strategy.status == StrategyStatus::Pending,
        StrategyError::InvalidStatus
    );

    // Update status to Approved
    strategy.status = StrategyStatus::Approved;

    // Emit event
    emit!(StrategyApproved {
        strategy_id: strategy.strategy_id,
        creator: strategy.creator,
        approver: ctx.accounts.admin.key(),
        timestamp: clock.unix_timestamp,
    });

    msg!("Strategy approved: ID={}", strategy.strategy_id);

    Ok(())
}

pub fn reject_strategy(ctx: Context<RejectStrategy>) -> Result<()> {
    let strategy = &mut ctx.accounts.strategy;
    let clock = Clock::get()?;

    // Verify admin authority
    require!(
        ctx.accounts.admin.key() == ctx.accounts.admin_config.admin,
        StrategyError::UnauthorizedApprover
    );

    // Verify strategy is in Pending status
    require!(
        strategy.status == StrategyStatus::Pending,
        StrategyError::InvalidStatus
    );

    // Update status to Rejected
    strategy.status = StrategyStatus::Rejected;

    // Emit event
    emit!(StrategyRejected {
        strategy_id: strategy.strategy_id,
        creator: strategy.creator,
        rejecter: ctx.accounts.admin.key(),
        timestamp: clock.unix_timestamp,
    });

    msg!("Strategy rejected: ID={}", strategy.strategy_id);

    Ok(())
}
