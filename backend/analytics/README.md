# MEVrebels Analytics Service

**Event indexer and metrics calculator for MEVrebels Protocol**

This service monitors on-chain programs, indexes events to PostgreSQL, and calculates performance metrics.

## Features

- **Event Indexing**: Parse and index on-chain events (StrategyCreated, StrategyExecuted, ProfitDistributed)
- **Helius Webhooks**: Real-time transaction monitoring via Enhanced Webhooks
- **Polling Indexer**: Alternative RPC polling for missed transactions
- **Metrics Calculation**: Performance metrics for strategies, creators, and protocol
- **Cache Management**: Redis caching for frequently accessed metrics
- **Background Tasks**: Automatic metrics pre-calculation

## Architecture

```
┌─────────────────┐
│  Helius Webhook │
│   (Real-time)   │
└────────┬────────┘
         │
         v
┌─────────────────┐      ┌──────────────┐
│ Event Parser    │─────>│  PostgreSQL  │
│ (Anchor Events) │      │  (TimescaleDB)│
└────────┬────────┘      └──────────────┘
         │
         v
┌─────────────────┐      ┌──────────────┐
│ Metrics         │─────>│    Redis     │
│ Calculator      │      │   (Cache)    │
└─────────────────┘      └──────────────┘
```

## Monitored Events

### Strategy Registry Program
- `StrategyCreated`: New strategy submitted
- `StrategyUpdated`: Strategy parameters changed

### Execution Engine Program
- `StrategyExecuted`: Arbitrage executed (profit, gas, success)
- `ProfitDistributed`: Profit split to creator/executor/treasury

### DAO Governance Program
- `ProposalCreated`: New governance proposal
- `VoteCast`: Vote on proposal

## Development

### Prerequisites
- Python 3.11+
- PostgreSQL with TimescaleDB
- Redis
- Helius API key

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
# Edit .env with your credentials
```

### Run Locally

```bash
python main.py
```

The service will start on `http://localhost:3004`

### Endpoints

- `GET /` - Service info
- `GET /health` - Health check
- `GET /stats` - Indexer statistics
- `POST /webhook/helius` - Helius webhook receiver (authenticated)

## Docker

### Build Image

```bash
docker build -t mevrebels-analytics .
```

### Run Container

```bash
docker run -p 3004:3004 --env-file .env mevrebels-analytics
```

## Helius Webhook Setup

1. Create webhook at https://dev.helius.xyz/webhooks
2. Configure webhook:
   - **Type**: Enhanced Transactions
   - **Transaction Types**: All
   - **Account Addresses**: Add all 4 program IDs
   - **Webhook URL**: `https://your-domain.com/webhook/helius`
   - **Auth Header**: Set webhook secret in `.env`

3. Test webhook:
```bash
curl -X POST http://localhost:3004/webhook/helius \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: test" \
  -d '{"type": "ENHANCED", "transactions": []}'
```

## Polling Indexer

If webhooks are not available, the service automatically falls back to RPC polling:

- **Interval**: 5 seconds (configurable)
- **Batch Size**: 10 transactions per poll
- **Deduplication**: Tracks last processed signature

## Metrics Calculation

### Strategy Metrics
- Execution count and success rate
- Total/average/min/max profit
- Average gas used
- ROI calculation
- 24-hour time-series data

### Creator Metrics
- Total strategies created
- Total executions and profit
- Average success rate
- Top 5 strategies
- Total earnings from profit share

### Global Metrics
- Total strategies (active/pending)
- Total executions and volume
- Unique creators and executors
- Proposal and vote counts

## Background Tasks

### Metrics Pre-calculation (60s interval)
- Calculates and caches global metrics
- Pre-calculates metrics for top 20 strategies
- Pre-calculates metrics for top 20 creators
- Keeps Redis cache warm

### Polling Indexer (5s interval)
- Polls Solana RPC for new transactions
- Processes events from all monitored programs
- Handles missed transactions from webhook failures

## Performance

- **Indexing Latency**: <1s from webhook receipt to database write
- **Metrics Calculation**: <500ms for strategy metrics
- **Cache Hit Rate**: >90% for frequently accessed metrics
- **Database Writes**: Batched for efficiency

## Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html
```

## Monitoring

### Health Check
```bash
curl http://localhost:3004/health
```

### Indexer Stats
```bash
curl http://localhost:3004/stats
```

Response:
```json
{
  "total_strategies": 42,
  "total_executions": 1337,
  "total_proposals": 15,
  "total_votes": 89
}
```

## Troubleshooting

### No events being indexed
- Check program IDs in `.env` match deployed programs
- Verify Helius webhook is configured correctly
- Check webhook signature verification
- Ensure polling indexer is running

### Metrics not updating
- Check Redis connection
- Verify database triggers are working
- Check background task logs

### High memory usage
- Reduce `BATCH_SIZE` in `.env`
- Increase `POLLING_INTERVAL_SECONDS`
- Reduce metrics cache TTL

## Production Deployment

1. Use production database with connection pooling
2. Configure webhook secret for security
3. Set up monitoring and alerting
4. Enable log aggregation (e.g., CloudWatch, Datadog)
5. Use Redis Cluster for high availability
6. Scale horizontally with multiple instances (webhook load balancing)

## Related Services

- **API Server**: Serves indexed data via REST/WebSocket
- **Pool Monitor**: Detects arbitrage opportunities
- **Transaction Monitor**: Alerts on execution status
