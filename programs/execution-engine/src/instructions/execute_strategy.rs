use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::error::ExecutionError;
use dao_governance::{
    program::DaoGovernance,
    cpi::accounts::DepositTreasury as DaoDepositTreasury,
};

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

    // Step 1: Borrow flashloan (mock)
    let flashloan = borrow_flashloan(vault, borrow_amount)?;
    msg!("Borrowed {} lamports from vault", flashloan.amount);
    msg!("Flashloan fee: {} lamports", flashloan.fee);

    // Step 2: Execute mock arbitrage (SOL → USDC → SOL)
    let final_amount = execute_mock_arbitrage(flashloan.amount)?;
    msg!("Arbitrage result: {} lamports", final_amount);

    // Step 3: Repay flashloan
    let repayment_amount = flashloan.total_repayment()?;
    repay_flashloan(vault, repayment_amount)?;
    msg!("Repaid {} lamports to vault", repayment_amount);

    // Step 4: Calculate profit
    let gross_profit = final_amount
        .checked_sub(flashloan.amount)
        .ok_or(ExecutionError::ArithmeticUnderflow)?;

    let net_profit = gross_profit
        .checked_sub(flashloan.fee)
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
        .checked_add(flashloan.fee)
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
        borrowed_amount: flashloan.amount,
        flashloan_fee: flashloan.fee,
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

/// Mock flashloan borrow (transfers from vault to program)
fn borrow_flashloan(vault: &mut ExecutionVault, amount: u64) -> Result<FlashloanBorrow> {
    // Check vault has sufficient liquidity
    require!(
        vault.available_liquidity >= amount,
        ExecutionError::InsufficientVaultLiquidity
    );

    // Calculate fee (0.09%)
    let fee = amount
        .checked_mul(FLASHLOAN_FEE_BPS)
        .ok_or(ExecutionError::ArithmeticOverflow)?
        .checked_div(BPS_DENOMINATOR)
        .ok_or(ExecutionError::ArithmeticOverflow)?;

    // Update vault state
    vault.available_liquidity = vault
        .available_liquidity
        .checked_sub(amount)
        .ok_or(ExecutionError::ArithmeticUnderflow)?;

    vault.borrowed_amount = vault
        .borrowed_amount
        .checked_add(amount)
        .ok_or(ExecutionError::ArithmeticOverflow)?;

    Ok(FlashloanBorrow { amount, fee })
}

/// Mock flashloan repayment (transfers back to vault)
fn repay_flashloan(vault: &mut ExecutionVault, repayment: u64) -> Result<()> {
    // Validate repayment is sufficient
    let borrowed = vault.borrowed_amount;
    require!(
        repayment >= borrowed,
        ExecutionError::InsufficientRepayment
    );

    // Update vault state
    vault.borrowed_amount = 0;
    vault.available_liquidity = vault
        .available_liquidity
        .checked_add(repayment)
        .ok_or(ExecutionError::ArithmeticOverflow)?;

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
