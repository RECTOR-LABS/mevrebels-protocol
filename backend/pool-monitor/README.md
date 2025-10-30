# MEVrebels Pool Monitor

**Real-time DEX pool monitoring for arbitrage opportunity detection**

This service monitors liquidity pools across Raydium, Orca, and Meteora DEXs, identifies cross-DEX price discrepancies, and publishes profitable arbitrage opportunities to Redis.

## Features

- **Multi-DEX Monitoring**: Raydium AMM, Orca Whirlpools, Meteora DLMM
- **Real-time Price Tracking**: Continuous pool price updates via REST APIs
- **Arbitrage Detection**: Cross-DEX price comparison with configurable profit thresholds
- **Redis Publishing**: Broadcasts opportunities to subscribers via pub/sub
- **High Performance**: Written in Rust for low-latency monitoring
- **Fault Tolerant**: Automatic reconnection and error recovery

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Raydium   │     │    Orca     │     │  Meteora    │
│  REST API   │     │  REST API   │     │  REST API   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       v                   v                   v
┌───────────────────────────────────────────────────────┐
│             Pool Monitor (Rust)                       │
│  ┌─────────────────────────────────────────────┐     │
│  │  Opportunity Detector                       │     │
│  │  - Cross-DEX price comparison               │     │
│  │  - Profit calculation (basis points)        │     │
│  │  - Minimum profit threshold filtering       │     │
│  └─────────────────────────────────────────────┘     │
└───────────────────────────┬───────────────────────────┘
                            │
                            v
                    ┌───────────────┐
                    │     Redis     │
                    │   (Pub/Sub)   │
                    └───────────────┘
                            │
                            v
                ┌───────────────────────┐
                │  API Server           │
                │  Dashboard            │
                │  Execution Bots       │
                └───────────────────────┘
```

## Opportunity Detection Algorithm

1. **Price Monitoring**: Poll each DEX API every 30 seconds
2. **Price Comparison**: For each token pair, compare prices across DEXs
3. **Profit Calculation**: Calculate profit in basis points (bps)
4. **Threshold Filter**: Only emit opportunities above `MIN_PROFIT_BPS`
5. **Opportunity Creation**: Generate unique opportunity with metadata
6. **Publishing**: Broadcast to Redis pub/sub channel "opportunities"
7. **Caching**: Store in Redis with 10-second TTL

## Development

### Prerequisites
- Rust 1.75+
- Redis
- Helius API key

### Install Dependencies

```bash
cargo build
```

### Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
# Edit .env with your credentials
```

### Run Locally

```bash
cargo run
```

Or with specific log level:

```bash
RUST_LOG=debug cargo run
```

## Docker

### Build Image

```bash
docker build -t mevrebels-pool-monitor .
```

### Run Container

```bash
docker run --env-file .env mevrebels-pool-monitor
```

## DEX Integrations

### Raydium AMM
- **API**: https://api.raydium.io/v2/ammV3/ammPools
- **Polling Interval**: 30 seconds
- **Data**: Pool reserves, prices, liquidity
- **Price Calculation**: `price = quote_reserve / base_reserve` (adjusted for decimals)

### Orca Whirlpools
- **API**: https://api.orca.so/v1/whirlpool/list
- **Polling Interval**: 30 seconds
- **Data**: Whirlpool addresses, sqrt_price, tokens
- **Price Calculation**: `price = (sqrt_price / 2^64)^2`

### Meteora DLMM
- **API**: https://dlmm-api.meteora.ag/pair/all
- **Polling Interval**: 30 seconds
- **Data**: Pool reserves, current_price, APR/APY
- **Price Calculation**: Uses provided `current_price` directly

## Opportunity Format

Published opportunities follow this structure:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "buy_dex": "raydium",
  "buy_pool": "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2",
  "sell_dex": "orca",
  "sell_pool": "HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ",
  "token_a": "So11111111111111111111111111111111111111112",
  "token_b": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "buy_price": 100.5,
  "sell_price": 101.2,
  "profit_bps": 70,
  "expected_profit": 7000000,
  "suggested_amount": 1000000000,
  "timestamp": 1704067200
}
```

### Fields Explanation
- **profit_bps**: Profit in basis points (70 bps = 0.7% profit)
- **expected_profit**: Expected profit in lamports (assuming 1 SOL trade)
- **suggested_amount**: Suggested trade size in lamports
- **timestamp**: Unix timestamp when opportunity was detected

## Performance Characteristics

- **Latency**: <500ms from price update to Redis publish
- **Throughput**: Can monitor 1000+ pools simultaneously
- **Memory**: ~50MB typical usage
- **CPU**: <5% on modern hardware
- **Network**: ~1MB/min API traffic

## Monitoring

### Logs
View logs with appropriate levels:
```bash
RUST_LOG=info     # Standard operation
RUST_LOG=debug    # Detailed pool updates
RUST_LOG=trace    # All internal operations
```

### Redis Monitoring
Check opportunities in Redis:
```bash
# Subscribe to opportunities channel
redis-cli SUBSCRIBE opportunities

# List cached opportunities
redis-cli KEYS "opportunity:*"

# Get specific opportunity
redis-cli GET "opportunity:<uuid>"
```

## Testing

### Unit Tests
```bash
cargo test
```

### Integration Tests
```bash
cargo test --test '*'
```

### Manual Testing
```bash
# Start Redis
redis-server

# Run pool monitor
cargo run

# In another terminal, subscribe to opportunities
redis-cli SUBSCRIBE opportunities
```

## Troubleshooting

### No opportunities detected
- Check `MIN_PROFIT_BPS` - may be too high for devnet
- Verify DEX APIs are responding (check logs)
- Ensure pools have sufficient liquidity
- Devnet has minimal MEV activity compared to mainnet

### Redis connection errors
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_URL` in `.env`
- Ensure Redis port 6379 is accessible

### API rate limiting
- Raydium/Orca/Meteora have generous rate limits (no auth required)
- Polling interval is set to 30s to avoid hitting limits
- If needed, increase interval in source code

## Production Considerations

1. **Mainnet Deployment**: Use mainnet RPC and DEX APIs for real opportunities
2. **WebSocket Upgrades**: Integrate WebSocket feeds when available (faster than polling)
3. **Horizontal Scaling**: Run multiple instances with Redis pub/sub
4. **Monitoring**: Set up alerts for service health and opportunity metrics
5. **Cost Optimization**: Use dedicated RPC nodes to reduce costs

## Related Services

- **API Server**: Exposes opportunities via REST/WebSocket
- **Analytics Service**: Indexes historical opportunity data
- **Transaction Monitor**: Tracks execution of opportunities
