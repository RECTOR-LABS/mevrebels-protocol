use anchor_lang::prelude::*;

/// ExecutionVault holds SOL for mock flashloans
///
/// In production, this would integrate with real flashloan protocols (Solend, marginfi).
/// For MVP/demo, we pre-fund this vault with SOL in tests to simulate flashloan liquidity.
///
/// Upgrade Path:
/// - Replace internal borrow/repay logic with CPI to Solend
/// - Remove pre-funding requirement
/// - Implement proper flashloan callbacks
#[account]
pub struct ExecutionVault {
    /// Authority that can initialize and manage vault (program PDA)
    pub authority: Pubkey,

    /// Total SOL available for flashloans
    pub available_liquidity: u64,

    /// Total SOL currently borrowed (should be 0 after transaction completes)
    pub borrowed_amount: u64,

    /// Total fees collected from flashloans
    pub total_fees_collected: u64,

    /// Total number of successful executions
    pub total_executions: u64,

    /// Total profit distributed (creator + executor + treasury)
    pub total_profit_distributed: u64,

    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl ExecutionVault {
    /// Calculate space required for account
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        8 + // available_liquidity
        8 + // borrowed_amount
        8 + // total_fees_collected
        8 + // total_executions
        8 + // total_profit_distributed
        1; // bump

    /// PDA seeds for vault account
    pub const SEEDS_PREFIX: &'static [u8] = b"execution_vault";
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct FlashloanBorrow {
    /// Amount borrowed (in lamports)
    pub amount: u64,

    /// Fee to be paid on repayment (in lamports)
    pub fee: u64,
}

impl FlashloanBorrow {
    /// Calculate total repayment amount (principal + fee)
    pub fn total_repayment(&self) -> Result<u64> {
        self.amount
            .checked_add(self.fee)
            .ok_or_else(|| error!(crate::error::ExecutionError::ArithmeticOverflow))
    }
}
