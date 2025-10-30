use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;
use crate::{
    constants::*,
    error::GovernanceError,
    state::*,
};

/// Cast a vote on an active proposal
/// Voting power = REBEL token balance at vote time
#[derive(Accounts)]
pub struct CastVote<'info> {
    /// Governance configuration
    #[account(
        seeds = [GOVERNANCE_SEED],
        bump = governance_config.bump
    )]
    pub governance_config: Account<'info, GovernanceConfig>,

    /// Proposal being voted on
    #[account(
        mut,
        seeds = [
            PROPOSAL_SEED,
            &proposal.proposal_id.to_le_bytes()
        ],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,

    /// Vote record (prevents double voting)
    #[account(
        init,
        payer = voter,
        seeds = [
            VOTE_RECORD_SEED,
            proposal.key().as_ref(),
            voter.key().as_ref()
        ],
        bump,
        space = VoteRecord::LEN
    )]
    pub vote_record: Account<'info, VoteRecord>,

    /// Voter's REBEL token account (determines voting power)
    #[account(
        constraint = voter_token_account.mint == governance_config.rebel_mint,
        constraint = voter_token_account.owner == voter.key()
    )]
    pub voter_token_account: Account<'info, TokenAccount>,

    /// Voter (signer)
    #[account(mut)]
    pub voter: Signer<'info>,

    /// System program
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CastVote>,
    vote_choice: VoteChoice,
) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let vote_record = &mut ctx.accounts.vote_record;
    let clock = Clock::get()?;

    // Validate voting period
    require!(
        clock.unix_timestamp >= proposal.voting_starts,
        GovernanceError::VotingNotStarted
    );
    require!(
        clock.unix_timestamp <= proposal.voting_ends,
        GovernanceError::VotingEnded
    );

    // Validate proposal status
    require!(
        proposal.status == ProposalStatus::Active,
        GovernanceError::ProposalNotActive
    );

    // Get voter's REBEL balance (voting power)
    let vote_weight = ctx.accounts.voter_token_account.amount;
    require!(
        vote_weight > 0,
        GovernanceError::NoVotingPower
    );

    // Record vote
    vote_record.proposal = proposal.key();
    vote_record.voter = ctx.accounts.voter.key();
    vote_record.vote_weight = vote_weight;
    vote_record.vote_choice = vote_choice;
    vote_record.timestamp = clock.unix_timestamp;
    vote_record.bump = ctx.bumps.vote_record;

    // Update proposal vote counts
    match vote_choice {
        VoteChoice::Yes => {
            proposal.votes_yes = proposal
                .votes_yes
                .checked_add(vote_weight)
                .ok_or(GovernanceError::ArithmeticOverflow)?;
        }
        VoteChoice::No => {
            proposal.votes_no = proposal
                .votes_no
                .checked_add(vote_weight)
                .ok_or(GovernanceError::ArithmeticOverflow)?;
        }
        VoteChoice::Abstain => {
            proposal.votes_abstain = proposal
                .votes_abstain
                .checked_add(vote_weight)
                .ok_or(GovernanceError::ArithmeticOverflow)?;
        }
    }

    msg!("Vote cast by {}: {:?} with weight {}", ctx.accounts.voter.key(), vote_choice, vote_weight);
    msg!("Current votes - Yes: {}, No: {}, Abstain: {}",
        proposal.votes_yes,
        proposal.votes_no,
        proposal.votes_abstain
    );

    Ok(())
}
