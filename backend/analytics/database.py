"""
Database connection and utilities
"""

import asyncpg
from loguru import logger
from typing import Optional, List, Dict, Any
from config import get_settings

settings = get_settings()

# Global connection pool
_pool: Optional[asyncpg.Pool] = None


async def init_db() -> None:
    """Initialize database connection pool"""
    global _pool
    logger.info("Initializing database connection pool")

    _pool = await asyncpg.create_pool(
        dsn=settings.database_url,
        min_size=5,
        max_size=20,
        command_timeout=60,
    )

    logger.success("Database connection pool initialized")


async def close_db() -> None:
    """Close database connection pool"""
    global _pool
    if _pool:
        logger.info("Closing database connection pool")
        await _pool.close()
        _pool = None


async def execute(query: str, *args) -> str:
    """Execute a query without returning results"""
    if not _pool:
        raise RuntimeError("Database pool not initialized")

    async with _pool.acquire() as conn:
        result = await conn.execute(query, *args)
        logger.debug(f"Query executed: {query[:100]}... | Result: {result}")
        return result


async def fetch_one(query: str, *args) -> Optional[Dict[str, Any]]:
    """Fetch a single row"""
    if not _pool:
        raise RuntimeError("Database pool not initialized")

    async with _pool.acquire() as conn:
        row = await conn.fetchrow(query, *args)
        return dict(row) if row else None


async def fetch_all(query: str, *args) -> List[Dict[str, Any]]:
    """Fetch all rows"""
    if not _pool:
        raise RuntimeError("Database pool not initialized")

    async with _pool.acquire() as conn:
        rows = await conn.fetch(query, *args)
        return [dict(row) for row in rows]


async def insert_strategy(
    creator: str,
    strategy_id: int,
    name: str,
    dexs: List[str],
    token_pairs: List[Dict[str, str]],
    profit_threshold: int,
    max_slippage: int,
    status: str,
    signature: str,
) -> str:
    """Insert a new strategy"""
    query = """
        INSERT INTO strategies (
            creator, strategy_id, name, dexs, token_pairs,
            profit_threshold, max_slippage, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (creator, strategy_id) DO UPDATE
        SET name = EXCLUDED.name,
            dexs = EXCLUDED.dexs,
            token_pairs = EXCLUDED.token_pairs,
            status = EXCLUDED.status,
            updated_at = NOW()
        RETURNING id
    """

    import json
    result = await fetch_one(
        query,
        creator,
        strategy_id,
        name,
        json.dumps(dexs),
        json.dumps(token_pairs),
        profit_threshold,
        max_slippage,
        status,
    )

    logger.info(f"Inserted strategy: {name} (creator={creator}, strategy_id={strategy_id})")
    return result["id"]


async def insert_execution(
    strategy_id: str,
    executor: str,
    signature: str,
    profit_lamports: int,
    gas_used: int,
    success: bool,
) -> str:
    """Insert a new execution"""
    query = """
        INSERT INTO executions (
            strategy_id, executor, signature, profit_lamports, gas_used, success
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (signature) DO NOTHING
        RETURNING id
    """

    result = await fetch_one(
        query,
        strategy_id,
        executor,
        signature,
        profit_lamports,
        gas_used,
        success,
    )

    if result:
        logger.info(f"Inserted execution: {signature} (profit={profit_lamports}, success={success})")
        return result["id"]
    else:
        logger.warning(f"Execution already exists: {signature}")
        return None


async def insert_proposal(
    proposer: str,
    proposal_id: int,
    title: str,
    description: str,
    proposal_type: str,
    status: str,
    yes_votes: int,
    no_votes: int,
    end_time: int,
) -> str:
    """Insert a new proposal"""
    query = """
        INSERT INTO proposals (
            proposer, proposal_id, title, description, proposal_type,
            status, yes_votes, no_votes, end_time
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, to_timestamp($9))
        ON CONFLICT (proposer, proposal_id) DO UPDATE
        SET status = EXCLUDED.status,
            yes_votes = EXCLUDED.yes_votes,
            no_votes = EXCLUDED.no_votes,
            updated_at = NOW()
        RETURNING id
    """

    result = await fetch_one(
        query,
        proposer,
        proposal_id,
        title,
        description,
        proposal_type,
        status,
        yes_votes,
        no_votes,
        end_time,
    )

    logger.info(f"Inserted proposal: {title} (proposer={proposer}, proposal_id={proposal_id})")
    return result["id"]


async def insert_vote(
    proposal_id: str,
    voter: str,
    vote_type: str,
    vote_weight: int,
    signature: str,
) -> str:
    """Insert a new vote"""
    query = """
        INSERT INTO votes (
            proposal_id, voter, vote_type, vote_weight, signature
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (signature) DO NOTHING
        RETURNING id
    """

    result = await fetch_one(
        query,
        proposal_id,
        voter,
        vote_type,
        vote_weight,
        signature,
    )

    if result:
        logger.info(f"Inserted vote: {vote_type} (voter={voter}, weight={vote_weight})")
        return result["id"]
    else:
        logger.warning(f"Vote already exists: {signature}")
        return None


async def get_strategy_by_creator_and_id(creator: str, strategy_id: int) -> Optional[Dict[str, Any]]:
    """Get strategy by creator and strategy_id"""
    query = """
        SELECT * FROM strategies
        WHERE creator = $1 AND strategy_id = $2
    """
    return await fetch_one(query, creator, strategy_id)
