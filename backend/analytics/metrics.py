"""
Metrics calculator - compute and cache performance metrics
"""

import asyncio
from typing import Dict, Any, Optional
from loguru import logger
from database import fetch_all, fetch_one
from redis import Redis
from config import get_settings
import json

settings = get_settings()


class MetricsCalculator:
    """Calculate and cache performance metrics"""

    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        self.cache_ttl = 300  # 5 minutes

    async def calculate_strategy_metrics(self, strategy_id: str) -> Dict[str, Any]:
        """Calculate comprehensive metrics for a strategy"""
        cache_key = f"metrics:strategy:{strategy_id}"

        # Check cache
        cached = self.redis.get(cache_key)
        if cached:
            logger.debug(f"Cache hit for strategy metrics: {strategy_id}")
            return json.loads(cached)

        # Calculate metrics
        metrics = {}

        try:
            # Basic stats
            basic = await fetch_one(
                """
                SELECT
                    COUNT(*) as execution_count,
                    SUM(CASE WHEN success THEN 1 ELSE 0 END) as success_count,
                    SUM(profit_lamports) as total_profit,
                    AVG(profit_lamports) as avg_profit,
                    MAX(profit_lamports) as max_profit,
                    MIN(profit_lamports) as min_profit,
                    AVG(gas_used) as avg_gas
                FROM executions
                WHERE strategy_id = $1
                """,
                strategy_id,
            )

            if basic:
                metrics.update(
                    {
                        "execution_count": basic["execution_count"] or 0,
                        "success_count": basic["success_count"] or 0,
                        "success_rate": (
                            basic["success_count"] / basic["execution_count"]
                            if basic["execution_count"] > 0
                            else 0.0
                        ),
                        "total_profit_lamports": basic["total_profit"] or 0,
                        "avg_profit_lamports": basic["avg_profit"] or 0,
                        "max_profit_lamports": basic["max_profit"] or 0,
                        "min_profit_lamports": basic["min_profit"] or 0,
                        "avg_gas_used": basic["avg_gas"] or 0,
                    }
                )

            # ROI calculation
            total_gas = metrics["execution_count"] * metrics.get("avg_gas_used", 0)
            if total_gas > 0:
                metrics["roi"] = metrics["total_profit_lamports"] / total_gas
            else:
                metrics["roi"] = 0.0

            # Time-series metrics (last 24 hours)
            last_24h = await fetch_all(
                """
                SELECT
                    time_bucket('1 hour', timestamp) as hour,
                    COUNT(*) as executions,
                    SUM(profit_lamports) as profit
                FROM executions
                WHERE strategy_id = $1
                  AND timestamp > NOW() - INTERVAL '24 hours'
                GROUP BY hour
                ORDER BY hour DESC
                """,
                strategy_id,
            )

            metrics["last_24h"] = last_24h

            # Cache metrics
            self.redis.setex(cache_key, self.cache_ttl, json.dumps(metrics))

            logger.info(f"Calculated metrics for strategy {strategy_id}")
            return metrics

        except Exception as e:
            logger.error(f"Error calculating strategy metrics: {e}")
            return {}

    async def calculate_creator_metrics(self, creator: str) -> Dict[str, Any]:
        """Calculate metrics for a strategy creator"""
        cache_key = f"metrics:creator:{creator}"

        # Check cache
        cached = self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        # Calculate metrics
        metrics = {}

        try:
            # Strategy count and performance
            result = await fetch_one(
                """
                SELECT
                    COUNT(DISTINCT s.id) as strategy_count,
                    SUM(s.execution_count) as total_executions,
                    SUM(s.total_profit) as total_profit,
                    AVG(CASE WHEN s.execution_count > 0
                        THEN s.success_count::float / s.execution_count
                        ELSE 0 END) as avg_success_rate
                FROM strategies s
                WHERE s.creator = $1
                """,
                creator,
            )

            if result:
                metrics.update(
                    {
                        "strategy_count": result["strategy_count"] or 0,
                        "total_executions": result["total_executions"] or 0,
                        "total_profit_lamports": result["total_profit"] or 0,
                        "avg_success_rate": float(result["avg_success_rate"] or 0),
                    }
                )

            # Earnings
            earnings = await fetch_one(
                """
                SELECT
                    total_earned,
                    strategies_created
                FROM creator_earnings
                WHERE creator = $1
                """,
                creator,
            )

            if earnings:
                metrics["total_earned_lamports"] = earnings["total_earned"] or 0
                metrics["strategies_created"] = earnings["strategies_created"] or 0

            # Top strategies
            top_strategies = await fetch_all(
                """
                SELECT
                    id,
                    name,
                    total_profit,
                    execution_count,
                    success_count
                FROM strategies
                WHERE creator = $1
                ORDER BY total_profit DESC
                LIMIT 5
                """,
                creator,
            )

            metrics["top_strategies"] = top_strategies

            # Cache metrics
            self.redis.setex(cache_key, self.cache_ttl, json.dumps(metrics))

            logger.info(f"Calculated metrics for creator {creator}")
            return metrics

        except Exception as e:
            logger.error(f"Error calculating creator metrics: {e}")
            return {}

    async def calculate_global_metrics(self) -> Dict[str, Any]:
        """Calculate protocol-wide metrics"""
        cache_key = "metrics:global"

        # Check cache
        cached = self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        # Calculate metrics
        metrics = {}

        try:
            # Strategy stats
            strategy_stats = await fetch_one(
                """
                SELECT
                    COUNT(*) as total_strategies,
                    COUNT(*) FILTER (WHERE status = 'active') as active_strategies,
                    COUNT(*) FILTER (WHERE status = 'pending') as pending_strategies
                FROM strategies
                """
            )

            if strategy_stats:
                metrics.update(strategy_stats)

            # Execution stats
            execution_stats = await fetch_one(
                """
                SELECT
                    COUNT(*) as total_executions,
                    SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_executions,
                    SUM(profit_lamports) as total_volume_lamports,
                    AVG(profit_lamports) as avg_profit_lamports
                FROM executions
                WHERE success = true
                """
            )

            if execution_stats:
                metrics.update(execution_stats)

            # Creator stats
            creator_stats = await fetch_one(
                """
                SELECT
                    COUNT(DISTINCT creator) as total_creators
                FROM strategies
                """
            )

            if creator_stats:
                metrics["total_creators"] = creator_stats["total_creators"] or 0

            # Executor stats
            executor_stats = await fetch_one(
                """
                SELECT
                    COUNT(DISTINCT executor) as total_executors
                FROM executions
                """
            )

            if executor_stats:
                metrics["total_executors"] = executor_stats["total_executors"] or 0

            # Proposal stats
            proposal_stats = await fetch_one(
                """
                SELECT
                    COUNT(*) as total_proposals,
                    COUNT(*) FILTER (WHERE status = 'active') as active_proposals
                FROM proposals
                """
            )

            if proposal_stats:
                metrics.update(proposal_stats)

            # Cache metrics
            self.redis.setex(cache_key, self.cache_ttl, json.dumps(metrics))

            logger.info("Calculated global metrics")
            return metrics

        except Exception as e:
            logger.error(f"Error calculating global metrics: {e}")
            return {}

    async def invalidate_cache(self, pattern: str) -> None:
        """Invalidate cached metrics matching pattern"""
        try:
            keys = self.redis.keys(pattern)
            if keys:
                self.redis.delete(*keys)
                logger.info(f"Invalidated {len(keys)} cached metrics matching {pattern}")
        except Exception as e:
            logger.error(f"Error invalidating cache: {e}")


async def background_metrics_calculator(redis_client: Redis, interval_seconds: int = 60):
    """
    Background task to pre-calculate and cache metrics

    Runs periodically to keep cache warm
    """
    calculator = MetricsCalculator(redis_client)

    logger.info(f"Starting background metrics calculator (interval={interval_seconds}s)")

    while True:
        try:
            # Calculate global metrics
            await calculator.calculate_global_metrics()

            # Calculate metrics for top strategies
            top_strategies = await fetch_all(
                """
                SELECT id FROM strategies
                ORDER BY total_profit DESC
                LIMIT 20
                """
            )

            for strategy in top_strategies:
                await calculator.calculate_strategy_metrics(strategy["id"])

            # Calculate metrics for top creators
            top_creators = await fetch_all(
                """
                SELECT creator FROM creator_earnings
                ORDER BY total_earned DESC
                LIMIT 20
                """
            )

            for creator_row in top_creators:
                await calculator.calculate_creator_metrics(creator_row["creator"])

            logger.success("Background metrics calculation complete")

        except Exception as e:
            logger.error(f"Error in background metrics calculator: {e}")

        await asyncio.sleep(interval_seconds)
