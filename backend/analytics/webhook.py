"""
Helius webhook handler for real-time transaction monitoring
"""

import hmac
import hashlib
from typing import List, Dict, Any
from fastapi import APIRouter, Request, HTTPException, Header
from loguru import logger
from indexer import EventIndexer
from config import get_settings

settings = get_settings()
router = APIRouter()
indexer = EventIndexer()


def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    """
    Verify Helius webhook signature

    Helius signs webhooks with HMAC-SHA256
    """
    if not secret:
        logger.warning("Webhook secret not configured, skipping signature verification")
        return True

    expected_signature = hmac.new(
        secret.encode(), payload, hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)


@router.post("/webhook/helius")
async def helius_webhook(
    request: Request,
    x_webhook_signature: str = Header(None, alias="X-Webhook-Signature"),
):
    """
    Receive webhook from Helius

    Helius Enhanced Webhooks format:
    {
        "type": "ENHANCED",
        "transactions": [
            {
                "signature": "...",
                "slot": 123456,
                "blockTime": 1234567890,
                "meta": {
                    "logMessages": ["..."]
                },
                ...
            }
        ]
    }
    """
    try:
        # Read raw body for signature verification
        body = await request.body()

        # Verify signature
        if x_webhook_signature:
            if not verify_webhook_signature(
                body, x_webhook_signature, settings.helius_webhook_secret
            ):
                logger.warning("Invalid webhook signature")
                raise HTTPException(status_code=401, detail="Invalid signature")

        # Parse JSON
        data = await request.json()

        # Process transactions
        if data.get("type") != "ENHANCED":
            logger.warning(f"Unsupported webhook type: {data.get('type')}")
            return {"status": "ignored"}

        transactions = data.get("transactions", [])
        logger.info(f"Received webhook with {len(transactions)} transactions")

        # Index each transaction
        total_events = 0
        for tx in transactions:
            events_processed = await indexer.process_transaction(tx)
            total_events += events_processed

        logger.success(f"Processed {total_events} events from {len(transactions)} transactions")

        return {
            "status": "success",
            "transactions_processed": len(transactions),
            "events_indexed": total_events,
        }

    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "analytics"}


@router.get("/stats")
async def indexer_stats():
    """Get indexer statistics"""
    from database import fetch_one

    stats = {}

    try:
        # Count strategies
        result = await fetch_one("SELECT COUNT(*) as count FROM strategies")
        stats["total_strategies"] = result["count"] if result else 0

        # Count executions
        result = await fetch_one("SELECT COUNT(*) as count FROM executions")
        stats["total_executions"] = result["count"] if result else 0

        # Count proposals
        result = await fetch_one("SELECT COUNT(*) as count FROM proposals")
        stats["total_proposals"] = result["count"] if result else 0

        # Count votes
        result = await fetch_one("SELECT COUNT(*) as count FROM votes")
        stats["total_votes"] = result["count"] if result else 0

    except Exception as e:
        logger.error(f"Error fetching stats: {e}")

    return stats
