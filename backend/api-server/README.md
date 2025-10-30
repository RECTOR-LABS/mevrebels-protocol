# MEVrebels API Server

REST API and WebSocket server for MEVrebels Protocol.

## Features

- **REST API**: Strategies, leaderboard, proposals, analytics
- **WebSocket**: Real-time opportunities and execution updates
- **PostgreSQL**: Persistent data storage with TimescaleDB
- **Redis**: Caching and pub/sub
- **Rate Limiting**: Per-IP request throttling
- **CORS**: Configurable cross-origin support

## API Endpoints

### Strategies
- `GET /api/strategies` - List all strategies
- `GET /api/strategies/:id` - Get strategy details
- `GET /api/strategies/:id/stats` - Performance metrics
- `GET /api/strategies/:id/executions` - Execution history

### Leaderboard
- `GET /api/leaderboard` - Top strategies
- `GET /api/leaderboard/creators` - Top creators
- `GET /api/leaderboard/creator/:pubkey` - Creator stats

### Proposals
- `GET /api/proposals` - List proposals
- `GET /api/proposals/:id` - Proposal details
- `GET /api/proposals/:id/votes` - Proposal votes

### Analytics
- `GET /api/analytics/overview` - Protocol metrics
- `GET /api/analytics/chart/executions` - Time-series data

## WebSocket Events

Connect to `ws://localhost:3002`

**Server → Client:**
- `opportunity` - New arbitrage opportunity detected
- `execution` - Strategy executed
- `proposal_created` - New governance proposal
- `ping` - Keep-alive

**Client → Server:**
- `ping` - Request pong response

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Docker

```bash
# Build image
docker build -t mevrebels-api-server .

# Run container
docker run -p 3001:3001 -p 3002:3002 --env-file .env mevrebels-api-server
```

## Environment Variables

See `.env.example` for all configuration options.

## Testing

```bash
# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint
```
