use anchor_lang::prelude::*;

/// Flashloan fee: 0.09% (9 basis points)
/// Calculation: amount * FLASHLOAN_FEE_BPS / BPS_DENOMINATOR
pub const FLASHLOAN_FEE_BPS: u64 = 9;
pub const BPS_DENOMINATOR: u64 = 10_000;

/// Profit distribution percentages (must sum to 100)
pub const CREATOR_SHARE_PERCENT: u64 = 40;
pub const EXECUTOR_SHARE_PERCENT: u64 = 40;
pub const TREASURY_SHARE_PERCENT: u64 = 20;

/// Mock exchange rates for demo arbitrage
/// These are hardcoded to demonstrate an 8-10% profit opportunity
///
/// Strategy: SOL → USDC (DEX A) → SOL (DEX B) = ~8% profit
///
/// DEX A (efficient pricing):
/// - 1 SOL = 100 USDC
/// - 100 USDC = 1 SOL
///
/// DEX B (inefficient pricing - arbitrage opportunity):
/// - 1 SOL = 98 USDC
/// - 100 USDC = 1.08 SOL (8% profit margin)
///
/// Example execution with 10 SOL:
/// 1. Borrow 10 SOL from flashloan vault
/// 2. Swap 10 SOL → 1000 USDC on DEX A (rate: 100 USDC/SOL)
/// 3. Swap 1000 USDC → 10.8 SOL on DEX B (rate: 1.08 SOL/100 USDC)
/// 4. Repay 10 SOL + 0.009 SOL fee (0.09%)
/// 5. Net profit: 10.8 - 10.009 = 0.791 SOL
/// 6. Distribute: 0.3164 SOL (creator), 0.3164 SOL (executor), 0.1582 SOL (treasury)
pub struct MockExchangeRate {
    pub from_token: &'static str,
    pub to_token: &'static str,
    pub rate_numerator: u64,
    pub rate_denominator: u64,
    pub dex: &'static str,
}

impl MockExchangeRate {
    /// Calculate output amount given input amount
    /// Formula: output = (input * rate_numerator) / rate_denominator
    pub fn calculate_output(&self, input_amount: u64) -> Result<u64> {
        let output = input_amount
            .checked_mul(self.rate_numerator)
            .ok_or(error!(crate::error::ExecutionError::ArithmeticOverflow))?
            .checked_div(self.rate_denominator)
            .ok_or(error!(crate::error::ExecutionError::ArithmeticOverflow))?;
        Ok(output)
    }
}

/// Mock exchange rates for arbitrage demonstration
///
/// DEX A: Efficient market pricing
/// DEX B: Inefficient pricing (creates arbitrage opportunity)
pub const MOCK_RATES: [MockExchangeRate; 4] = [
    // DEX A rates (efficient)
    MockExchangeRate {
        from_token: "SOL",
        to_token: "USDC",
        rate_numerator: 100,
        rate_denominator: 1,
        dex: "DEX_A",
    },
    MockExchangeRate {
        from_token: "USDC",
        to_token: "SOL",
        rate_numerator: 1,
        rate_denominator: 100,
        dex: "DEX_A",
    },
    // DEX B rates (inefficient - arbitrage opportunity)
    MockExchangeRate {
        from_token: "SOL",
        to_token: "USDC",
        rate_numerator: 98,
        rate_denominator: 1,
        dex: "DEX_B",
    },
    MockExchangeRate {
        from_token: "USDC",
        to_token: "SOL",
        rate_numerator: 108,
        rate_denominator: 100,
        dex: "DEX_B",
    },
];

/// Find exchange rate for a given token pair and DEX
pub fn get_mock_rate(from: &str, to: &str, dex: &str) -> Option<&'static MockExchangeRate> {
    MOCK_RATES
        .iter()
        .find(|rate| rate.from_token == from && rate.to_token == to && rate.dex == dex)
}
