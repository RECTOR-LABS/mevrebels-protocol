use anchor_lang::prelude::*;

/// REBEL Token Configuration
pub const REBEL_TOTAL_SUPPLY: u64 = 100_000_000 * 1_000_000_000; // 100M tokens with 9 decimals
pub const REBEL_DECIMALS: u8 = 9;

/// Token Distribution Percentages
pub const COMMUNITY_ALLOCATION: u8 = 40;  // 40% - Strategy creators and executors
pub const TREASURY_ALLOCATION: u8 = 30;   // 30% - DAO treasury for development
pub const TEAM_ALLOCATION: u8 = 20;       // 20% - Early contributors and advisors
pub const LIQUIDITY_ALLOCATION: u8 = 10;  // 10% - DEX liquidity provision

/// Governance Parameters (configurable)
pub const DEFAULT_QUORUM_PERCENTAGE: u8 = 10;  // 10% of circulating supply
pub const DEFAULT_VOTING_PERIOD: i64 = 3 * 24 * 60 * 60;  // 3 days in seconds
pub const MIN_PROPOSAL_THRESHOLD: u64 = 1_000 * 1_000_000_000;  // 1,000 REBEL to propose

/// PDA Seeds
pub const GOVERNANCE_SEED: &[u8] = b"governance";
pub const PROPOSAL_SEED: &[u8] = b"proposal";
pub const VOTE_RECORD_SEED: &[u8] = b"vote_record";
pub const TREASURY_SEED: &[u8] = b"treasury";
pub const COMMUNITY_VAULT_SEED: &[u8] = b"community_vault";
pub const TREASURY_VAULT_SEED: &[u8] = b"treasury_vault";
pub const TEAM_VAULT_SEED: &[u8] = b"team_vault";
pub const LIQUIDITY_VAULT_SEED: &[u8] = b"liquidity_vault";

/// Calculate allocation amounts
pub fn calculate_allocation(percentage: u8) -> u64 {
    (REBEL_TOTAL_SUPPLY * percentage as u64) / 100
}
