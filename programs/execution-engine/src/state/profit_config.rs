use anchor_lang::prelude::*;

/// ProfitConfig defines how profits are distributed
///
/// Default: 40% creator, 40% executor, 20% treasury
/// Can be adjusted via governance in future versions
#[account]
pub struct ProfitConfig {
    /// Treasury wallet receiving treasury share
    pub treasury: Pubkey,

    /// Creator share percentage (basis points, e.g., 4000 = 40%)
    pub creator_share_bps: u64,

    /// Executor share percentage (basis points, e.g., 4000 = 40%)
    pub executor_share_bps: u64,

    /// Treasury share percentage (basis points, e.g., 2000 = 20%)
    pub treasury_share_bps: u64,

    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl ProfitConfig {
    /// Calculate space required for account
    pub const LEN: usize = 8 + // discriminator
        32 + // treasury
        8 + // creator_share_bps
        8 + // executor_share_bps
        8 + // treasury_share_bps
        1; // bump

    /// PDA seeds for config account
    pub const SEEDS_PREFIX: &'static [u8] = b"profit_config";

    /// Validate that percentages sum to 10000 basis points (100%)
    pub fn validate(&self) -> Result<()> {
        let total = self
            .creator_share_bps
            .checked_add(self.executor_share_bps)
            .ok_or(error!(crate::error::ExecutionError::ArithmeticOverflow))?
            .checked_add(self.treasury_share_bps)
            .ok_or(error!(crate::error::ExecutionError::ArithmeticOverflow))?;

        require_eq!(
            total,
            10_000,
            crate::error::ExecutionError::InvalidProfitDistribution
        );

        Ok(())
    }

    /// Calculate profit distribution amounts
    pub fn calculate_distribution(
        &self,
        total_profit: u64,
    ) -> Result<(u64, u64, u64)> {
        // Calculate creator share
        let creator_share = total_profit
            .checked_mul(self.creator_share_bps)
            .ok_or(error!(crate::error::ExecutionError::ArithmeticOverflow))?
            .checked_div(10_000)
            .ok_or(error!(crate::error::ExecutionError::ArithmeticOverflow))?;

        // Calculate executor share
        let executor_share = total_profit
            .checked_mul(self.executor_share_bps)
            .ok_or(error!(crate::error::ExecutionError::ArithmeticOverflow))?
            .checked_div(10_000)
            .ok_or(error!(crate::error::ExecutionError::ArithmeticOverflow))?;

        // Treasury gets remainder to avoid rounding errors
        let treasury_share = total_profit
            .checked_sub(creator_share)
            .ok_or(error!(crate::error::ExecutionError::ArithmeticUnderflow))?
            .checked_sub(executor_share)
            .ok_or(error!(crate::error::ExecutionError::ArithmeticUnderflow))?;

        Ok((creator_share, executor_share, treasury_share))
    }
}
