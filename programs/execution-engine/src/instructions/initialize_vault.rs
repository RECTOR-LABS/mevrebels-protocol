use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;

/// Initialize execution vault and profit config
///
/// This sets up the infrastructure for mock flashloans and profit distribution.
/// In tests, the vault will be pre-funded with SOL to simulate flashloan liquidity.
#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = authority,
        space = ExecutionVault::LEN,
        seeds = [ExecutionVault::SEEDS_PREFIX],
        bump
    )]
    pub vault: Account<'info, ExecutionVault>,

    #[account(
        init,
        payer = authority,
        space = ProfitConfig::LEN,
        seeds = [ProfitConfig::SEEDS_PREFIX],
        bump
    )]
    pub profit_config: Account<'info, ProfitConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// Treasury wallet for profit distribution
    /// CHECK: Treasury can be any valid pubkey
    pub treasury: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeVault>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let profit_config = &mut ctx.accounts.profit_config;

    // Initialize vault
    vault.authority = ctx.accounts.authority.key();
    vault.available_liquidity = 0; // Will be funded separately in tests
    vault.borrowed_amount = 0;
    vault.total_fees_collected = 0;
    vault.total_executions = 0;
    vault.total_profit_distributed = 0;
    vault.bump = ctx.bumps.vault;

    // Initialize profit config with default 40/40/20 split
    profit_config.treasury = ctx.accounts.treasury.key();
    profit_config.creator_share_bps = CREATOR_SHARE_PERCENT * 100; // 40% = 4000 bps
    profit_config.executor_share_bps = EXECUTOR_SHARE_PERCENT * 100; // 40% = 4000 bps
    profit_config.treasury_share_bps = TREASURY_SHARE_PERCENT * 100; // 20% = 2000 bps
    profit_config.bump = ctx.bumps.profit_config;

    // Validate profit distribution percentages
    profit_config.validate()?;

    msg!("Execution vault initialized");
    msg!("Treasury: {}", profit_config.treasury);
    msg!("Profit split: {}% creator, {}% executor, {}% treasury",
        CREATOR_SHARE_PERCENT,
        EXECUTOR_SHARE_PERCENT,
        TREASURY_SHARE_PERCENT
    );

    Ok(())
}
