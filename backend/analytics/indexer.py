"""
Event indexer - processes on-chain events and populates database
"""

import asyncio
from typing import Dict, Any, List
from loguru import logger
from event_parser import extract_events_from_transaction
from database import (
    insert_strategy,
    insert_execution,
    insert_proposal,
    insert_vote,
    get_strategy_by_creator_and_id,
)
from config import get_settings

settings = get_settings()


class EventIndexer:
    """Indexes on-chain events to PostgreSQL"""

    def __init__(self):
        self.program_ids = [
            settings.strategy_registry_program_id,
            settings.execution_engine_program_id,
            settings.dao_governance_program_id,
            settings.flash_loan_program_id,
        ]

    async def process_transaction(self, tx: Dict[str, Any]) -> int:
        """
        Process a single transaction and index events

        Returns:
            Number of events processed
        """
        try:
            # Extract events from transaction
            events = extract_events_from_transaction(tx, self.program_ids)

            if not events:
                return 0

            logger.info(f"Processing {len(events)} events from transaction {tx.get('signature', 'unknown')}")

            # Process each event
            for event in events:
                await self._process_event(event)

            return len(events)

        except Exception as e:
            logger.error(f"Error processing transaction: {e}")
            return 0

    async def _process_event(self, event: Dict[str, Any]) -> None:
        """Process a single event and write to database"""
        event_type = event.get("event_type")
        signature = event.get("signature")

        try:
            if event_type == "strategy_created":
                await self._process_strategy_created(event)

            elif event_type == "strategy_executed":
                await self._process_strategy_executed(event)

            elif event_type == "profit_distributed":
                await self._process_profit_distributed(event)

            elif event_type == "proposal_created":
                await self._process_proposal_created(event)

            elif event_type == "vote_cast":
                await self._process_vote_cast(event)

            else:
                logger.warning(f"Unknown event type: {event_type}")

        except Exception as e:
            logger.error(f"Error processing {event_type} event (signature={signature}): {e}")

    async def _process_strategy_created(self, event: Dict[str, Any]) -> None:
        """Process StrategyCreated event"""
        # Insert strategy into database
        strategy_id = await insert_strategy(
            creator=event["creator"],
            strategy_id=event["strategy_id"],
            name=event["name"],
            dexs=["raydium", "orca"],  # Parse from event data in production
            token_pairs=[
                {"token_a": "So11111111111111111111111111111111111111112", "token_b": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"}
            ],  # Parse from event data
            profit_threshold=event["profit_threshold"],
            max_slippage=event["max_slippage"],
            status="pending",  # New strategies start as pending
            signature=event["signature"],
        )

        logger.success(f"Indexed StrategyCreated: {event['name']} (id={strategy_id})")

    async def _process_strategy_executed(self, event: Dict[str, Any]) -> None:
        """Process StrategyExecuted event"""
        # Get strategy UUID from database
        # Note: event["strategy"] is the Pubkey, need to look up UUID
        strategy_pubkey = event["strategy"]

        # For now, we'll skip UUID lookup and just log
        # In production, maintain a mapping of Pubkey -> UUID
        logger.info(f"Strategy executed: {strategy_pubkey} (profit={event['profit']})")

        # Insert execution (using strategy pubkey as placeholder)
        execution_id = await insert_execution(
            strategy_id=strategy_pubkey,  # Should be UUID in production
            executor=event["executor"],
            signature=event["signature"],
            profit_lamports=event["profit"],
            gas_used=event["gas_used"],
            success=event["success"],
        )

        if execution_id:
            logger.success(f"Indexed StrategyExecuted: {event['signature']}")

    async def _process_profit_distributed(self, event: Dict[str, Any]) -> None:
        """Process ProfitDistributed event"""
        logger.info(
            f"Profit distributed: creator={event['creator_share']}, "
            f"executor={event['executor_share']}, treasury={event['treasury_share']}"
        )

        # Update creator_earnings and executor_stats
        # This is handled automatically by database triggers

    async def _process_proposal_created(self, event: Dict[str, Any]) -> None:
        """Process ProposalCreated event"""
        # Insert proposal into database
        proposal_id = await insert_proposal(
            proposer=event["proposer"],
            proposal_id=event["proposal_id"],
            title=event["title"],
            description="",  # Parse from event data in production
            proposal_type="strategy_approval",  # Parse from event data
            status="active",
            yes_votes=0,
            no_votes=0,
            end_time=event["end_time"],
        )

        logger.success(f"Indexed ProposalCreated: {event['title']} (id={proposal_id})")

    async def _process_vote_cast(self, event: Dict[str, Any]) -> None:
        """Process VoteCast event"""
        # Get proposal UUID from database
        # Note: event["proposal"] is the Pubkey, need to look up UUID
        proposal_pubkey = event["proposal"]

        # Insert vote (using proposal pubkey as placeholder)
        vote_id = await insert_vote(
            proposal_id=proposal_pubkey,  # Should be UUID in production
            voter=event["voter"],
            vote_type=event["vote_type"],
            vote_weight=event["vote_weight"],
            signature=event["signature"],
        )

        if vote_id:
            logger.success(f"Indexed VoteCast: {event['vote_type']} by {event['voter']}")


class PollingIndexer:
    """
    Polling-based indexer (alternative to webhooks)

    Polls Solana RPC for new transactions involving monitored programs
    """

    def __init__(self, rpc_url: str, interval_seconds: int = 5):
        self.rpc_url = rpc_url
        self.interval_seconds = interval_seconds
        self.indexer = EventIndexer()
        self.last_signature = None
        self.running = False

    async def start(self) -> None:
        """Start polling loop"""
        self.running = True
        logger.info(f"Starting polling indexer (interval={self.interval_seconds}s)")

        while self.running:
            try:
                await self._poll_transactions()
                await asyncio.sleep(self.interval_seconds)

            except Exception as e:
                logger.error(f"Error in polling loop: {e}")
                await asyncio.sleep(self.interval_seconds)

    async def stop(self) -> None:
        """Stop polling loop"""
        self.running = False
        logger.info("Stopping polling indexer")

    async def _poll_transactions(self) -> None:
        """Poll for new transactions"""
        from solana.rpc.async_api import AsyncClient
        from solders.signature import Signature

        async with AsyncClient(self.rpc_url) as client:
            for program_id in self.indexer.program_ids:
                try:
                    # Get signatures for program
                    response = await client.get_signatures_for_address(
                        program_id,
                        limit=10,
                        before=self.last_signature,
                    )

                    if not response.value:
                        continue

                    signatures = [sig.signature for sig in response.value]

                    # Fetch transactions
                    for sig in reversed(signatures):  # Process oldest first
                        tx_response = await client.get_transaction(
                            sig,
                            encoding="jsonParsed",
                            max_supported_transaction_version=0,
                        )

                        if tx_response.value:
                            tx_data = {
                                "signature": str(sig),
                                "slot": tx_response.value.slot,
                                "blockTime": tx_response.value.block_time,
                                "meta": {
                                    "logMessages": tx_response.value.transaction.meta.log_messages
                                    if tx_response.value.transaction.meta
                                    else [],
                                },
                            }

                            await self.indexer.process_transaction(tx_data)

                    # Update last signature
                    if signatures:
                        self.last_signature = signatures[0]

                except Exception as e:
                    logger.error(f"Error polling program {program_id}: {e}")
