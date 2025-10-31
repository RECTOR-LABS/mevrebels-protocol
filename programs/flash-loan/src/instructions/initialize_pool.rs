use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Token, TokenAccount, Mint},
    associated_token::AssociatedToken,
};
use crate::{FlashLoanPool, FlashLoanError, MAX_FEE_BPS, WSOL_MINT};

#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = authority,
        space = FlashLoanPool::LEN,
        seeds = [FlashLoanPool::SEEDS_PREFIX],
        bump
    )]
    pub pool: Account<'info, FlashLoanPool>,

    /// Pool authority (PDA that signs for token transfers)
    /// CHECK: PDA authority for the pool
    #[account(
        seeds = [FlashLoanPool::SEEDS_PREFIX, b"authority"],
        bump
    )]
    pub pool_authority: UncheckedAccount<'info>,

    /// WSOL mint (native SOL wrapped as SPL token)
    #[account(address = WSOL_MINT)]
    pub wsol_mint: Account<'info, Mint>,

    /// Token account to hold pool's WSOL liquidity
    #[account(
        init,
        payer = authority,
        associated_token::mint = wsol_mint,
        associated_token::authority = pool_authority,
    )]
    pub pool_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializePool>, fee_bps: u16) -> Result<()> {
    require!(fee_bps <= MAX_FEE_BPS, FlashLoanError::FeeTooHigh);

    let pool = &mut ctx.accounts.pool;
    pool.authority = ctx.accounts.pool_authority.key();
    pool.pool_token_account = ctx.accounts.pool_token_account.key();
    pool.fee_bps = fee_bps;
    pool.total_deposited = 0;
    pool.total_loans = 0;
    pool.total_fees_collected = 0;
    pool.flash_loan_active = false;
    pool.active_borrow_amount = 0;
    pool.bump = ctx.bumps.pool;

    msg!("Flash loan pool initialized with fee: {} bps", fee_bps);
    msg!("Pool token account: {}", ctx.accounts.pool_token_account.key());

    Ok(())
}
