use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

pub use constants::*;
pub use error::*;
pub use instructions::*;
pub use state::*;

declare_id!("F1agXX4p3jFV6ASqqv4ZfTNvW94WtJiinvhKH8NZ77VG");

#[program]
pub mod flash_loan {
    use super::*;

    /// Initialize flash loan pool
    ///
    /// Creates a pool that can lend SOL via flash loans.
    /// Pool must be funded separately after initialization.
    ///
    /// # Arguments
    /// * `fee_bps` - Fee in basis points (e.g., 9 = 0.09%)
    pub fn initialize_pool(ctx: Context<InitializePool>, fee_bps: u16) -> Result<()> {
        instructions::initialize_pool::handler(ctx, fee_bps)
    }

    /// Flash borrow with reverse-callback pattern
    ///
    /// Transfers `amount` SOL to borrower, then calls borrower program via CPI.
    /// The borrower program MUST call flash_repay before the transaction ends.
    ///
    /// # Flow
    /// 1. Transfer SOL from pool to borrower
    /// 2. CPI call to borrower_program (reverse-callback)
    /// 3. Borrower executes arbitrage logic
    /// 4. Borrower calls flash_repay to return funds + fee
    /// 5. Pool validates repayment
    ///
    /// # Arguments
    /// * `amount` - Amount to borrow in lamports
    pub fn flash_borrow(ctx: Context<FlashBorrow>, amount: u64) -> Result<()> {
        instructions::flash_borrow::handler(ctx, amount)
    }

    /// Flash repay - validates loan repayment
    ///
    /// Called by borrower to repay flash loan + fee.
    /// Validates that amount repaid >= amount borrowed + fee.
    ///
    /// # Arguments
    /// * `amount_borrowed` - Original borrowed amount
    pub fn flash_repay(ctx: Context<FlashRepay>, amount_borrowed: u64) -> Result<()> {
        instructions::flash_repay::handler(ctx, amount_borrowed)
    }

    /// Deposit liquidity into flash loan pool
    ///
    /// Allows liquidity providers to deposit SOL and earn flash loan fees.
    /// For hackathon: admin deposits test SOL.
    /// For production: open to community LPs.
    pub fn deposit_liquidity(ctx: Context<DepositLiquidity>, amount: u64) -> Result<()> {
        instructions::deposit_liquidity::handler(ctx, amount)
    }
}
