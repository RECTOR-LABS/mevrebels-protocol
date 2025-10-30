use anchor_lang::prelude::*;

/// Minimum profit threshold in basis points (0.1%)
pub const MIN_PROFIT_THRESHOLD_BPS: u16 = 10;

/// Maximum slippage in basis points (5%)
pub const MAX_SLIPPAGE_BPS: u16 = 500;

/// PDA seed for strategy accounts
pub const STRATEGY_SEED: &[u8] = b"strategy";

/// PDA seed for global config
pub const CONFIG_SEED: &[u8] = b"config";

/// PDA seed for strategy counter
pub const COUNTER_SEED: &[u8] = b"counter";

/// Maximum number of DEXs per strategy
pub const MAX_DEXS: usize = 5;

/// Maximum number of token pairs per strategy
pub const MAX_TOKEN_PAIRS: usize = 3;

#[constant]
pub const BASIS_POINTS: u16 = 10000;
