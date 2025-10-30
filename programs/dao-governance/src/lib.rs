pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use error::*;
pub use instructions::*;
pub use state::*;

declare_id!("RECwcpcHwBeDAV7tBvUuhJzsih16BaveZRC74kbBkSS");

#[program]
pub mod dao_governance {
    use super::*;

    /// Initialize DAO governance system
    /// Creates REBEL token mint, governance config, treasury, and distribution vaults
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    /// Distribute initial REBEL token supply to vaults
    /// 40% Community, 30% Treasury, 20% Team, 10% Liquidity
    pub fn distribute_tokens(ctx: Context<DistributeTokens>) -> Result<()> {
        instructions::initialize::distribute_tokens(ctx)
    }

    /// Create a new governance proposal
    /// Currently supports StrategyApproval type
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        strategy_to_approve: Pubkey,
        description: String,
    ) -> Result<()> {
        instructions::create_proposal::handler(ctx, strategy_to_approve, description)
    }

    /// Cast a vote on an active proposal
    /// Voting power = REBEL token balance at vote time
    pub fn cast_vote(
        ctx: Context<CastVote>,
        vote_choice: VoteChoice,
    ) -> Result<()> {
        instructions::cast_vote::handler(ctx, vote_choice)
    }

    /// Execute a proposal after voting ends
    /// Requires quorum and majority approval
    /// For StrategyApproval: CPI to strategy-registry
    pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
        instructions::execute_proposal::handler(ctx)
    }

    /// Deposit SOL to treasury
    /// Called by execution-engine for profit sharing (20% to DAO)
    pub fn deposit_treasury(ctx: Context<DepositTreasury>, amount: u64) -> Result<()> {
        instructions::deposit_treasury::handler(ctx, amount)
    }
}
