"""
On-chain event parser for MEVrebels programs
"""

import base64
import struct
from typing import Dict, Any, Optional, List
from loguru import logger
from solders.pubkey import Pubkey


class EventParser:
    """Parse events from MEVrebels program logs"""

    # Event discriminators (first 8 bytes of event data)
    # These are derived from anchor's event! macro: sha256("event:EventName")[..8]
    STRATEGY_CREATED = "strategy_created"
    STRATEGY_UPDATED = "strategy_updated"
    STRATEGY_EXECUTED = "strategy_executed"
    PROFIT_DISTRIBUTED = "profit_distributed"
    PROPOSAL_CREATED = "proposal_created"
    VOTE_CAST = "vote_cast"

    @staticmethod
    def parse_logs(logs: List[str], program_id: str) -> List[Dict[str, Any]]:
        """
        Parse Anchor program logs for events

        Anchor emits events in the format:
        "Program data: <base64_encoded_event_data>"
        """
        events = []

        for log in logs:
            if log.startswith("Program data:"):
                try:
                    # Extract base64 data
                    data_str = log.replace("Program data: ", "").strip()
                    event_data = base64.b64decode(data_str)

                    # Parse event based on discriminator
                    event = EventParser._parse_event_data(event_data)
                    if event:
                        event["program_id"] = program_id
                        events.append(event)

                except Exception as e:
                    logger.warning(f"Failed to parse event log: {log[:100]}... | Error: {e}")

        return events

    @staticmethod
    def _parse_event_data(data: bytes) -> Optional[Dict[str, Any]]:
        """Parse raw event data based on discriminator"""
        if len(data) < 8:
            return None

        # First 8 bytes are the discriminator
        discriminator = data[:8]

        # Parse based on discriminator
        # NOTE: These are simplified parsers - real implementation would use Anchor IDL
        try:
            if EventParser._matches_event(discriminator, EventParser.STRATEGY_CREATED):
                return EventParser._parse_strategy_created(data[8:])
            elif EventParser._matches_event(discriminator, EventParser.STRATEGY_EXECUTED):
                return EventParser._parse_strategy_executed(data[8:])
            elif EventParser._matches_event(discriminator, EventParser.PROFIT_DISTRIBUTED):
                return EventParser._parse_profit_distributed(data[8:])
            elif EventParser._matches_event(discriminator, EventParser.PROPOSAL_CREATED):
                return EventParser._parse_proposal_created(data[8:])
            elif EventParser._matches_event(discriminator, EventParser.VOTE_CAST):
                return EventParser._parse_vote_cast(data[8:])
        except Exception as e:
            logger.error(f"Failed to parse event data: {e}")

        return None

    @staticmethod
    def _matches_event(discriminator: bytes, event_name: str) -> bool:
        """Check if discriminator matches expected event"""
        # For demo, we'll use simple string matching
        # In production, use proper sha256 hash of "event:EventName"
        import hashlib
        expected = hashlib.sha256(f"event:{event_name}".encode()).digest()[:8]
        return discriminator == expected

    @staticmethod
    def _parse_strategy_created(data: bytes) -> Dict[str, Any]:
        """Parse StrategyCreated event"""
        # Event structure (simplified):
        # - creator: Pubkey (32 bytes)
        # - strategy_id: u64 (8 bytes)
        # - name: String (length-prefixed)
        # - dexs: Vec<u8> (length-prefixed)
        # - token_pairs: Vec<TokenPair> (length-prefixed)

        offset = 0

        # Creator (32 bytes)
        creator_bytes = data[offset : offset + 32]
        creator = str(Pubkey.from_bytes(creator_bytes))
        offset += 32

        # Strategy ID (8 bytes, little-endian u64)
        strategy_id = struct.unpack("<Q", data[offset : offset + 8])[0]
        offset += 8

        # Name (4-byte length prefix + string)
        name_len = struct.unpack("<I", data[offset : offset + 4])[0]
        offset += 4
        name = data[offset : offset + name_len].decode("utf-8")
        offset += name_len

        # Profit threshold (8 bytes, little-endian u64)
        profit_threshold = struct.unpack("<Q", data[offset : offset + 8])[0]
        offset += 8

        # Max slippage (2 bytes, little-endian u16)
        max_slippage = struct.unpack("<H", data[offset : offset + 2])[0]
        offset += 2

        return {
            "event_type": "strategy_created",
            "creator": creator,
            "strategy_id": strategy_id,
            "name": name,
            "profit_threshold": profit_threshold,
            "max_slippage": max_slippage,
        }

    @staticmethod
    def _parse_strategy_executed(data: bytes) -> Dict[str, Any]:
        """Parse StrategyExecuted event"""
        offset = 0

        # Strategy (32 bytes)
        strategy_bytes = data[offset : offset + 32]
        strategy = str(Pubkey.from_bytes(strategy_bytes))
        offset += 32

        # Executor (32 bytes)
        executor_bytes = data[offset : offset + 32]
        executor = str(Pubkey.from_bytes(executor_bytes))
        offset += 32

        # Profit (8 bytes, little-endian u64)
        profit = struct.unpack("<Q", data[offset : offset + 8])[0]
        offset += 8

        # Gas used (4 bytes, little-endian u32)
        gas_used = struct.unpack("<I", data[offset : offset + 4])[0]
        offset += 4

        # Success (1 byte, boolean)
        success = data[offset] == 1
        offset += 1

        return {
            "event_type": "strategy_executed",
            "strategy": strategy,
            "executor": executor,
            "profit": profit,
            "gas_used": gas_used,
            "success": success,
        }

    @staticmethod
    def _parse_profit_distributed(data: bytes) -> Dict[str, Any]:
        """Parse ProfitDistributed event"""
        offset = 0

        # Strategy (32 bytes)
        strategy_bytes = data[offset : offset + 32]
        strategy = str(Pubkey.from_bytes(strategy_bytes))
        offset += 32

        # Creator share (8 bytes)
        creator_share = struct.unpack("<Q", data[offset : offset + 8])[0]
        offset += 8

        # Executor share (8 bytes)
        executor_share = struct.unpack("<Q", data[offset : offset + 8])[0]
        offset += 8

        # Treasury share (8 bytes)
        treasury_share = struct.unpack("<Q", data[offset : offset + 8])[0]
        offset += 8

        return {
            "event_type": "profit_distributed",
            "strategy": strategy,
            "creator_share": creator_share,
            "executor_share": executor_share,
            "treasury_share": treasury_share,
        }

    @staticmethod
    def _parse_proposal_created(data: bytes) -> Dict[str, Any]:
        """Parse ProposalCreated event"""
        offset = 0

        # Proposer (32 bytes)
        proposer_bytes = data[offset : offset + 32]
        proposer = str(Pubkey.from_bytes(proposer_bytes))
        offset += 32

        # Proposal ID (8 bytes)
        proposal_id = struct.unpack("<Q", data[offset : offset + 8])[0]
        offset += 8

        # Title (length-prefixed string)
        title_len = struct.unpack("<I", data[offset : offset + 4])[0]
        offset += 4
        title = data[offset : offset + title_len].decode("utf-8")
        offset += title_len

        # End time (8 bytes, Unix timestamp)
        end_time = struct.unpack("<Q", data[offset : offset + 8])[0]
        offset += 8

        return {
            "event_type": "proposal_created",
            "proposer": proposer,
            "proposal_id": proposal_id,
            "title": title,
            "end_time": end_time,
        }

    @staticmethod
    def _parse_vote_cast(data: bytes) -> Dict[str, Any]:
        """Parse VoteCast event"""
        offset = 0

        # Proposal (32 bytes)
        proposal_bytes = data[offset : offset + 32]
        proposal = str(Pubkey.from_bytes(proposal_bytes))
        offset += 32

        # Voter (32 bytes)
        voter_bytes = data[offset : offset + 32]
        voter = str(Pubkey.from_bytes(voter_bytes))
        offset += 32

        # Vote type (1 byte: 0=Against, 1=For)
        vote_type = "for" if data[offset] == 1 else "against"
        offset += 1

        # Vote weight (8 bytes)
        vote_weight = struct.unpack("<Q", data[offset : offset + 8])[0]
        offset += 8

        return {
            "event_type": "vote_cast",
            "proposal": proposal,
            "voter": voter,
            "vote_type": vote_type,
            "vote_weight": vote_weight,
        }


def extract_events_from_transaction(tx: Dict[str, Any], program_ids: List[str]) -> List[Dict[str, Any]]:
    """
    Extract events from a Solana transaction

    Args:
        tx: Transaction object from Helius webhook
        program_ids: List of program IDs to monitor

    Returns:
        List of parsed events
    """
    events = []

    # Check if transaction has logs
    if "meta" not in tx or "logMessages" not in tx["meta"]:
        return events

    logs = tx["meta"]["logMessages"]
    signature = tx.get("signature", "unknown")

    # Parse logs for each monitored program
    for program_id in program_ids:
        program_events = EventParser.parse_logs(logs, program_id)

        # Add transaction metadata to events
        for event in program_events:
            event["signature"] = signature
            event["slot"] = tx.get("slot", 0)
            event["timestamp"] = tx.get("blockTime", 0)

        events.extend(program_events)

    logger.debug(f"Extracted {len(events)} events from transaction {signature}")
    return events
