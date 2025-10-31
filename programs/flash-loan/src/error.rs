use anchor_lang::prelude::*;

#[error_code]
pub enum FlashLoanError {
    #[msg("Insufficient pool liquidity for flash loan")]
    InsufficientLiquidity,

    #[msg("Flash loan already active (reentrancy prevented)")]
    FlashLoanActive,

    #[msg("No active flash loan to repay")]
    NoActiveLoan,

    #[msg("Repayment amount insufficient (missing fee)")]
    InsufficientRepayment,

    #[msg("Borrow amount below minimum threshold")]
    BorrowAmountTooLow,

    #[msg("Borrow amount exceeds maximum threshold")]
    BorrowAmountTooHigh,

    #[msg("Fee basis points exceeds maximum allowed")]
    FeeTooHigh,

    #[msg("Arithmetic overflow in calculation")]
    ArithmeticOverflow,

    #[msg("Unauthorized: caller is not pool authority")]
    Unauthorized,

    #[msg("Invalid token account provided")]
    InvalidTokenAccount,
}
