use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;
use crate::{
    constants::*,
    error::GovernanceError,
    state::*,
};

/// Create a new governance proposal
/// For hackathon: focuses on StrategyApproval proposals
#[derive(Accounts)]
#[instruction(strategy_to_approve: Pubkey)]
pub struct CreateProposal<'info> {
    /// Governance configuration
    #[account(
        mut,
        seeds = [GOVERNANCE_SEED],
        bump = governance_config.bump
    )]
    pub governance_config: Account<'info, GovernanceConfig>,

    /// New proposal account
    #[account(
        init,
        payer = proposer,
        seeds = [
            PROPOSAL_SEED,
            &governance_config.next_proposal_id.to_le_bytes()
        ],
        bump,
        space = Proposal::LEN
    )]
    pub proposal: Account<'info, Proposal>,

    /// Proposer's REBEL token account (must have minimum threshold)
    #[account(
        constraint = proposer_token_account.mint == governance_config.rebel_mint,
        constraint = proposer_token_account.owner == proposer.key()
    )]
    pub proposer_token_account: Account<'info, TokenAccount>,

    /// Proposer (signer)
    #[account(mut)]
    pub proposer: Signer<'info>,

    /// System program
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateProposal>,
    strategy_to_approve: Pubkey,
    description: String,
) -> Result<()> {
    let config = &mut ctx.accounts.governance_config;
    let proposal = &mut ctx.accounts.proposal;
    let clock = Clock::get()?;

    // Verify proposer has minimum REBEL tokens
    let proposer_balance = ctx.accounts.proposer_token_account.amount;
    require!(
        proposer_balance >= config.proposal_threshold,
        GovernanceError::InsufficientTokens
    );

    // Validate description length
    require!(
        description.len() <= Proposal::MAX_DESCRIPTION_LEN,
        GovernanceError::InvalidConfiguration
    );

    // Initialize proposal
    proposal.proposal_id = config.next_proposal_id;
    proposal.proposal_type = ProposalType::StrategyApproval;
    proposal.proposer = ctx.accounts.proposer.key();
    proposal.strategy_to_approve = strategy_to_approve;
    proposal.description = description.clone();
    proposal.voting_starts = clock.unix_timestamp;
    proposal.voting_ends = clock.unix_timestamp + config.voting_period_seconds;
    proposal.votes_yes = 0;
    proposal.votes_no = 0;
    proposal.votes_abstain = 0;
    proposal.status = ProposalStatus::Active;
    proposal.executed = false;
    proposal.bump = ctx.bumps.proposal;

    // Increment proposal counters
    config.next_proposal_id = config
        .next_proposal_id
        .checked_add(1)
        .ok_or(GovernanceError::ArithmeticOverflow)?;
    config.total_proposals = config
        .total_proposals
        .checked_add(1)
        .ok_or(GovernanceError::ArithmeticOverflow)?;

    msg!("Proposal {} created by {}", proposal.proposal_id, proposal.proposer);
    msg!("Strategy to approve: {}", strategy_to_approve);
    msg!("Voting ends: {}", proposal.voting_ends);

    Ok(())
}
