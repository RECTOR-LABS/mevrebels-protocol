"""
Analytics Service - Main Application

Event indexer and metrics calculator for MEVrebels Protocol
"""

import asyncio
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from loguru import logger
from redis import Redis

from config import get_settings
from database import init_db, close_db
from webhook import router as webhook_router
from indexer import PollingIndexer
from metrics import background_metrics_calculator

settings = get_settings()

# Configure logging
logger.remove()
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> | <level>{message}</level>",
    level=settings.log_level,
)


# Redis client
redis_client = Redis.from_url(settings.redis_url, decode_responses=True)

# Background tasks
background_tasks = set()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting Analytics Service...")

    # Initialize database
    await init_db()

    # Start background tasks
    logger.info("Starting background tasks...")

    # Start polling indexer (alternative to webhooks)
    polling_indexer = PollingIndexer(
        rpc_url=settings.helius_devnet_rpc,
        interval_seconds=settings.polling_interval_seconds,
    )
    polling_task = asyncio.create_task(polling_indexer.start())
    background_tasks.add(polling_task)

    # Start metrics calculator
    metrics_task = asyncio.create_task(
        background_metrics_calculator(redis_client, interval_seconds=60)
    )
    background_tasks.add(metrics_task)

    logger.success("Analytics Service started successfully")

    yield

    # Shutdown
    logger.info("Shutting down Analytics Service...")

    # Stop background tasks
    await polling_indexer.stop()
    for task in background_tasks:
        task.cancel()

    # Close connections
    await close_db()
    redis_client.close()

    logger.info("Analytics Service stopped")


# Create FastAPI app
app = FastAPI(
    title="MEVrebels Analytics Service",
    description="Event indexer and metrics calculator",
    version="1.0.0",
    lifespan=lifespan,
)

# Include routers
app.include_router(webhook_router, tags=["webhooks"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "MEVrebels Analytics Service",
        "version": "1.0.0",
        "status": "running",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
        log_level=settings.log_level.lower(),
    )
