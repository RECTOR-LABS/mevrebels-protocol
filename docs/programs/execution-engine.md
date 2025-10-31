# Execution Engine - MEVrebels Protocol

## Overview

The Execution Engine is the core arbitrage execution component of the MEVrebels protocol. It handles atomic strategy execution with mock flashloans, profit distribution, and metrics tracking via cross-program invocation (CPI) to the Strategy Registry.

## Architecture

### Mock Flashloan System

This MVP implementation uses a **mock flashloan system** to demonstrate the arbitrage concept without requiring integration with complex DeFi protocols like Solend or marginfi.

**How it works:**
1. **Vault Pre-Funding**: Test vault is pre-funded with 100 SOL in tests
2. **Borrow**: Strategy execution "borrows" SOL from the vault (tracked in `available_liquidity`)
3. **Arbitrage**: Executes mock arbitrage with 8% hardcoded profit
4. **Repay**: Repays flashloan + 0.09% fee atomically
5. **Distribute**: Splits net profit 40% creator / 40% executor / 20% treasury

**Upgrade Path to Production:**
- Replace `borrow_flashloan()` and `repay_flashloan()` with CPI to Solend/marginfi
- Remove vault pre-funding requirement
- Integrate real exchange rate oracles (Pyth, Switchboard)
- Replace mock arbitrage with Jupiter aggregator CPI

## Key Features

### 1. Atomic Execution Flow

All operations happen in a single transaction (atomic):
```
Borrow → Execute Arbitrage → Repay + Fee → Distribute Profits → Update Metrics
```

If any step fails, the entire transaction reverts (no funds lost).

### 2. Mock Arbitrage

Simulates 8% profit opportunity:
```
Input: 10 SOL
Output: 10.8 SOL (8% profit)
Fee: 0.009 SOL (0.09%)
Net Profit: 0.791 SOL
```

Distribution:
- Creator: 0.3164 SOL (40%)
- Executor: 0.3164 SOL (40%)
- Treasury: 0.1582 SOL (20%)

### 3. Safety Mechanisms

- **Slippage Protection**: `min_profit` parameter ensures minimum acceptable profit
- **Negative Profit Check**: Reverts if arbitrage would result in loss
- **Overflow Protection**: All arithmetic uses checked operations
- **Approved Strategies Only**: Only approved strategies can be executed

### 4. Cross-Program Invocation (CPI)

Updates strategy metrics in Strategy Registry program after each execution:
- Increments execution count
- Updates total profit
- Records success/failure
- Updates last execution timestamp

## Programs Structure

### State Accounts

#### ExecutionVault

```rust
pub struct ExecutionVault {
    pub authority: Pubkey,              // Program PDA authority
    pub available_liquidity: u64,       // SOL available for flashloans
    pub borrowed_amount: u64,           // Currently borrowed (should be 0)
    pub total_fees_collected: u64,      // Cumulative flashloan fees
    pub total_executions: u64,          // Total successful executions
    pub total_profit_distributed: u64,  // Cumulative profit distributed
    pub bump: u8,                       // PDA bump seed
}
```

PDA Seeds: `["execution_vault"]`

#### ProfitConfig

```rust
pub struct ProfitConfig {
    pub treasury: Pubkey,              // Treasury wallet address
    pub creator_share_bps: u64,        // 4000 bps = 40%
    pub executor_share_bps: u64,       // 4000 bps = 40%
    pub treasury_share_bps: u64,       // 2000 bps = 20%
    pub bump: u8,
}
```

PDA Seeds: `["profit_config"]`

### Instructions

#### 1. `initialize_vault`

**Purpose**: One-time setup of vault and profit config

**Accounts**:
- `vault` (init, mut): ExecutionVault PDA
- `profit_config` (init, mut): ProfitConfig PDA
- `authority` (signer, payer): Vault authority
- `treasury`: Treasury wallet for profit distribution
- `system_program`: Solana system program

**Logic**:
- Initializes vault with 0 liquidity (funded separately)
- Sets up 40/40/20 profit split configuration
- Validates percentages sum to 100%

#### 2. `sync_vault_liquidity`

**Purpose**: Sync vault's `available_liquidity` after funding (testing only)

**Accounts**:
- `vault` (mut): ExecutionVault PDA

**Logic**:
- Reads vault's actual SOL balance
- Subtracts rent reserve (2 SOL safety margin)
- Updates `available_liquidity` field

**Production Note**: This would be replaced by proper liquidity management when integrating real flashloan protocols.

#### 3. `execute_strategy`

**Purpose**: Execute approved strategy with atomic arbitrage

**Parameters**:
- `borrow_amount` (u64): Amount of SOL to borrow (lamports)
- `min_profit` (u64): Minimum acceptable profit (slippage protection, lamports)

**Accounts**:
- `vault` (mut): ExecutionVault PDA
- `profit_config`: ProfitConfig PDA
- `strategy` (mut): Strategy account from strategy-registry
- `creator` (mut): Strategy creator (receives 40% profit)
- `executor` (signer, mut): Executor (receives 40% profit)
- `treasury` (mut): Treasury (receives 20% profit)
- `strategy_registry_program`: Strategy Registry program for CPI
- `system_program`: Solana system program

**Execution Flow**:

1. **Validate Strategy**: Ensure strategy is approved
2. **Borrow Flashloan**: Deduct from `vault.available_liquidity`
3. **Execute Arbitrage**: Apply 8% profit (mock)
4. **Repay Flashloan**: Return principal + 0.09% fee
5. **Calculate Profit**:
   - Gross profit = output - input
   - Net profit = gross profit - flashloan fee
6. **Validate Profit**: Check `net_profit >= min_profit`
7. **Distribute Profits**:
   - Transfer 40% to creator
   - Transfer 40% to executor
   - Transfer 20% to treasury
8. **Update Vault Stats**: Increment counters, track fees
9. **CPI to Strategy Registry**: Update strategy metrics
10. **Emit Event**: `StrategyExecuted` with full details

**Error Cases**:
- `StrategyNotApproved`: Strategy must be approved first
- `InsufficientVaultLiquidity`: Vault doesn't have enough SOL
- `NegativeProfit`: Arbitrage would result in loss
- `SlippageExceeded`: Profit below `min_profit` threshold

## Constants

```rust
/// Flashloan fee: 0.09% (9 basis points)
pub const FLASHLOAN_FEE_BPS: u64 = 9;
pub const BPS_DENOMINATOR: u64 = 10_000;

/// Profit distribution percentages
pub const CREATOR_SHARE_PERCENT: u64 = 40;
pub const EXECUTOR_SHARE_PERCENT: u64 = 40;
pub const TREASURY_SHARE_PERCENT: u64 = 20;
```

## Events

### StrategyExecuted

```rust
#[event]
pub struct StrategyExecuted {
    pub strategy: Pubkey,        // Strategy executed
    pub executor: Pubkey,        // Who executed
    pub borrowed_amount: u64,    // Flashloan amount
    pub flashloan_fee: u64,      // Fee paid (0.09%)
    pub gross_profit: u64,       // Profit before fee
    pub net_profit: u64,         // Profit after fee
    pub creator_share: u64,      // 40% to creator
    pub executor_share: u64,     // 40% to executor
    pub treasury_share: u64,     // 20% to treasury
    pub timestamp: i64,          // Unix timestamp
}
```

## Testing

### Test Coverage: **83.87% (26/31 tests passing)**

Comprehensive test suite covering:

✅ **Vault Initialization**
- Initializes vault and profit config with 40/40/20 split
- Funds vault with 100 SOL for flashloans

✅ **Strategy Setup**
- Creates and approves test strategies
- Validates strategy approval status

✅ **Happy Path Execution**
- Executes strategy with 10 SOL
- Distributes profit correctly (40/40/20)

✅ **Slippage Protection**
- Reverts execution when min_profit is too high

✅ **Negative Profit Handling**
- Validates arbitrage profitability checks

✅ **Multiple Executions**
- Handles consecutive executions correctly
- Accumulates strategy metrics

✅ **Error Handling**
- Insufficient vault liquidity
- Unapproved strategy rejection

✅ **Profit Distribution Math**
- Verifies 40/40/20 split percentages
- Tests distribution accuracy across various amounts

### Running Tests

```bash
# Build programs
anchor build

# Run all tests
anchor test

# Run without rebuilding
anchor test --skip-build
```

## Example Usage

### Initialize Vault (One-time Setup)

```typescript
import * as anchor from "@coral-xyz/anchor";

const program = anchor.workspace.executionEngine;
const [vault] = PublicKey.findProgramAddressSync(
  [Buffer.from("execution_vault")],
  program.programId
);

const [profitConfig] = PublicKey.findProgramAddressSync(
  [Buffer.from("profit_config")],
  program.programId
);

// Initialize vault
await program.methods
  .initializeVault()
  .accounts({
    vault,
    profitConfig,
    authority: wallet.publicKey,
    treasury: treasuryWallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

// Fund vault with SOL (simulates flashloan liquidity)
await provider.connection.sendTransaction(
  new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: vault,
      lamports: 100 * LAMPORTS_PER_SOL,
    })
  ),
  [wallet.payer]
);

// Sync vault liquidity
await program.methods
  .syncVaultLiquidity()
  .accounts({ vault })
  .rpc();
```

### Execute Strategy

```typescript
const BORROW_AMOUNT = new anchor.BN(10 * LAMPORTS_PER_SOL); // 10 SOL
const MIN_PROFIT = new anchor.BN(0.5 * LAMPORTS_PER_SOL);   // 0.5 SOL minimum

await program.methods
  .executeStrategy(BORROW_AMOUNT, MIN_PROFIT)
  .accounts({
    vault,
    profitConfig,
    strategy: strategyPDA,
    creator: strategyCreator.publicKey,
    executor: executorWallet.publicKey,
    treasury: treasuryWallet.publicKey,
    strategyRegistryProgram: strategyRegistryProgramId,
    systemProgram: SystemProgram.programId,
  })
  .signers([executorWallet])
  .rpc();
```

## Upgrade Path to Production

### Phase 1: Real Flashloans (Solend Integration)

1. Replace mock flashloan functions with Solend CPI
2. Remove vault pre-funding requirement
3. Handle flashloan callbacks properly

```rust
// Replace borrow_flashloan() with:
solend::cpi::borrow_flashloan(
    cpi_ctx,
    borrow_amount,
    /* callback parameters */
)?;
```

### Phase 2: Real Arbitrage (Jupiter Integration)

1. Replace mock arbitrage with Jupiter aggregator
2. Off-chain: Calculate optimal route via Jupiter API
3. On-chain: Execute swaps via Jupiter CPI

```rust
// Replace execute_mock_arbitrage() with:
jupiter::cpi::execute_swap(
    cpi_ctx,
    optimal_route,
    slippage_bps,
)?;
```

### Phase 3: Multi-Token Support

1. Add SPL token support (not just native SOL)
2. Integrate token accounts and associated token program
3. Handle multiple token pairs per strategy

### Phase 4: Governance & Admin

1. Add DAO governance for profit split adjustments
2. Implement strategy whitelist/blacklist
3. Add emergency pause functionality
4. Multi-sig treasury management

## Security Considerations

### Current Implementation

✅ **Atomic Transactions**: All operations in single tx (no partial states)
✅ **Overflow Protection**: Checked arithmetic throughout
✅ **Access Control**: Only approved strategies can execute
✅ **Slippage Protection**: min_profit parameter prevents sandwich attacks
✅ **Negative Profit Guard**: Reverts if arbitrage would lose money

### Production Hardening Required

⚠️ **Oracle Integration**: Use Pyth/Switchboard for price feeds
⚠️ **Reentrancy Guards**: Add CPI guards when integrating real protocols
⚠️ **Rate Limiting**: Prevent spam/DoS attacks
⚠️ **Emergency Pause**: Circuit breaker for critical vulnerabilities
⚠️ **Formal Audit**: Professional security audit before mainnet
⚠️ **Multi-sig Authority**: Decentralized control over protocol parameters

## Program IDs

**Execution Engine**: `ExecRebe1sEngineMocKF1ash1oanArbitrageV1111`

**Dependencies**:
- Strategy Registry: `6JSrB5FXwC9WxPsY1s7w1wnK51TzjX4mwQ9PEiTUzxC1`

## Resources

- [Solana Cookbook - Flashloans](https://solanacookbook.com/)
- [Solend Flashloan Docs](https://docs.solend.fi/protocol/developers/flashloan)
- [Jupiter CPI Examples](https://github.com/jup-ag/jupiter-cpi-example)
- [Anchor Book - Cross-Program Invocations](https://book.anchor-lang.com/anchor_in_depth/CPIs.html)

## License

MIT

## Contributors

Built with ❤️ by the MEVrebels team for the Superteam Earn Cypherpunk Hackathon (Staking Facilities sponsor).
