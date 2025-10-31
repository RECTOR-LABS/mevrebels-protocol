use anchor_lang::prelude::*;

/// Flash Loan Pool State
///
/// Stores pool configuration and tracks active flash loans.
/// Uses WSOL token account for liquidity (SPL Token standard).
#[account]
pub struct FlashLoanPool {
    /// Pool authority (PDA)
    pub authority: Pubkey,

    /// WSOL token account holding pool liquidity
    pub pool_token_account: Pubkey,

    /// Fee in basis points (e.g., 9 = 0.09%)
    pub fee_bps: u16,

    /// Total liquidity deposited (for tracking, in WSOL tokens)
    pub total_deposited: u64,

    /// Number of successful flash loans executed
    pub total_loans: u64,

    /// Total fees collected (in WSOL tokens)
    pub total_fees_collected: u64,

    /// Flag indicating if a flash loan is currently active
    /// (prevents reentrancy attacks)
    pub flash_loan_active: bool,

    /// Amount currently borrowed (must be repaid before tx ends)
    pub active_borrow_amount: u64,

    /// PDA bump
    pub bump: u8,
}

impl FlashLoanPool {
    pub const SEEDS_PREFIX: &'static [u8] = b"flash_pool";

    /// Calculate space needed for account
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // pool_token_account
        2 +  // fee_bps
        8 +  // total_deposited
        8 +  // total_loans
        8 +  // total_fees_collected
        1 +  // flash_loan_active
        8 +  // active_borrow_amount
        1;   // bump

    /// Calculate fee for given borrow amount
    pub fn calculate_fee(&self, amount: u64) -> Result<u64> {
        let fee = (amount as u128)
            .checked_mul(self.fee_bps as u128)
            .ok_or(ErrorCode::ArithmeticOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::ArithmeticOverflow)? as u64;
        Ok(fee)
    }

    /// Validate repayment amount includes fee
    pub fn validate_repayment(&self, amount_borrowed: u64, amount_repaid: u64) -> Result<()> {
        let fee = self.calculate_fee(amount_borrowed)?;
        let required = amount_borrowed
            .checked_add(fee)
            .ok_or(ErrorCode::ArithmeticOverflow)?;

        require!(
            amount_repaid >= required,
            ErrorCode::InsufficientRepayment
        );

        Ok(())
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,

    #[msg("Insufficient repayment amount")]
    InsufficientRepayment,
}
