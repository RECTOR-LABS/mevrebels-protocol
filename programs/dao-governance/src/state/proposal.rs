use anchor_lang::prelude::*;

/// Proposal types supported by governance
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum ProposalType {
    /// Approve a strategy for execution (primary type for hackathon)
    StrategyApproval,
    /// Change governance parameters (future)
    ParameterChange,
    /// Treasury spending proposal (future)
    TreasurySpend,
    /// Protocol upgrade proposal (future)
    ProtocolUpgrade,
}

impl Default for ProposalType {
    fn default() -> Self {
        ProposalType::StrategyApproval
    }
}

/// Proposal status lifecycle
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum ProposalStatus {
    /// Voting is active
    Active,
    /// Voting ended, proposal passed (yes > no, quorum reached)
    Succeeded,
    /// Voting ended, proposal failed (no >= yes or quorum not reached)
    Defeated,
    /// Proposal executed on-chain
    Executed,
}

impl Default for ProposalStatus {
    fn default() -> Self {
        ProposalStatus::Active
    }
}

/// Proposal account
/// PDA seeds: [b"proposal", proposal_id.to_le_bytes()]
#[account]
#[derive(Default)]
pub struct Proposal {
    /// Unique proposal ID
    pub proposal_id: u64,

    /// Type of proposal
    pub proposal_type: ProposalType,

    /// Address of proposer
    pub proposer: Pubkey,

    /// Strategy to approve (if ProposalType::StrategyApproval)
    pub strategy_to_approve: Pubkey,

    /// Proposal description (limited to 200 chars for hackathon)
    pub description: String,

    /// When voting starts (unix timestamp)
    pub voting_starts: i64,

    /// When voting ends (unix timestamp)
    pub voting_ends: i64,

    /// Total yes votes (token-weighted)
    pub votes_yes: u64,

    /// Total no votes (token-weighted)
    pub votes_no: u64,

    /// Total abstain votes (token-weighted)
    pub votes_abstain: u64,

    /// Current status
    pub status: ProposalStatus,

    /// Whether proposal has been executed
    pub executed: bool,

    /// Bump seed for PDA
    pub bump: u8,
}

impl Proposal {
    pub const MAX_DESCRIPTION_LEN: usize = 200;

    pub const LEN: usize = 8 +  // discriminator
        8 +                     // proposal_id
        1 +                     // proposal_type (enum)
        32 +                    // proposer
        32 +                    // strategy_to_approve
        4 + Self::MAX_DESCRIPTION_LEN + // description (String with length prefix)
        8 +                     // voting_starts
        8 +                     // voting_ends
        8 +                     // votes_yes
        8 +                     // votes_no
        8 +                     // votes_abstain
        1 +                     // status (enum)
        1 +                     // executed (bool)
        1;                      // bump

    /// Check if voting is active
    pub fn is_voting_active(&self, current_timestamp: i64) -> bool {
        self.status == ProposalStatus::Active
            && current_timestamp >= self.voting_starts
            && current_timestamp <= self.voting_ends
    }

    /// Check if voting has ended
    pub fn has_voting_ended(&self, current_timestamp: i64) -> bool {
        current_timestamp > self.voting_ends
    }

    /// Calculate total votes
    pub fn total_votes(&self) -> u64 {
        self.votes_yes
            .checked_add(self.votes_no)
            .and_then(|sum| sum.checked_add(self.votes_abstain))
            .unwrap_or(0)
    }

    /// Check if proposal succeeded (majority + quorum)
    pub fn check_result(&self, quorum_required: u64) -> ProposalStatus {
        let total = self.total_votes();

        // Check quorum
        if total < quorum_required {
            return ProposalStatus::Defeated;
        }

        // Check majority (yes > no)
        if self.votes_yes > self.votes_no {
            ProposalStatus::Succeeded
        } else {
            ProposalStatus::Defeated
        }
    }
}
