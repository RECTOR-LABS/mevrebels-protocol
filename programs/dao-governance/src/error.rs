use anchor_lang::prelude::*;

#[error_code]
pub enum GovernanceError {
    #[msg("Insufficient REBEL tokens to create proposal")]
    InsufficientTokens,

    #[msg("Voting has not started yet")]
    VotingNotStarted,

    #[msg("Voting period has ended")]
    VotingEnded,

    #[msg("Proposal is not in active status")]
    ProposalNotActive,

    #[msg("No voting power - must hold REBEL tokens")]
    NoVotingPower,

    #[msg("Voter has already voted on this proposal")]
    AlreadyVoted,

    #[msg("Voting period is still active")]
    VotingStillActive,

    #[msg("Proposal has already been executed")]
    AlreadyExecuted,

    #[msg("Quorum not reached for proposal")]
    QuorumNotReached,

    #[msg("Proposal was defeated - more No votes than Yes")]
    ProposalDefeated,

    #[msg("Invalid proposal type")]
    InvalidProposalType,

    #[msg("Strategy account not found or invalid")]
    InvalidStrategy,

    #[msg("Unauthorized - only governance authority can perform this action")]
    UnauthorizedGovernance,

    #[msg("Arithmetic overflow in calculation")]
    ArithmeticOverflow,

    #[msg("Invalid governance configuration")]
    InvalidConfiguration,

    #[msg("Token distribution already completed")]
    DistributionCompleted,

    #[msg("Treasury balance insufficient for withdrawal")]
    InsufficientTreasuryBalance,
}
