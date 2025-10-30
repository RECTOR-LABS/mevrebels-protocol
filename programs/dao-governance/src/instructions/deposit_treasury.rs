use anchor_lang::prelude::*;
use crate::{
    constants::*,
    state::*,
};

/// Deposit SOL to treasury
/// Called by execution-engine after profit distribution (20% to DAO)
#[derive(Accounts)]
pub struct DepositTreasury<'info> {
    /// Treasury PDA account
    #[account(
        mut,
        seeds = [TREASURY_SEED],
        bump = treasury.bump
    )]
    pub treasury: Account<'info, Treasury>,

    /// Depositor (execution-engine vault or any contributor)
    #[account(mut)]
    pub depositor: Signer<'info>,

    /// System program
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<DepositTreasury>, amount: u64) -> Result<()> {
    let treasury = &mut ctx.accounts.treasury;

    // Transfer SOL to treasury PDA
    anchor_lang::system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.depositor.to_account_info(),
                to: treasury.to_account_info(),
            },
        ),
        amount,
    )?;

    // Update treasury tracking
    treasury.total_received = treasury
        .total_received
        .checked_add(amount)
        .ok_or(crate::error::GovernanceError::ArithmeticOverflow)?;

    msg!("Treasury received {} lamports from {}", amount, ctx.accounts.depositor.key());
    msg!("Treasury total received: {} lamports", treasury.total_received);

    Ok(())
}
