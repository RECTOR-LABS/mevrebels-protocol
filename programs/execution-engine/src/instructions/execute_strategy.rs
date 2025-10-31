use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use crate::state::*;
use crate::constants::*;
use crate::error::ExecutionError;
use dao_governance::{
    program::DaoGovernance,
    cpi::accounts::DepositTreasury as DaoDepositTreasury,
};
use flash_loan::program::FlashLoan;

/// Execute arbitrage strategy with mock flashloan
///
/// Atomic flow:
/// 1. Validate strategy is approved
/// 2. Borrow SOL from vault (mock flashloan)
/// 3. Execute multi-hop swaps (SOL → USDC → SOL)
/// 4. Calculate profit after repaying flashloan
/// 5. Distribute profits (40% creator, 40% executor, 20% treasury)
/// 6. Update strategy metrics via CPI
#[derive(Accounts)]
pub struct ExecuteStrategy<'info> {
    #[account(
        mut,
        seeds = [ExecutionVault::SEEDS_PREFIX],
        bump = vault.bump
    )]
    pub vault: Account<'info, ExecutionVault>,

    #[account(
        seeds = [ProfitConfig::SEEDS_PREFIX],
        bump = profit_config.bump
    )]
    pub profit_config: Account<'info, ProfitConfig>,

    /// Strategy account from strategy-registry program
    #[account(mut)]
    pub strategy: Account<'info, strategy_registry::StrategyAccount>,

    /// Strategy creator (receives 40% of profit)
    #[account(mut)]
    pub creator: SystemAccount<'info>,

    /// Executor (receives 40% of profit)
    #[account(mut)]
    pub executor: Signer<'info>,

    /// Treasury (receives 20% of profit) - DAO Treasury PDA
    #[account(
        mut,
        address = profit_config.treasury
    )]
    pub treasury: SystemAccount<'info>,

    /// DAO Governance program for treasury deposit CPI
    pub dao_governance_program: Program<'info, DaoGovernance>,

    /// Strategy registry program for CPI
    pub strategy_registry_program: Program<'info, strategy_registry::program::StrategyRegistry>,

    /// Flash loan pool account
    #[account(mut)]
    pub flash_loan_pool: Account<'info, flash_loan::FlashLoanPool>,

    /// Flash loan pool authority (PDA)
    /// CHECK: PDA authority validated by flash_loan program
    pub flash_loan_pool_authority: UncheckedAccount<'info>,

    /// Flash loan pool's WSOL token account
    #[account(mut)]
    pub flash_loan_pool_token_account: Account<'info, TokenAccount>,

    /// Vault's WSOL token account (for borrowing/repaying)
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// Flash loan program for CPI
    pub flash_loan_program: Program<'info, FlashLoan>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

/// Event emitted after successful execution
#[event]
pub struct StrategyExecuted {
    pub strategy: Pubkey,
    pub executor: Pubkey,
    pub borrowed_amount: u64,
    pub flashloan_fee: u64,
    pub gross_profit: u64,
    pub net_profit: u64,
    pub creator_share: u64,
    pub executor_share: u64,
    pub treasury_share: u64,
    pub timestamp: i64,
}

pub fn handler(
    ctx: Context<ExecuteStrategy>,
    borrow_amount: u64,
    min_profit: u64,
) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    let profit_config = &ctx.accounts.profit_config;
    let strategy = &ctx.accounts.strategy;

    // Validate strategy is approved
    require!(
        strategy.is_executable(),
        ExecutionError::StrategyNotApproved
    );

    // Step 1: Borrow from flash loan pool via CPI
    borrow_from_flash_loan_pool(
        &ctx.accounts.flash_loan_program.to_account_info(),
        &ctx.accounts.flash_loan_pool.to_account_info(),
        &ctx.accounts.flash_loan_pool_authority.to_account_info(),
        &ctx.accounts.flash_loan_pool_token_account.to_account_info(),
        &ctx.accounts.vault_token_account.to_account_info(),
        &ctx.accounts.token_program.to_account_info(),
        borrow_amount,
    )?;

    // Calculate flashloan fee (0.09%)
    let flashloan_fee = ctx.accounts.flash_loan_pool.calculate_fee(borrow_amount)?;
    msg!("Borrowed {} lamports from flash loan pool", borrow_amount);
    msg!("Flashloan fee: {} lamports", flashloan_fee);

    // Step 2: Execute mock arbitrage (SOL → USDC → SOL)
    let final_amount = execute_mock_arbitrage(borrow_amount)?;
    msg!("Arbitrage result: {} lamports", final_amount);

    // Step 3: Repay flash loan via CPI
    let repayment_amount = borrow_amount
        .checked_add(flashloan_fee)
        .ok_or(ExecutionError::ArithmeticOverflow)?;

    // Get vault bump for signing
    let vault_bump = vault.bump;

    repay_to_flash_loan_pool(
        &ctx.accounts.flash_loan_program.to_account_info(),
        &ctx.accounts.flash_loan_pool.to_account_info(),
        &ctx.accounts.flash_loan_pool_authority.to_account_info(),
        &ctx.accounts.flash_loan_pool_token_account.to_account_info(),
        &ctx.accounts.vault_token_account.to_account_info(),
        &vault.to_account_info(),
        &ctx.accounts.token_program.to_account_info(),
        borrow_amount,
        vault_bump,
    )?;
    msg!("Repaid {} WSOL tokens to flash loan pool", repayment_amount);

    // Step 4: Calculate profit
    let gross_profit = final_amount
        .checked_sub(borrow_amount)
        .ok_or(ExecutionError::ArithmeticUnderflow)?;

    let net_profit = gross_profit
        .checked_sub(flashloan_fee)
        .ok_or(ExecutionError::NegativeProfit)?;

    // Validate minimum profit (slippage protection)
    require!(
        net_profit >= min_profit,
        ExecutionError::SlippageExceeded
    );

    msg!("Gross profit: {} lamports", gross_profit);
    msg!("Net profit: {} lamports", net_profit);

    // Step 5: Distribute profits (40/40/20)
    let (creator_share, executor_share, treasury_share) =
        profit_config.calculate_distribution(net_profit)?;

    msg!(
        "Distributing profits: creator={}, executor={}, treasury={}",
        creator_share,
        executor_share,
        treasury_share
    );

    // Transfer creator share
    transfer_lamports(
        &vault.to_account_info(),
        &ctx.accounts.creator.to_account_info(),
        creator_share,
        &[&[ExecutionVault::SEEDS_PREFIX, &[vault.bump]]],
    )?;

    // Transfer executor share
    transfer_lamports(
        &vault.to_account_info(),
        &ctx.accounts.executor.to_account_info(),
        executor_share,
        &[&[ExecutionVault::SEEDS_PREFIX, &[vault.bump]]],
    )?;

    // Transfer treasury share
    let vault_bump = vault.bump;
    transfer_lamports(
        &vault.to_account_info(),
        &ctx.accounts.treasury.to_account_info(),
        treasury_share,
        &[&[ExecutionVault::SEEDS_PREFIX, &[vault_bump]]],
    )?;

    // Drop mutable borrow before CPI
    drop(vault);

    // CPI to DAO governance to record treasury deposit
    deposit_to_dao_treasury(
        ctx.accounts.dao_governance_program.to_account_info(),
        ctx.accounts.treasury.to_account_info(),
        ctx.accounts.vault.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        treasury_share,
        vault_bump,
    )?;

    // Re-borrow vault for stats update
    let vault = &mut ctx.accounts.vault;

    // Step 6: Update vault stats
    vault.total_executions = vault
        .total_executions
        .checked_add(1)
        .ok_or(ExecutionError::ArithmeticOverflow)?;

    vault.total_profit_distributed = vault
        .total_profit_distributed
        .checked_add(net_profit)
        .ok_or(ExecutionError::ArithmeticOverflow)?;

    vault.total_fees_collected = vault
        .total_fees_collected
        .checked_add(flashloan_fee)
        .ok_or(ExecutionError::ArithmeticOverflow)?;

    // Step 7: Update strategy metrics via CPI
    update_strategy_metrics(
        ctx.accounts.strategy_registry_program.to_account_info(),
        ctx.accounts.strategy.to_account_info(),
        ctx.accounts.executor.to_account_info(),
        net_profit,
    )?;

    // Emit event
    emit!(StrategyExecuted {
        strategy: strategy.key(),
        executor: ctx.accounts.executor.key(),
        borrowed_amount: borrow_amount,
        flashloan_fee,
        gross_profit,
        net_profit,
        creator_share,
        executor_share,
        treasury_share,
        timestamp: Clock::get()?.unix_timestamp,
    });

    msg!("Strategy executed successfully!");

    Ok(())
}

// ========== Internal Helper Functions ==========

/// Borrow from flash loan pool via CPI
fn borrow_from_flash_loan_pool<'info>(
    flash_loan_program: &AccountInfo<'info>,
    flash_loan_pool: &AccountInfo<'info>,
    pool_authority: &AccountInfo<'info>,
    pool_token_account: &AccountInfo<'info>,
    borrower_token_account: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    amount: u64,
) -> Result<()> {
    // Build CPI accounts for WSOL token-based flash loan
    let cpi_accounts = flash_loan::cpi::accounts::FlashBorrow {
        pool: flash_loan_pool.clone(),
        pool_authority: pool_authority.clone(),
        pool_token_account: pool_token_account.clone(),
        borrower_program: flash_loan_program.clone(),
        borrower_token_account: borrower_token_account.clone(),
        token_program: token_program.clone(),
    };

    let cpi_ctx = CpiContext::new(flash_loan_program.clone(), cpi_accounts);

    // Call flash_borrow instruction
    flash_loan::cpi::flash_borrow(cpi_ctx, amount)?;

    msg!("Flash loan borrowed via CPI: {} WSOL tokens", amount);

    Ok(())
}

/// Repay to flash loan pool via CPI
fn repay_to_flash_loan_pool<'info>(
    flash_loan_program: &AccountInfo<'info>,
    flash_loan_pool: &AccountInfo<'info>,
    pool_authority: &AccountInfo<'info>,
    pool_token_account: &AccountInfo<'info>,
    borrower_token_account: &AccountInfo<'info>,
    borrower: &AccountInfo<'info>,
    token_program: &AccountInfo<'info>,
    amount_borrowed: u64,
    vault_bump: u8,
) -> Result<()> {
    // Build CPI accounts for WSOL token-based repayment
    let cpi_accounts = flash_loan::cpi::accounts::FlashRepay {
        pool: flash_loan_pool.clone(),
        pool_authority: pool_authority.clone(),
        pool_token_account: pool_token_account.clone(),
        borrower_token_account: borrower_token_account.clone(),
        borrower: borrower.clone(),
        token_program: token_program.clone(),
    };

    // Sign with vault PDA
    let signer_seeds: &[&[&[u8]]] = &[&[
        ExecutionVault::SEEDS_PREFIX,
        &[vault_bump],
    ]];

    let cpi_ctx = CpiContext::new_with_signer(
        flash_loan_program.clone(),
        cpi_accounts,
        signer_seeds,
    );

    // Call flash_repay instruction
    flash_loan::cpi::flash_repay(cpi_ctx, amount_borrowed)?;

    msg!("Flash loan repaid via CPI");

    Ok(())
}

/// Execute mock arbitrage: SOL → USDC → SOL with 8% profit margin
///
/// This simulates the following trade with simplified calculations:
/// 1. Borrow 10 SOL
/// 2. Apply 8% profit directly (10 * 1.08 = 10.8 SOL)
/// 3. Result: 10.8 SOL
///
/// This avoids large number issues from mock exchange rates while
/// demonstrating the arbitrage concept clearly.
fn execute_mock_arbitrage(input_sol: u64) -> Result<u64> {
    // Calculate 8% profit directly
    // Formula: output = input * 108 / 100
    let profit_multiplier_numerator = 108_u64;
    let profit_multiplier_denominator = 100_u64;

    let output_sol = input_sol
        .checked_mul(profit_multiplier_numerator)
        .ok_or(ExecutionError::ArithmeticOverflow)?
        .checked_div(profit_multiplier_denominator)
        .ok_or(ExecutionError::ArithmeticOverflow)?;

    msg!("Mock arbitrage: {} lamports → {} lamports (8% profit)", input_sol, output_sol);

    // Validate we made profit
    require!(
        output_sol > input_sol,
        ExecutionError::NegativeProfit
    );

    Ok(output_sol)
}

/// Transfer lamports from vault PDA to recipient
///
/// Manual lamport transfer is required because vault is a PDA with data,
/// and system_program::transfer doesn't support transferring from accounts with data.
/// This approach maintains Solana's account balance invariant by ensuring the
/// sum of lamports before and after the instruction remains constant.
fn transfer_lamports<'info>(
    from: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    amount: u64,
    _signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    // Get current balances
    let from_lamports = from.lamports();
    let to_lamports = to.lamports();

    // Calculate new balances
    let new_from_lamports = from_lamports
        .checked_sub(amount)
        .ok_or(ExecutionError::ArithmeticUnderflow)?;

    let new_to_lamports = to_lamports
        .checked_add(amount)
        .ok_or(ExecutionError::ArithmeticOverflow)?;

    // Update balances atomically
    **from.lamports.borrow_mut() = new_from_lamports;
    **to.lamports.borrow_mut() = new_to_lamports;

    Ok(())
}

/// Update strategy metrics via CPI to strategy-registry program
fn update_strategy_metrics<'info>(
    strategy_registry_program: AccountInfo<'info>,
    strategy_account: AccountInfo<'info>,
    executor_account: AccountInfo<'info>,
    profit: u64,
) -> Result<()> {
    // Build CPI context
    let cpi_accounts = strategy_registry::cpi::accounts::UpdateMetrics {
        strategy: strategy_account,
        executor: executor_account,
    };

    let cpi_ctx = CpiContext::new(strategy_registry_program, cpi_accounts);

    // Call update_metrics instruction
    strategy_registry::cpi::update_metrics(cpi_ctx, profit, true)?;

    msg!("Updated strategy metrics via CPI");

    Ok(())
}

/// Deposit to DAO treasury via CPI to dao-governance program
/// Records the treasury deposit in DAO governance tracking
fn deposit_to_dao_treasury<'info>(
    dao_governance_program: AccountInfo<'info>,
    treasury_account: AccountInfo<'info>,
    vault_account: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
    amount: u64,
    vault_bump: u8,
) -> Result<()> {
    // Build CPI context
    let cpi_accounts = DaoDepositTreasury {
        treasury: treasury_account,
        depositor: vault_account.clone(),
        system_program,
    };

    let vault_seed = ExecutionVault::SEEDS_PREFIX;
    let bump = &[vault_bump];
    let signer_seeds: &[&[&[u8]]] = &[&[vault_seed, bump]];

    let cpi_ctx = CpiContext::new_with_signer(
        dao_governance_program,
        cpi_accounts,
        signer_seeds,
    );

    // Call deposit_treasury instruction
    dao_governance::cpi::deposit_treasury(cpi_ctx, amount)?;

    msg!("Deposited {} lamports to DAO treasury via CPI", amount);

    Ok(())
}
