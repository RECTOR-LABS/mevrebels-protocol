use anchor_lang::prelude::*;
use strategy_registry::{
    program::StrategyRegistry,
    cpi::accounts::ApproveStrategy as ApproveStrategyAccounts,
    StrategyAccount,
};
use crate::{
    constants::*,
    error::GovernanceError,
    state::*,
};

/// Execute a proposal after voting period ends
/// If quorum reached and majority votes yes, execute the action
/// For StrategyApproval: CPI to strategy-registry to approve strategy
#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    /// Governance configuration (acts as signer via PDA)
    #[account(
        mut,
        seeds = [GOVERNANCE_SEED],
        bump = governance_config.bump
    )]
    pub governance_config: Account<'info, GovernanceConfig>,

    /// Proposal to execute
    #[account(
        mut,
        seeds = [
            PROPOSAL_SEED,
            &proposal.proposal_id.to_le_bytes()
        ],
        bump = proposal.bump
    )]
    pub proposal: Account<'info, Proposal>,

    /// Strategy to approve (if ProposalType::StrategyApproval)
    /// CHECK: Validated by strategy-registry program via CPI
    #[account(mut)]
    pub strategy_account: UncheckedAccount<'info>,

    /// Admin config from strategy-registry (needed for CPI)
    /// CHECK: Validated by strategy-registry program
    pub admin_config: UncheckedAccount<'info>,

    /// Strategy Registry program for CPI
    pub strategy_registry_program: Program<'info, StrategyRegistry>,

    /// Anyone can execute (no signer needed - permissionless execution)
    pub executor: Signer<'info>,
}

pub fn handler(ctx: Context<ExecuteProposal>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let config = &ctx.accounts.governance_config;
    let clock = Clock::get()?;

    // Validate voting has ended
    require!(
        clock.unix_timestamp > proposal.voting_ends,
        GovernanceError::VotingStillActive
    );

    // Validate not already executed
    require!(
        !proposal.executed,
        GovernanceError::AlreadyExecuted
    );

    // Check quorum (10% of total supply by default)
    let total_votes = proposal.total_votes();
    let quorum_required = (config.total_supply * config.quorum_percentage as u64) / 100;
    require!(
        total_votes >= quorum_required,
        GovernanceError::QuorumNotReached
    );

    // Check majority (yes > no)
    require!(
        proposal.votes_yes > proposal.votes_no,
        GovernanceError::ProposalDefeated
    );

    // Update proposal status
    proposal.status = ProposalStatus::Succeeded;

    // Execute action based on proposal type
    match proposal.proposal_type {
        ProposalType::StrategyApproval => {
            // Verify strategy account matches proposal
            require!(
                ctx.accounts.strategy_account.key() == proposal.strategy_to_approve,
                GovernanceError::InvalidStrategy
            );

            // CPI to strategy-registry to approve strategy
            // Governance PDA acts as the approver
            execute_strategy_approval(
                ctx.accounts.strategy_registry_program.to_account_info(),
                ctx.accounts.strategy_account.to_account_info(),
                ctx.accounts.admin_config.to_account_info(),
                ctx.accounts.governance_config.to_account_info(),
                config.bump,
            )?;

            msg!("Strategy {} approved via DAO governance", proposal.strategy_to_approve);
        }
        _ => {
            // Other proposal types not implemented for hackathon
            return Err(GovernanceError::InvalidProposalType.into());
        }
    }

    // Mark as executed
    proposal.executed = true;
    proposal.status = ProposalStatus::Executed;

    msg!("Proposal {} executed successfully", proposal.proposal_id);
    msg!("Final votes - Yes: {}, No: {}, Abstain: {}",
        proposal.votes_yes,
        proposal.votes_no,
        proposal.votes_abstain
    );

    Ok(())
}

/// Helper function to execute strategy approval via CPI
fn execute_strategy_approval<'info>(
    strategy_registry_program: AccountInfo<'info>,
    strategy_account: AccountInfo<'info>,
    admin_config: AccountInfo<'info>,
    governance_config: AccountInfo<'info>,
    governance_bump: u8,
) -> Result<()> {
    // Prepare signer seeds for governance PDA
    let governance_seed = GOVERNANCE_SEED;
    let bump = &[governance_bump];
    let signer_seeds: &[&[&[u8]]] = &[&[governance_seed, bump]];

    // Build CPI accounts for strategy-registry approve_strategy
    let cpi_accounts = ApproveStrategyAccounts {
        strategy: strategy_account,
        admin_config,
        admin: governance_config, // Governance PDA acts as admin
    };

    // Execute CPI with governance PDA as signer
    let cpi_ctx = CpiContext::new_with_signer(
        strategy_registry_program,
        cpi_accounts,
        signer_seeds,
    );

    // Call approve_strategy via CPI
    strategy_registry::cpi::approve_strategy(cpi_ctx)?;

    msg!("Strategy approved via DAO governance CPI");

    Ok(())
}
