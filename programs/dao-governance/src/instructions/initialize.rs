use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount, MintTo, mint_to};
use crate::{
    constants::*,
    state::*,
};

/// Initialize governance system and create REBEL token
/// This sets up:
/// 1. REBEL SPL token mint
/// 2. Governance configuration
/// 3. Treasury account
/// 4. Token distribution vaults (Community, Treasury, Team, Liquidity)
#[derive(Accounts)]
pub struct Initialize<'info> {
    /// REBEL token mint (SPL token)
    #[account(
        init,
        payer = authority,
        mint::decimals = REBEL_DECIMALS,
        mint::authority = governance_config,
    )]
    pub rebel_mint: Account<'info, Mint>,

    /// Main governance configuration PDA
    #[account(
        init,
        payer = authority,
        seeds = [GOVERNANCE_SEED],
        bump,
        space = GovernanceConfig::LEN
    )]
    pub governance_config: Account<'info, GovernanceConfig>,

    /// Treasury account PDA
    #[account(
        init,
        payer = authority,
        seeds = [TREASURY_SEED],
        bump,
        space = Treasury::LEN
    )]
    pub treasury: Account<'info, Treasury>,

    /// Community vault (40% allocation)
    #[account(
        init,
        payer = authority,
        token::mint = rebel_mint,
        token::authority = governance_config,
        seeds = [COMMUNITY_VAULT_SEED],
        bump
    )]
    pub community_vault: Account<'info, TokenAccount>,

    /// Treasury vault (30% allocation)
    #[account(
        init,
        payer = authority,
        token::mint = rebel_mint,
        token::authority = governance_config,
        seeds = [TREASURY_VAULT_SEED],
        bump
    )]
    pub treasury_vault: Account<'info, TokenAccount>,

    /// Team vault (20% allocation)
    #[account(
        init,
        payer = authority,
        token::mint = rebel_mint,
        token::authority = governance_config,
        seeds = [TEAM_VAULT_SEED],
        bump
    )]
    pub team_vault: Account<'info, TokenAccount>,

    /// Liquidity vault (10% allocation)
    #[account(
        init,
        payer = authority,
        token::mint = rebel_mint,
        token::authority = governance_config,
        seeds = [LIQUIDITY_VAULT_SEED],
        bump
    )]
    pub liquidity_vault: Account<'info, TokenAccount>,

    /// Authority initializing the DAO (pays for accounts)
    #[account(mut)]
    pub authority: Signer<'info>,

    /// System program
    pub system_program: Program<'info, System>,

    /// Token program
    pub token_program: Program<'info, Token>,

    /// Rent sysvar
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<Initialize>) -> Result<()> {
    let config = &mut ctx.accounts.governance_config;
    let treasury = &mut ctx.accounts.treasury;

    // Initialize governance config
    config.rebel_mint = ctx.accounts.rebel_mint.key();
    config.total_supply = REBEL_TOTAL_SUPPLY;
    config.circulating_supply = 0; // Will be updated as tokens are distributed
    config.governance_authority = config.key(); // Config PDA is the mint authority
    config.quorum_percentage = DEFAULT_QUORUM_PERCENTAGE;
    config.voting_period_seconds = DEFAULT_VOTING_PERIOD;
    config.proposal_threshold = MIN_PROPOSAL_THRESHOLD;
    config.next_proposal_id = 0;
    config.total_proposals = 0;
    config.distribution_completed = false;
    config.bump = ctx.bumps.governance_config;

    // Initialize treasury
    treasury.authority = config.key();
    treasury.total_received = 0;
    treasury.total_spent = 0;
    treasury.rebel_balance = 0;
    treasury.bump = ctx.bumps.treasury;

    msg!("DAO Governance initialized");
    msg!("REBEL token mint: {}", ctx.accounts.rebel_mint.key());
    msg!("Total supply: {} tokens", REBEL_TOTAL_SUPPLY / 1_000_000_000);

    Ok(())
}

/// Distribute initial REBEL token supply to vaults
/// Must be called after initialize to mint tokens
#[derive(Accounts)]
pub struct DistributeTokens<'info> {
    /// REBEL token mint
    #[account(
        mut,
        address = governance_config.rebel_mint
    )]
    pub rebel_mint: Account<'info, Mint>,

    /// Governance configuration (mint authority)
    #[account(
        mut,
        seeds = [GOVERNANCE_SEED],
        bump = governance_config.bump,
    )]
    pub governance_config: Account<'info, GovernanceConfig>,

    /// Community vault to receive 40%
    #[account(
        mut,
        token::mint = rebel_mint,
        token::authority = governance_config,
        seeds = [COMMUNITY_VAULT_SEED],
        bump
    )]
    pub community_vault: Account<'info, TokenAccount>,

    /// Treasury vault to receive 30%
    #[account(
        mut,
        token::mint = rebel_mint,
        token::authority = governance_config,
        seeds = [TREASURY_VAULT_SEED],
        bump
    )]
    pub treasury_vault: Account<'info, TokenAccount>,

    /// Team vault to receive 20%
    #[account(
        mut,
        token::mint = rebel_mint,
        token::authority = governance_config,
        seeds = [TEAM_VAULT_SEED],
        bump
    )]
    pub team_vault: Account<'info, TokenAccount>,

    /// Liquidity vault to receive 10%
    #[account(
        mut,
        token::mint = rebel_mint,
        token::authority = governance_config,
        seeds = [LIQUIDITY_VAULT_SEED],
        bump
    )]
    pub liquidity_vault: Account<'info, TokenAccount>,

    /// Token program
    pub token_program: Program<'info, Token>,
}

pub fn distribute_tokens(ctx: Context<DistributeTokens>) -> Result<()> {
    let config = &ctx.accounts.governance_config;

    require!(
        !config.distribution_completed,
        crate::error::GovernanceError::DistributionCompleted
    );

    let governance_seed = GOVERNANCE_SEED;
    let bump = &[config.bump];
    let signer_seeds: &[&[&[u8]]] = &[&[governance_seed, bump]];

    // Mint to community vault (40%)
    let community_amount = calculate_allocation(COMMUNITY_ALLOCATION);
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.rebel_mint.to_account_info(),
                to: ctx.accounts.community_vault.to_account_info(),
                authority: ctx.accounts.governance_config.to_account_info(),
            },
            signer_seeds,
        ),
        community_amount,
    )?;
    msg!("Minted {} REBEL to community vault (40%)", community_amount / 1_000_000_000);

    // Mint to treasury vault (30%)
    let treasury_amount = calculate_allocation(TREASURY_ALLOCATION);
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.rebel_mint.to_account_info(),
                to: ctx.accounts.treasury_vault.to_account_info(),
                authority: ctx.accounts.governance_config.to_account_info(),
            },
            signer_seeds,
        ),
        treasury_amount,
    )?;
    msg!("Minted {} REBEL to treasury vault (30%)", treasury_amount / 1_000_000_000);

    // Mint to team vault (20%)
    let team_amount = calculate_allocation(TEAM_ALLOCATION);
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.rebel_mint.to_account_info(),
                to: ctx.accounts.team_vault.to_account_info(),
                authority: ctx.accounts.governance_config.to_account_info(),
            },
            signer_seeds,
        ),
        team_amount,
    )?;
    msg!("Minted {} REBEL to team vault (20%)", team_amount / 1_000_000_000);

    // Mint to liquidity vault (10%)
    let liquidity_amount = calculate_allocation(LIQUIDITY_ALLOCATION);
    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.rebel_mint.to_account_info(),
                to: ctx.accounts.liquidity_vault.to_account_info(),
                authority: ctx.accounts.governance_config.to_account_info(),
            },
            signer_seeds,
        ),
        liquidity_amount,
    )?;
    msg!("Minted {} REBEL to liquidity vault (10%)", liquidity_amount / 1_000_000_000);

    // Update circulating supply and mark distribution complete
    let config = &mut ctx.accounts.governance_config;
    config.circulating_supply = REBEL_TOTAL_SUPPLY;
    config.distribution_completed = true;

    msg!("Token distribution complete: 100M REBEL distributed");

    Ok(())
}
