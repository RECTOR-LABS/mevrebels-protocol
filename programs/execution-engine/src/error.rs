use anchor_lang::prelude::*;

#[error_code]
pub enum ExecutionError {
    #[msg("Arithmetic overflow occurred")]
    ArithmeticOverflow,

    #[msg("Arithmetic underflow occurred")]
    ArithmeticUnderflow,

    #[msg("Insufficient vault liquidity for flashloan")]
    InsufficientVaultLiquidity,

    #[msg("Flashloan repayment amount is insufficient")]
    InsufficientRepayment,

    #[msg("Strategy execution resulted in negative profit")]
    NegativeProfit,

    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,

    #[msg("Invalid exchange rate configuration")]
    InvalidExchangeRate,

    #[msg("Invalid profit distribution percentages")]
    InvalidProfitDistribution,

    #[msg("Strategy is not approved for execution")]
    StrategyNotApproved,

    #[msg("Vault is not initialized")]
    VaultNotInitialized,

    #[msg("Invalid token pair for swap")]
    InvalidTokenPair,

    #[msg("DEX not found for token pair")]
    DexNotFound,
}
