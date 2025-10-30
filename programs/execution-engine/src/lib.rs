use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

pub use constants::*;
pub use error::*;
pub use instructions::*;
pub use state::*;

declare_id!("ExecRebe1sEngineMocKF1ash1oanArbitrageV1111");

#[program]
pub mod execution_engine {
    use super::*;

    /// Initialize execution vault and profit configuration
    ///
    /// Sets up infrastructure for mock flashloans and profit distribution.
    /// Vault must be funded separately (in tests, fund with 100 SOL).
    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        instructions::initialize_vault::handler(ctx)
    }

    /// Fund vault with SOL (for testing only - updates available_liquidity)
    ///
    /// In production, this would be replaced with proper liquidity management
    /// via integration with real flashloan protocols (Solend, marginfi).
    ///
    /// # Testing Usage
    /// After vault is initialized and funded via system transfer,
    /// call this to sync the available_liquidity field.
    pub fn sync_vault_liquidity(ctx: Context<SyncVaultLiquidity>) -> Result<()> {
        let vault_balance = ctx.accounts.vault.to_account_info().lamports();

        // Subtract rent exemption (assume ~2 SOL for safety)
        let rent_reserve = 2_000_000_000_u64; // 2 SOL
        let available = vault_balance.saturating_sub(rent_reserve);

        let vault = &mut ctx.accounts.vault;
        vault.available_liquidity = available;
        msg!("Vault liquidity synced: {} lamports available", available);

        Ok(())
    }

    /// Execute arbitrage strategy with mock flashloan
    ///
    /// Atomic transaction flow:
    /// 1. Borrow SOL from vault (mock flashloan with 0.09% fee)
    /// 2. Execute multi-hop arbitrage (SOL → USDC → SOL)
    /// 3. Repay flashloan + fee
    /// 4. Distribute profit (40% creator, 40% executor, 20% treasury)
    /// 5. Update strategy metrics via CPI
    ///
    /// # Arguments
    /// * `borrow_amount` - Amount of SOL to borrow (in lamports)
    /// * `min_profit` - Minimum acceptable profit (slippage protection, in lamports)
    ///
    /// # Errors
    /// * `StrategyNotApproved` - Strategy must be approved first
    /// * `InsufficientVaultLiquidity` - Vault doesn't have enough SOL
    /// * `NegativeProfit` - Execution would result in loss
    /// * `SlippageExceeded` - Profit below min_profit threshold
    pub fn execute_strategy(
        ctx: Context<ExecuteStrategy>,
        borrow_amount: u64,
        min_profit: u64,
    ) -> Result<()> {
        instructions::execute_strategy::handler(ctx, borrow_amount, min_profit)
    }
}

#[derive(Accounts)]
pub struct SyncVaultLiquidity<'info> {
    #[account(
        mut,
        seeds = [ExecutionVault::SEEDS_PREFIX],
        bump = vault.bump
    )]
    pub vault: Account<'info, ExecutionVault>,
}
