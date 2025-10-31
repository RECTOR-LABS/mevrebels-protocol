use anchor_lang::prelude::*;

/// Status of a strategy in the approval lifecycle
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum StrategyStatus {
    Pending,
    Approved,
    Rejected,
}

/// Supported DEX types for arbitrage
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum DexType {
    Raydium,
    Orca,
    Meteora,
    Phoenix,
    Lifinity,
}

/// Token pair for arbitrage (e.g., SOL/USDC)
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct TokenPair {
    pub token_a: Pubkey,  // First token mint
    pub token_b: Pubkey,  // Second token mint
}

/// Main strategy account - stores all strategy data on-chain
/// PDA seeds: [b"strategy", creator.key(), strategy_id.to_le_bytes()]
#[account]
pub struct StrategyAccount {
    /// Creator of the strategy (immutable)
    pub creator: Pubkey,

    /// Unique identifier for this strategy (per creator)
    pub strategy_id: u64,

    /// DEXs involved in this arbitrage strategy
    pub dexs: Vec<DexType>,

    /// Token pairs for arbitrage
    pub token_pairs: Vec<TokenPair>,

    /// Minimum profit threshold in basis points (e.g., 50 = 0.5%)
    /// Must be >= 10 bps (0.1%)
    pub profit_threshold: u16,

    /// Maximum slippage tolerance in basis points (e.g., 100 = 1%)
    /// Must be <= 500 bps (5%)
    pub max_slippage: u16,

    /// Current status of the strategy
    pub status: StrategyStatus,

    /// Cumulative profit generated (in lamports)
    pub total_profit: u64,

    /// Total number of execution attempts
    pub execution_count: u64,

    /// Number of successful executions
    pub success_count: u64,

    /// Timestamp of last execution (Unix timestamp)
    pub last_execution: i64,

    /// PDA bump seed
    pub bump: u8,
}

impl StrategyAccount {
    /// Calculate space needed for this account
    /// Formula: 8 (discriminator) + data size
    pub const fn space(num_dexs: usize, num_token_pairs: usize) -> usize {
        8 +     // discriminator
        32 +    // creator (Pubkey)
        8 +     // strategy_id (u64)
        4 + (num_dexs * 1) +  // dexs (Vec<DexType>, 1 byte per enum variant)
        4 + (num_token_pairs * 64) +  // token_pairs (Vec<TokenPair>, 64 bytes per pair)
        2 +     // profit_threshold (u16)
        2 +     // max_slippage (u16)
        1 +     // status (StrategyStatus enum, 1 byte)
        8 +     // total_profit (u64)
        8 +     // execution_count (u64)
        8 +     // success_count (u64)
        8 +     // last_execution (i64)
        1       // bump (u8)
    }

    /// Calculate success rate as percentage (0-100)
    pub fn success_rate(&self) -> u8 {
        if self.execution_count == 0 {
            return 0;
        }
        ((self.success_count * 100) / self.execution_count) as u8
    }

    /// Check if strategy is approved and ready for execution
    pub fn is_executable(&self) -> bool {
        self.status == StrategyStatus::Approved
    }

    /// Helper function to get seeds array length for PDA derivation
    /// Note: Actual seeds must be constructed at call site to avoid temporary value issues
    pub const SEED_LEN: usize = 3;
}

/// Performance statistics view (returned by get_strategy_stats)
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct StrategyStats {
    pub strategy_id: u64,
    pub creator: Pubkey,
    pub total_profit: u64,
    pub execution_count: u64,
    pub success_count: u64,
    pub success_rate: u8,
    pub last_execution: i64,
    pub status: StrategyStatus,
}

impl From<&StrategyAccount> for StrategyStats {
    fn from(strategy: &StrategyAccount) -> Self {
        Self {
            strategy_id: strategy.strategy_id,
            creator: strategy.creator,
            total_profit: strategy.total_profit,
            execution_count: strategy.execution_count,
            success_count: strategy.success_count,
            success_rate: strategy.success_rate(),
            last_execution: strategy.last_execution,
            status: strategy.status.clone(),
        }
    }
}
