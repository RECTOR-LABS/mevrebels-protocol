-- MEVrebels Database Schema
-- PostgreSQL with TimescaleDB extension

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: strategies
-- Stores all user-submitted strategies
-- ============================================
CREATE TABLE strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator TEXT NOT NULL,  -- Solana wallet pubkey
    strategy_id BIGINT NOT NULL,  -- On-chain strategy ID
    name TEXT NOT NULL,
    dexs JSONB NOT NULL,  -- Array of DEX types
    token_pairs JSONB NOT NULL,  -- Array of token pairs
    profit_threshold INTEGER NOT NULL,  -- In basis points (0.5% = 50)
    max_slippage INTEGER NOT NULL,  -- In basis points
    status TEXT NOT NULL DEFAULT 'pending',  -- pending/approved/rejected/active
    total_profit BIGINT DEFAULT 0,  -- Cumulative profit in lamports
    execution_count INTEGER DEFAULT 0,  -- Total executions
    success_count INTEGER DEFAULT 0,  -- Successful executions
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT strategies_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'paused')),
    CONSTRAINT strategies_unique_creator_id UNIQUE (creator, strategy_id)
);

-- Index for fast lookups
CREATE INDEX idx_strategies_creator ON strategies(creator);
CREATE INDEX idx_strategies_status ON strategies(status);
CREATE INDEX idx_strategies_created_at ON strategies(created_at DESC);

-- ============================================
-- Table: executions
-- Time-series data for all strategy executions
-- ============================================
CREATE TABLE executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_id UUID NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
    executor TEXT NOT NULL,  -- Wallet pubkey who executed
    signature TEXT NOT NULL UNIQUE,  -- Transaction signature
    profit_lamports BIGINT NOT NULL,  -- Profit (can be negative)
    gas_used INTEGER NOT NULL,  -- Compute units consumed
    success BOOLEAN NOT NULL,
    error_message TEXT,  -- If failed, why?
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Additional metadata
    dex_path JSONB,  -- Which DEXes were used in order
    token_amounts JSONB,  -- Token swap amounts
    execution_time_ms INTEGER  -- How long it took
);

-- Convert to TimescaleDB hypertable for time-series optimization
SELECT create_hypertable('executions', 'timestamp', if_not_exists => TRUE);

-- Indexes for fast queries
CREATE INDEX idx_executions_strategy_id ON executions(strategy_id, timestamp DESC);
CREATE INDEX idx_executions_executor ON executions(executor, timestamp DESC);
CREATE INDEX idx_executions_success ON executions(success);
CREATE INDEX idx_executions_timestamp ON executions(timestamp DESC);

-- ============================================
-- Table: proposals
-- DAO governance proposals
-- ============================================
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id BIGINT NOT NULL UNIQUE,  -- On-chain proposal ID
    type TEXT NOT NULL,  -- strategy-approval/parameter-change/treasury
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    proposer TEXT NOT NULL,  -- Wallet pubkey
    votes_yes BIGINT DEFAULT 0,
    votes_no BIGINT DEFAULT 0,
    votes_abstain BIGINT DEFAULT 0,
    quorum BIGINT NOT NULL,  -- Minimum votes required
    status TEXT NOT NULL DEFAULT 'active',  -- active/passed/rejected/executed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ NOT NULL,
    executed_at TIMESTAMPTZ,

    -- Related entities
    strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,  -- If strategy-approval

    -- Constraints
    CONSTRAINT proposals_type_check CHECK (type IN ('strategy-approval', 'parameter-change', 'treasury', 'upgrade')),
    CONSTRAINT proposals_status_check CHECK (status IN ('active', 'passed', 'rejected', 'executed', 'cancelled'))
);

-- Indexes
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_created_at ON proposals(created_at DESC);
CREATE INDEX idx_proposals_ends_at ON proposals(ends_at);
CREATE INDEX idx_proposals_proposer ON proposals(proposer);

-- ============================================
-- Table: votes
-- Individual votes on proposals
-- ============================================
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    voter TEXT NOT NULL,  -- Wallet pubkey
    vote_type TEXT NOT NULL,  -- yes/no/abstain
    voting_power BIGINT NOT NULL,  -- REBEL tokens held
    timestamp TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent double voting
    CONSTRAINT votes_unique_voter_proposal UNIQUE (proposal_id, voter),
    CONSTRAINT votes_type_check CHECK (vote_type IN ('yes', 'no', 'abstain'))
);

-- Indexes
CREATE INDEX idx_votes_proposal_id ON votes(proposal_id);
CREATE INDEX idx_votes_voter ON votes(voter);

-- ============================================
-- Table: opportunities
-- Detected arbitrage opportunities (short TTL)
-- ============================================
CREATE TABLE opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dex_a TEXT NOT NULL,  -- Source DEX
    dex_b TEXT NOT NULL,  -- Target DEX
    token_a TEXT NOT NULL,  -- Token mint
    token_b TEXT NOT NULL,  -- Token mint
    price_a DOUBLE PRECISION NOT NULL,  -- Price on DEX A
    price_b DOUBLE PRECISION NOT NULL,  -- Price on DEX B
    profit_estimate_lamports BIGINT NOT NULL,  -- Expected profit
    confidence_score INTEGER NOT NULL,  -- 0-100 score
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 seconds',  -- TTL

    -- Metadata
    liquidity_a BIGINT,  -- Available liquidity
    liquidity_b BIGINT,
    gas_estimate INTEGER
);

-- Convert to hypertable
SELECT create_hypertable('opportunities', 'detected_at', if_not_exists => TRUE);

-- Index for active opportunities
CREATE INDEX idx_opportunities_expires_at ON opportunities(expires_at) WHERE expires_at > NOW();

-- ============================================
-- Table: creator_earnings
-- Aggregated earnings per creator (materialized view alternative)
-- ============================================
CREATE TABLE creator_earnings (
    creator TEXT PRIMARY KEY,
    total_earnings_lamports BIGINT DEFAULT 0,
    strategy_count INTEGER DEFAULT 0,
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    last_execution_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_creator_earnings_total ON creator_earnings(total_earnings_lamports DESC);

-- ============================================
-- Table: executor_stats
-- Aggregated stats per executor
-- ============================================
CREATE TABLE executor_stats (
    executor TEXT PRIMARY KEY,
    total_profit_lamports BIGINT DEFAULT 0,
    execution_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    last_execution_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_executor_stats_profit ON executor_stats(total_profit_lamports DESC);

-- ============================================
-- Materialized Views for Analytics
-- ============================================

-- Top strategies by profit
CREATE MATERIALIZED VIEW top_strategies_by_profit AS
SELECT
    s.id,
    s.name,
    s.creator,
    s.total_profit,
    s.execution_count,
    CASE
        WHEN s.execution_count > 0 THEN (s.success_count::FLOAT / s.execution_count::FLOAT * 100)
        ELSE 0
    END as success_rate
FROM strategies s
WHERE s.status = 'active'
ORDER BY s.total_profit DESC
LIMIT 100;

-- Index on materialized view
CREATE UNIQUE INDEX idx_top_strategies_mv ON top_strategies_by_profit(id);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY top_strategies_by_profit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Triggers for automatic updates
-- ============================================

-- Update strategy stats when execution is inserted
CREATE OR REPLACE FUNCTION update_strategy_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE strategies
    SET
        total_profit = total_profit + NEW.profit_lamports,
        execution_count = execution_count + 1,
        success_count = success_count + CASE WHEN NEW.success THEN 1 ELSE 0 END,
        updated_at = NOW()
    WHERE id = NEW.strategy_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_strategy_stats
AFTER INSERT ON executions
FOR EACH ROW
EXECUTE FUNCTION update_strategy_stats();

-- Update creator earnings
CREATE OR REPLACE FUNCTION update_creator_earnings()
RETURNS TRIGGER AS $$
DECLARE
    creator_pubkey TEXT;
    creator_share BIGINT;
BEGIN
    -- Get creator from strategy
    SELECT s.creator INTO creator_pubkey
    FROM strategies s
    WHERE s.id = NEW.strategy_id;

    -- Calculate creator share (30% of profit)
    creator_share := (NEW.profit_lamports * 30) / 100;

    -- Update or insert creator earnings
    INSERT INTO creator_earnings (creator, total_earnings_lamports, strategy_count, total_executions, successful_executions, last_execution_at)
    VALUES (
        creator_pubkey,
        creator_share,
        1,
        1,
        CASE WHEN NEW.success THEN 1 ELSE 0 END,
        NEW.timestamp
    )
    ON CONFLICT (creator) DO UPDATE SET
        total_earnings_lamports = creator_earnings.total_earnings_lamports + creator_share,
        total_executions = creator_earnings.total_executions + 1,
        successful_executions = creator_earnings.successful_executions + CASE WHEN NEW.success THEN 1 ELSE 0 END,
        last_execution_at = NEW.timestamp,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_creator_earnings
AFTER INSERT ON executions
FOR EACH ROW
EXECUTE FUNCTION update_creator_earnings();

-- ============================================
-- Functions for common queries
-- ============================================

-- Get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    rank INTEGER,
    strategy_id UUID,
    strategy_name TEXT,
    creator TEXT,
    total_profit BIGINT,
    execution_count INTEGER,
    success_rate FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROW_NUMBER() OVER (ORDER BY s.total_profit DESC)::INTEGER as rank,
        s.id as strategy_id,
        s.name as strategy_name,
        s.creator,
        s.total_profit,
        s.execution_count,
        CASE
            WHEN s.execution_count > 0 THEN (s.success_count::FLOAT / s.execution_count::FLOAT * 100)
            ELSE 0
        END as success_rate
    FROM strategies s
    WHERE s.status = 'active' AND s.execution_count > 0
    ORDER BY s.total_profit DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Get strategy performance metrics
CREATE OR REPLACE FUNCTION get_strategy_performance(strategy_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_executions', COUNT(*),
        'successful_executions', SUM(CASE WHEN success THEN 1 ELSE 0 END),
        'total_profit', SUM(profit_lamports),
        'avg_profit', AVG(profit_lamports),
        'max_profit', MAX(profit_lamports),
        'success_rate', (SUM(CASE WHEN success THEN 1 ELSE 0 END)::FLOAT / COUNT(*)::FLOAT * 100)
    ) INTO result
    FROM executions
    WHERE strategy_id = strategy_uuid;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Initial data / seed
-- ============================================

-- Insert sample strategy (optional, for testing)
-- Uncomment for development
/*
INSERT INTO strategies (creator, strategy_id, name, dexs, token_pairs, profit_threshold, max_slippage, status)
VALUES (
    'RECdpxmc8SbnwEbf8iET5Jve6JEfkqMWdrEpkms3P1b',
    1,
    'SOL/USDC Arbitrage Alpha',
    '["raydium", "orca"]'::jsonb,
    '[{"tokenA": "So11111111111111111111111111111111111111112", "tokenB": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"}]'::jsonb,
    50,
    100,
    'active'
);
*/

-- Grant permissions (if using specific users)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mevrebels_api;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO mevrebels_api;

COMMENT ON DATABASE mevrebels IS 'MEVrebels Protocol - Democratizing MEV on Solana';
