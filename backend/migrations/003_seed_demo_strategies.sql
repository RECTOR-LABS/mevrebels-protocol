-- Seed Mock Strategies for MEVrebels Demo
-- These coexist with real on-chain strategies

-- Sample Strategy 1: SOL/USDC Cross-DEX Arbitrage (High Performer)
INSERT INTO strategies (
    creator,
    strategy_id,
    name,
    dexs,
    token_pairs,
    profit_threshold,
    max_slippage,
    status,
    total_profit,
    execution_count,
    success_count,
    created_at,
    updated_at
) VALUES (
    'RECdpxmc8SbnwEbf8iET5Jve6JEfkqMWdrEpkms3P1b',
    101,
    'SOL/USDC Cross-DEX Arbitrage Alpha',
    '["raydium", "orca"]'::jsonb,
    '[{"tokenA": "So11111111111111111111111111111111111111112", "tokenB": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"}]'::jsonb,
    50,  -- 0.5% profit threshold
    100, -- 1% max slippage
    'active',
    45230000000,  -- 45.23 SOL total profit
    342,          -- 342 executions
    304,          -- 304 successful (88.9% success rate)
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '1 hour'
) ON CONFLICT (creator, strategy_id) DO NOTHING;

-- Sample Strategy 2: BONK/USDC High-Frequency (Medium Performer)
INSERT INTO strategies (
    creator,
    strategy_id,
    name,
    dexs,
    token_pairs,
    profit_threshold,
    max_slippage,
    status,
    total_profit,
    execution_count,
    success_count,
    created_at,
    updated_at
) VALUES (
    'MEME7Qz8K3yP2nXrTvW9hBc5eFjD1aLkN6sR78901234',
    102,
    'BONK/USDC High-Frequency Sniper',
    '["raydium", "meteora"]'::jsonb,
    '[{"tokenA": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", "tokenB": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"}]'::jsonb,
    30,  -- 0.3% profit threshold (aggressive)
    150, -- 1.5% max slippage
    'active',
    18750000000,  -- 18.75 SOL total profit
    567,          -- 567 executions
    421,          -- 421 successful (74.3% success rate)
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '30 minutes'
) ON CONFLICT (creator, strategy_id) DO NOTHING;

-- Sample Strategy 3: Multi-Hop Arbitrage (Low Executions, High Profit)
INSERT INTO strategies (
    creator,
    strategy_id,
    name,
    dexs,
    token_pairs,
    profit_threshold,
    max_slippage,
    status,
    total_profit,
    execution_count,
    success_count,
    created_at,
    updated_at
) VALUES (
    'WHALEx9K8Z7YwPp9hQm2pRzXkMk4eDxBbc765432109',
    103,
    'Multi-Hop Triangle Arbitrage Pro',
    '["raydium", "orca", "meteora"]'::jsonb,
    '[
        {"tokenA": "So11111111111111111111111111111111111111112", "tokenB": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"},
        {"tokenA": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "tokenB": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"},
        {"tokenA": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", "tokenB": "So11111111111111111111111111111111111111112"}
    ]'::jsonb,
    100, -- 1% profit threshold (conservative)
    80,  -- 0.8% max slippage
    'active',
    32500000000,  -- 32.5 SOL total profit
    89,           -- 89 executions (rare but profitable)
    84,           -- 84 successful (94.4% success rate)
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '2 hours'
) ON CONFLICT (creator, strategy_id) DO NOTHING;

-- Sample Strategy 4: JUP/SOL Swing Trading (New Strategy)
INSERT INTO strategies (
    creator,
    strategy_id,
    name,
    dexs,
    token_pairs,
    profit_threshold,
    max_slippage,
    status,
    total_profit,
    execution_count,
    success_count,
    created_at,
    updated_at
) VALUES (
    'JUPiter5K8Z7YwPp8hQm3pRzXkMk5eDxCcd876543210',
    104,
    'JUP/SOL Swing Trading Bot',
    '["orca", "raydium"]'::jsonb,
    '[{"tokenA": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", "tokenB": "So11111111111111111111111111111111111111112"}]'::jsonb,
    70,  -- 0.7% profit threshold
    120, -- 1.2% max slippage
    'active',
    8920000000,   -- 8.92 SOL total profit
    125,          -- 125 executions
    98,           -- 98 successful (78.4% success rate)
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '15 minutes'
) ON CONFLICT (creator, strategy_id) DO NOTHING;

-- Sample Strategy 5: USDC/USDT Stable Arbitrage (Low Risk, Consistent)
INSERT INTO strategies (
    creator,
    strategy_id,
    name,
    dexs,
    token_pairs,
    profit_threshold,
    max_slippage,
    status,
    total_profit,
    execution_count,
    success_count,
    created_at,
    updated_at
) VALUES (
    'STABLE8K7Z6YwPp7hQm4pRzXkMk6eDxDde987654321',
    105,
    'USDC/USDT Stablecoin Arbitrage',
    '["raydium", "orca", "meteora"]'::jsonb,
    '[{"tokenA": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "tokenB": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"}]'::jsonb,
    10,  -- 0.1% profit threshold (tight spreads on stables)
    30,  -- 0.3% max slippage (low volatility)
    'active',
    6340000000,   -- 6.34 SOL total profit
    892,          -- 892 executions (high frequency)
    856,          -- 856 successful (96.0% success rate - very reliable!)
    NOW() - INTERVAL '12 days',
    NOW() - INTERVAL '5 minutes'
) ON CONFLICT (creator, strategy_id) DO NOTHING;

-- Sample Strategy 6: Pending Approval (For Demo Governance Flow)
INSERT INTO strategies (
    creator,
    strategy_id,
    name,
    dexs,
    token_pairs,
    profit_threshold,
    max_slippage,
    status,
    total_profit,
    execution_count,
    success_count,
    created_at,
    updated_at
) VALUES (
    'NEW5trategy7Z6YwPp6hQm5pRzXkMk7eDxEef098765',
    106,
    'mSOL/SOL Liquid Staking Arbitrage',
    '["orca", "raydium"]'::jsonb,
    '[{"tokenA": "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", "tokenB": "So11111111111111111111111111111111111111112"}]'::jsonb,
    40,  -- 0.4% profit threshold
    90,  -- 0.9% max slippage
    'pending',
    0,            -- No profit yet (pending approval)
    0,            -- No executions
    0,
    NOW() - INTERVAL '6 hours',
    NOW() - INTERVAL '6 hours'
) ON CONFLICT (creator, strategy_id) DO NOTHING;

-- Add sample executions for realism (for top 3 strategies only)
-- Strategy 1: Recent successful execution
INSERT INTO executions (
    strategy_id,
    executor,
    signature,
    profit_lamports,
    gas_used,
    success,
    timestamp,
    dex_path,
    token_amounts,
    execution_time_ms
) VALUES (
    (SELECT id FROM strategies WHERE strategy_id = 101),
    'EXECutor8K7Z6YwPp7hQm3pRzXkMk5eDxCcd876543',
    '5signature' || md5(random()::text) || 'mock1example',
    145000000,  -- 0.145 SOL profit
    45000,      -- 45K compute units
    true,
    NOW() - INTERVAL '1 hour',
    '["raydium", "orca"]'::jsonb,
    '{"input": 1000000000, "output": 1145000000}'::jsonb,
    2300  -- 2.3 seconds
) ON CONFLICT (signature) DO NOTHING;

-- Strategy 2: Recent execution (smaller profit)
INSERT INTO executions (
    strategy_id,
    executor,
    signature,
    profit_lamports,
    gas_used,
    success,
    timestamp,
    dex_path,
    token_amounts,
    execution_time_ms
) VALUES (
    (SELECT id FROM strategies WHERE strategy_id = 102),
    'EXECutor9K8Z7YwPp8hQm4pRzXkMk6eDxDde987654',
    '5signature' || md5(random()::text) || 'mock2example',
    52000000,   -- 0.052 SOL profit
    38000,      -- 38K compute units
    true,
    NOW() - INTERVAL '30 minutes',
    '["raydium", "meteora"]'::jsonb,
    '{"input": 500000000, "output": 552000000}'::jsonb,
    1800  -- 1.8 seconds
) ON CONFLICT (signature) DO NOTHING;

-- Strategy 3: Failed execution (for realism)
INSERT INTO executions (
    strategy_id,
    executor,
    signature,
    profit_lamports,
    gas_used,
    success,
    timestamp,
    dex_path,
    error_message,
    execution_time_ms
) VALUES (
    (SELECT id FROM strategies WHERE strategy_id = 103),
    'EXECutor7K6Z5YwPp6hQm2pRzXkMk4eDxBbc765432',
    '5signature' || md5(random()::text) || 'mock3failed',
    -5000000,   -- Lost 0.005 SOL (gas)
    42000,      -- 42K compute units
    false,
    NOW() - INTERVAL '2 hours',
    '["raydium", "orca", "meteora"]'::jsonb,
    'Slippage exceeded threshold (1.2% > 0.8% max)',
    3100  -- 3.1 seconds
) ON CONFLICT (signature) DO NOTHING;

-- Verify inserted strategies
SELECT
    strategy_id,
    name,
    status,
    execution_count,
    success_count,
    ROUND((total_profit::NUMERIC / 1000000000), 2) as total_profit_sol,
    CASE
        WHEN execution_count > 0 THEN ROUND((success_count::NUMERIC / execution_count::NUMERIC * 100), 1)
        ELSE 0
    END as success_rate_pct,
    created_at
FROM strategies
WHERE strategy_id >= 101
ORDER BY total_profit DESC;

COMMENT ON TABLE strategies IS 'Seeded with 6 mock strategies for demo: 5 active high-performers + 1 pending approval';
