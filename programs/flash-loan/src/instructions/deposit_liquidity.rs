use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
use crate::{FlashLoanPool, FlashLoanError};

#[derive(Accounts)]
pub struct DepositLiquidity<'info> {
    #[account(
        mut,
        seeds = [FlashLoanPool::SEEDS_PREFIX],
        bump = pool.bump
    )]
    pub pool: Account<'info, FlashLoanPool>,

    /// Pool's WSOL token account (destination for deposit)
    #[account(
        mut,
        constraint = pool_token_account.key() == pool.pool_token_account @ FlashLoanError::InvalidTokenAccount
    )]
    pub pool_token_account: Account<'info, TokenAccount>,

    /// Depositor's WSOL token account (source of deposit)
    #[account(mut)]
    pub depositor_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub depositor: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<DepositLiquidity>, amount: u64) -> Result<()> {
    // Transfer WSOL tokens from depositor to pool
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.depositor_token_account.to_account_info(),
                to: ctx.accounts.pool_token_account.to_account_info(),
                authority: ctx.accounts.depositor.to_account_info(),
            },
        ),
        amount,
    )?;

    // Update pool stats
    let pool = &mut ctx.accounts.pool;
    pool.total_deposited = pool
        .total_deposited
        .checked_add(amount)
        .ok_or(FlashLoanError::ArithmeticOverflow)?;

    msg!("Deposited {} WSOL tokens to flash loan pool", amount);
    msg!("Total deposited: {} WSOL tokens", pool.total_deposited);

    Ok(())
}
