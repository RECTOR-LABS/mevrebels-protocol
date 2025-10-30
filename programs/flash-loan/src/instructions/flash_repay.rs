use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
use crate::{FlashLoanPool, FlashLoanError};

#[derive(Accounts)]
pub struct FlashRepay<'info> {
    #[account(
        mut,
        seeds = [FlashLoanPool::SEEDS_PREFIX],
        bump = pool.bump
    )]
    pub pool: Account<'info, FlashLoanPool>,

    /// Pool authority (PDA - not used for signing here, but for validation)
    /// CHECK: PDA authority for the pool
    #[account(
        seeds = [FlashLoanPool::SEEDS_PREFIX, b"authority"],
        bump
    )]
    pub pool_authority: UncheckedAccount<'info>,

    /// Pool's WSOL token account (destination for repayment)
    #[account(
        mut,
        constraint = pool_token_account.key() == pool.pool_token_account @ FlashLoanError::InvalidTokenAccount
    )]
    pub pool_token_account: Account<'info, TokenAccount>,

    /// Borrower's WSOL token account (source of repayment)
    /// CHECK: Any token account can repay
    #[account(mut)]
    pub borrower_token_account: Account<'info, TokenAccount>,

    /// Borrower/Signer repaying the loan
    pub borrower: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<FlashRepay>, amount_borrowed: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    // Verify flash loan is active
    require!(pool.flash_loan_active, FlashLoanError::NoActiveLoan);

    // Verify borrowed amount matches
    require!(
        pool.active_borrow_amount == amount_borrowed,
        FlashLoanError::InsufficientRepayment
    );

    // Calculate required repayment (principal + fee)
    let fee = pool.calculate_fee(amount_borrowed)?;
    let required_repayment = amount_borrowed
        .checked_add(fee)
        .ok_or(FlashLoanError::ArithmeticOverflow)?;

    msg!("Flash loan repayment initiated");
    msg!("Borrowed: {} WSOL tokens", amount_borrowed);
    msg!("Fee: {} WSOL tokens", fee);
    msg!("Required repayment: {} WSOL tokens", required_repayment);

    // Transfer repayment (principal + fee) from borrower to pool using SPL Token
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.borrower_token_account.to_account_info(),
                to: ctx.accounts.pool_token_account.to_account_info(),
                authority: ctx.accounts.borrower.to_account_info(),
            },
        ),
        required_repayment,
    )?;

    msg!("Repayment successful");

    // Update pool stats
    pool.flash_loan_active = false;
    pool.active_borrow_amount = 0;
    pool.total_loans = pool
        .total_loans
        .checked_add(1)
        .ok_or(FlashLoanError::ArithmeticOverflow)?;
    pool.total_fees_collected = pool
        .total_fees_collected
        .checked_add(fee)
        .ok_or(FlashLoanError::ArithmeticOverflow)?;

    msg!("Total loans executed: {}", pool.total_loans);
    msg!("Total fees collected: {} WSOL tokens", pool.total_fees_collected);

    Ok(())
}
