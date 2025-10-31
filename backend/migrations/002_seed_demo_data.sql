-- Seed Data for MEVrebels Demo
-- Sample proposals and votes for demonstration

-- Clear existing demo data (optional, for fresh start)
-- TRUNCATE TABLE votes, proposals CASCADE;

-- Sample Proposal 1: Strategy Approval (Active)
INSERT INTO proposals (
    proposal_id,
    type,
    title,
    description,
    proposer,
    votes_yes,
    votes_no,
    votes_abstain,
    quorum,
    status,
    created_at,
    ends_at
) VALUES (
    1,
    'strategy-approval',
    'Approve "SOL/USDC Cross-DEX Arbitrage Alpha" Strategy',
    'This strategy monitors price differences between Raydium and Orca for SOL/USDC pair. When profit exceeds 0.5%, it executes atomic arbitrage using flash loans. Expected APY: 25-40%. Risk level: Low. Backtested with 89% success rate.',
    'RECdpxmc8SbnwEbf8iET5Jve6JEfkqMWdrEpkms3P1b',
    15420000,  -- 15.42M YES votes
    2350000,   -- 2.35M NO votes
    890000,    -- 890K ABSTAIN votes
    10000000,  -- 10M quorum (reached!)
    'active',
    NOW() - INTERVAL '2 days',
    NOW() + INTERVAL '3 days'
) ON CONFLICT (proposal_id) DO NOTHING;

-- Sample Proposal 2: Parameter Change (Active, Close to Quorum)
INSERT INTO proposals (
    proposal_id,
    type,
    title,
    description,
    proposer,
    votes_yes,
    votes_no,
    votes_abstain,
    quorum,
    status,
    created_at,
    ends_at
) VALUES (
    2,
    'parameter-change',
    'Reduce Flash Loan Fee from 0.09% to 0.05%',
    'Lower flash loan fees to encourage more strategy executions and increase overall protocol volume. This change would make MEVrebels more competitive with other arbitrage protocols. Estimated impact: +30% execution volume.',
    'REB3L5nKq8Zzz7XwVt9hRm2pQzYjNk4ePDxABc123456',
    8500000,   -- 8.5M YES votes
    4200000,   -- 4.2M NO votes
    1100000,   -- 1.1M ABSTAIN votes
    15000000,  -- 15M quorum (not reached yet)
    'active',
    NOW() - INTERVAL '1 day',
    NOW() + INTERVAL '5 days'
) ON CONFLICT (proposal_id) DO NOTHING;

-- Sample Proposal 3: Treasury Allocation (Passed)
INSERT INTO proposals (
    proposal_id,
    type,
    title,
    description,
    proposer,
    votes_yes,
    votes_no,
    votes_abstain,
    quorum,
    status,
    created_at,
    ends_at,
    executed_at
) VALUES (
    3,
    'treasury',
    'Allocate 100 SOL for Liquidity Mining Campaign',
    'Use treasury funds to incentivize early strategy creators with liquidity mining rewards. This will attract high-quality strategies and bootstrap protocol adoption.',
    'MEVgod7XyZ9K3mP2nQrTvW8hBc4eFjD1aLkN5sR67890',
    22500000,  -- 22.5M YES votes (passed!)
    5300000,   -- 5.3M NO votes
    2100000,   -- 2.1M ABSTAIN votes
    20000000,  -- 20M quorum (reached!)
    'passed',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '3 days',
    NULL  -- Not executed yet
) ON CONFLICT (proposal_id) DO NOTHING;

-- Sample Proposal 4: Protocol Upgrade (Rejected)
INSERT INTO proposals (
    proposal_id,
    type,
    title,
    description,
    proposer,
    votes_yes,
    votes_no,
    votes_abstain,
    quorum,
    status,
    created_at,
    ends_at
) VALUES (
    4,
    'parameter-change',
    'Increase Strategy Creator Fee Share to 50%',
    'Proposal to increase creator profit share from 30% to 50% to attract more developers. Community voted NO due to reduced executor incentives.',
    'FEEmax9K3zZ7YwVp8hQm1pRzXjMk3eDxAbc654321',
    3200000,   -- 3.2M YES votes
    18500000,  -- 18.5M NO votes (rejected!)
    1800000,   -- 1.8M ABSTAIN votes
    15000000,  -- 15M quorum (reached)
    'rejected',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '8 days'
) ON CONFLICT (proposal_id) DO NOTHING;

-- Sample Votes for Active Proposal #1 (Strategy Approval)
INSERT INTO votes (proposal_id, voter, vote_type, voting_power, timestamp)
SELECT
    (SELECT id FROM proposals WHERE proposal_id = 1),
    'VOTER' || generate_series || 'abcdefghijklmnopqrstuvwxyz123456',
    CASE (random() * 10)::int
        WHEN 0 THEN 'no'
        WHEN 1 THEN 'abstain'
        ELSE 'yes'
    END,
    (random() * 1000000)::bigint + 10000,
    NOW() - (random() * INTERVAL '2 days')
FROM generate_series(1, 50)
ON CONFLICT (proposal_id, voter) DO NOTHING;

-- Sample Votes for Active Proposal #2 (Parameter Change)
INSERT INTO votes (proposal_id, voter, vote_type, voting_power, timestamp)
SELECT
    (SELECT id FROM proposals WHERE proposal_id = 2),
    'WHALE' || generate_series || 'XyZ789abcdefghijklmnopqrstu123',
    CASE (random() * 10)::int
        WHEN 0 THEN 'yes'
        WHEN 1 THEN 'abstain'
        ELSE 'no'
    END,
    (random() * 500000)::bigint + 50000,
    NOW() - (random() * INTERVAL '1 day')
FROM generate_series(1, 30)
ON CONFLICT (proposal_id, voter) DO NOTHING;

-- Verify inserted data
SELECT
    proposal_id,
    type,
    title,
    status,
    votes_yes + votes_no + votes_abstain as total_votes,
    quorum,
    CASE
        WHEN votes_yes + votes_no + votes_abstain >= quorum THEN '✓ Quorum Reached'
        ELSE '✗ Below Quorum'
    END as quorum_status,
    ends_at
FROM proposals
ORDER BY created_at DESC;

COMMENT ON TABLE proposals IS 'Seeded with 4 sample proposals for demo: 2 active, 1 passed, 1 rejected';
