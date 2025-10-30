use anchor_lang::prelude::*;

/// Main governance configuration account
/// PDA seeds: [b"governance"]
#[account]
#[derive(Default)]
pub struct GovernanceConfig {
    /// REBEL token mint address
    pub rebel_mint: Pubkey,

    /// Total supply of REBEL tokens (100M with 9 decimals)
    pub total_supply: u64,

    /// Circulating supply (updated as tokens are distributed)
    pub circulating_supply: u64,

    /// Governance authority (PDA)
    pub governance_authority: Pubkey,

    /// Quorum percentage required for proposal to pass (e.g., 10 = 10%)
    pub quorum_percentage: u8,

    /// Voting period in seconds (default: 3 days)
    pub voting_period_seconds: i64,

    /// Minimum REBEL tokens required to create proposal
    pub proposal_threshold: u64,

    /// Next proposal ID (auto-increment)
    pub next_proposal_id: u64,

    /// Total number of proposals created
    pub total_proposals: u64,

    /// Token distribution completed flag
    pub distribution_completed: bool,

    /// Bump seed for PDA
    pub bump: u8,
}

impl GovernanceConfig {
    pub const LEN: usize = 8 +  // discriminator
        32 +                    // rebel_mint
        8 +                     // total_supply
        8 +                     // circulating_supply
        32 +                    // governance_authority
        1 +                     // quorum_percentage
        8 +                     // voting_period_seconds
        8 +                     // proposal_threshold
        8 +                     // next_proposal_id
        8 +                     // total_proposals
        1 +                     // distribution_completed
        1;                      // bump
}
