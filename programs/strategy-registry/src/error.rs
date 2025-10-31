use anchor_lang::prelude::*;

#[error_code]
pub enum StrategyError {
    #[msg("Profit threshold must be at least 10 basis points (0.1%)")]
    ProfitThresholdTooLow,

    #[msg("Max slippage cannot exceed 500 basis points (5%)")]
    SlippageTooHigh,

    #[msg("Strategy must have at least one DEX")]
    NoDexSpecified,

    #[msg("Strategy must have at least one token pair")]
    NoTokenPairSpecified,

    #[msg("Token pair cannot have identical tokens")]
    InvalidTokenPair,

    #[msg("Strategy status is not Pending, cannot approve")]
    InvalidStatus,

    #[msg("Strategy is not approved for execution")]
    StrategyNotApproved,

    #[msg("Only admin can approve strategies")]
    UnauthorizedApprover,

    #[msg("Arithmetic overflow occurred")]
    ArithmeticOverflow,

    #[msg("Strategy ID counter overflow")]
    StrategyIdOverflow,
}
