use anchor_lang::prelude::*;

/// Vote choice for a proposal
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum VoteChoice {
    Yes,
    No,
    Abstain,
}

impl Default for VoteChoice {
    fn default() -> Self {
        VoteChoice::Abstain
    }
}

/// Vote record for a specific voter on a specific proposal
/// PDA seeds: [b"vote_record", proposal.key(), voter.key()]
#[account]
#[derive(Default)]
pub struct VoteRecord {
    /// Proposal being voted on
    pub proposal: Pubkey,

    /// Voter address
    pub voter: Pubkey,

    /// Voting power (REBEL token balance at vote time)
    pub vote_weight: u64,

    /// Vote choice
    pub vote_choice: VoteChoice,

    /// When vote was cast
    pub timestamp: i64,

    /// Bump seed for PDA
    pub bump: u8,
}

impl VoteRecord {
    pub const LEN: usize = 8 +  // discriminator
        32 +                    // proposal
        32 +                    // voter
        8 +                     // vote_weight
        1 +                     // vote_choice (enum)
        8 +                     // timestamp
        1;                      // bump
}
