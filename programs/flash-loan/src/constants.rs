use anchor_lang::prelude::*;

/// WSOL (Wrapped SOL) mint address
/// Native SOL wrapped as SPL token for flash loan transfers
/// So11111111111111111111111111111111111111112
pub const WSOL_MINT: Pubkey = Pubkey::new_from_array([
    6, 155, 136, 87, 254, 171, 129, 132, 251, 104, 127, 99, 70, 24, 192, 53,
    218, 196, 57, 220, 26, 235, 59, 85, 152, 160, 240, 0, 0, 0, 0, 1
]);

/// Default flash loan fee in basis points (0.09% = 9 bps)
/// Matches our mock implementation for consistency
pub const DEFAULT_FEE_BPS: u16 = 9;

/// Maximum fee in basis points (1% = 100 bps)
/// Prevents excessive fees
pub const MAX_FEE_BPS: u16 = 100;

/// Minimum borrow amount (0.01 SOL)
/// Prevents dust attacks
pub const MIN_BORROW_AMOUNT: u64 = 10_000_000; // 0.01 SOL

/// Maximum borrow amount (1000 SOL)
/// Limits risk per transaction
pub const MAX_BORROW_AMOUNT: u64 = 1_000_000_000_000; // 1000 SOL
