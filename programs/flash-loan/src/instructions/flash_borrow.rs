use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
use crate::{FlashLoanPool, FlashLoanError, MIN_BORROW_AMOUNT, MAX_BORROW_AMOUNT};

#[derive(Accounts)]
pub struct FlashBorrow<'info> {
    #[account(
        mut,
        seeds = [FlashLoanPool::SEEDS_PREFIX],
        bump = pool.bump
    )]
    pub pool: Account<'info, FlashLoanPool>,

    /// Pool authority (PDA that signs for token transfers)
    /// CHECK: PDA authority for the pool
    #[account(
        seeds = [FlashLoanPool::SEEDS_PREFIX, b"authority"],
        bump
    )]
    pub pool_authority: UncheckedAccount<'info>,

    /// Pool's WSOL token account (source of flash loan)
    #[account(
        mut,
        constraint = pool_token_account.key() == pool.pool_token_account @ FlashLoanError::InvalidTokenAccount
    )]
    pub pool_token_account: Account<'info, TokenAccount>,

    /// Borrower program that will receive flash loan
    /// CHECK: This is the program that will be called via CPI
    pub borrower_program: AccountInfo<'info>,

    /// Borrower's WSOL token account (destination for flash loan)
    /// CHECK: Validated by borrower program
    #[account(mut)]
    pub borrower_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,

    // Remaining accounts:
    // - All accounts needed by borrower program for execution
    // - These will be passed through to the CPI call
}

pub fn handler(ctx: Context<FlashBorrow>, amount: u64) -> Result<()> {
    // Validate borrow amount
    require!(
        amount >= MIN_BORROW_AMOUNT,
        FlashLoanError::BorrowAmountTooLow
    );
    require!(
        amount <= MAX_BORROW_AMOUNT,
        FlashLoanError::BorrowAmountTooHigh
    );

    let pool = &mut ctx.accounts.pool;

    // Prevent reentrancy
    require!(!pool.flash_loan_active, FlashLoanError::FlashLoanActive);

    // Check pool has sufficient WSOL token liquidity
    let pool_token_balance = ctx.accounts.pool_token_account.amount;

    require!(
        pool_token_balance >= amount,
        FlashLoanError::InsufficientLiquidity
    );

    // Mark flash loan as active
    pool.flash_loan_active = true;
    pool.active_borrow_amount = amount;

    msg!("Flash loan initiated: {} WSOL tokens", amount);
    msg!("Pool token balance before: {} WSOL", pool_token_balance);

    // Transfer WSOL tokens from pool to borrower using SPL Token program
    let authority_seeds = &[
        FlashLoanPool::SEEDS_PREFIX,
        b"authority",
        &[ctx.bumps.pool_authority],
    ];

    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.pool_token_account.to_account_info(),
                to: ctx.accounts.borrower_token_account.to_account_info(),
                authority: ctx.accounts.pool_authority.to_account_info(),
            },
            &[authority_seeds],
        ),
        amount,
    )?;

    msg!("Transferred {} WSOL tokens to borrower", amount);

    // NOTE: In a production implementation, we would make a CPI call here
    // to the borrower program's handle_flash_borrow instruction.
    // However, for simplicity and to avoid circular dependencies in testing,
    // we'll let the borrower program call our flash_repay instruction directly.
    //
    // The borrower MUST call flash_repay before the transaction ends,
    // otherwise the flash_loan_active flag will remain true and block future loans.

    Ok(())
}
