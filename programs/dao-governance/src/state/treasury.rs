use anchor_lang::prelude::*;

/// Treasury account for DAO funds
/// PDA seeds: [b"treasury"]
/// Receives 20% of execution profits from execution-engine
#[account]
#[derive(Default)]
pub struct Treasury {
    /// Governance authority (PDA that controls this treasury)
    pub authority: Pubkey,

    /// Total SOL received from profit distribution
    pub total_received: u64,

    /// Total SOL spent via governance proposals
    pub total_spent: u64,

    /// Current REBEL token balance held by treasury
    pub rebel_balance: u64,

    /// Bump seed for PDA
    pub bump: u8,
}

impl Treasury {
    pub const LEN: usize = 8 +  // discriminator
        32 +                    // authority
        8 +                     // total_received
        8 +                     // total_spent
        8 +                     // rebel_balance
        1;                      // bump

    /// Get current available SOL balance
    pub fn available_balance(&self) -> u64 {
        self.total_received.saturating_sub(self.total_spent)
    }
}
