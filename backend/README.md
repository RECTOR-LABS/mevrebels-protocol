# MEVrebels Backend Services

Production-grade backend infrastructure for MEVrebels Protocol.

**Production Status**: ✅ LIVE at `https://api.mevrebels.rectorspace.com`

**Deployed Services**: 4/6 (API Server, Analytics, PostgreSQL, Redis)
**Pending Services**: Pool Monitor (Rust), Transaction Monitor (Rust)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MEVrebels Backend                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Pool Monitor │  │ Transaction  │  │  Analytics   │      │
│  │   (Rust)     │  │   Monitor    │  │   Service    │      │
│  │              │  │   (Rust)     │  │  (Python)    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  PostgreSQL    │                        │
│                    │ (TimescaleDB)  │                        │
│                    └───────┬────────┘                        │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐              │
│         │                  │                  │              │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐      │
│  │ API Server   │  │    Redis     │  │   WebSocket  │      │
│  │ (Node.js)    │  │   Cache      │  │    Server    │      │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘      │
│         │                                    │              │
│         └────────────────┬───────────────────┘              │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │    Dashboard    │
                  │   (Next.js)     │
                  └─────────────────┘
```

## Services

### 1. Pool Monitor (`pool-monitor/`)
**Language**: Rust
**Purpose**: Real-time DEX pool monitoring and opportunity detection

**Features**:
- Raydium, Orca, Meteora pool subscriptions
- Cross-DEX price discrepancy detection
- Opportunity scoring and filtering
- Latency <500ms target

**Tech Stack**:
- `tokio` for async runtime
- `solana-client` for RPC/WebSocket
- `redis` for opportunity caching
- `serde` for serialization

### 2. Transaction Monitor (`transaction-monitor/`)
**Language**: Rust
**Purpose**: Monitor on-chain transactions and execution results

**Features**:
- Helius Geyser webhook integration
- Parse strategy execution events
- Real-time alerts to executors
- Execution history indexing

**Tech Stack**:
- `axum` for webhook server
- `sqlx` for PostgreSQL
- `tokio` for async
- `solana-transaction-status` for parsing

### 3. Analytics Service (`analytics/`)
**Language**: Python
**Purpose**: Strategy performance metrics and leaderboards

**Features**:
- Event indexer (StrategyCreated, Executed, etc.)
- Performance calculations (profit, ROI, success rate)
- Leaderboard generation
- Creator earnings tracking

**Tech Stack**:
- `asyncpg` for PostgreSQL
- `redis-py` for caching
- `solana-py` for RPC
- `FastAPI` for internal API (optional)

### 4. API Server (`api-server/`)
**Language**: TypeScript (Node.js)
**Purpose**: REST API and WebSocket server for dashboard

**Features**:
- REST endpoints (`/api/strategies`, `/api/leaderboard`, etc.)
- WebSocket server (`/ws/opportunities`, `/ws/executions`)
- Authentication (wallet signatures)
- Rate limiting

**Tech Stack**:
- `express` or `fastify` for HTTP
- `ws` for WebSocket
- `ioredis` for Redis
- `prisma` or `pg` for PostgreSQL

### 5. Shared (`shared/`)
**Purpose**: Common types, utilities, and configuration

**Contents**:
- TypeScript types (strategy, execution, proposal)
- RPC connection utilities
- Environment configuration
- Database migrations

## Production Deployment

**Live API**: https://api.mevrebels.rectorspace.com
**WebSocket**: wss://api.mevrebels.rectorspace.com/ws
**Server**: VPS at 176.222.53.185 (user: mevrebels)

### Deployed Services
- ✅ **API Server** (Node.js) - Ports 3011 (HTTP), 3012 (WebSocket)
- ✅ **Analytics Service** (Python/FastAPI) - Port 3014
- ✅ **PostgreSQL** (TimescaleDB) - Port 5433
- ✅ **Redis** (Cache/PubSub) - Port 6380
- ⏳ **Pool Monitor** (Rust) - Pending (dependency conflicts)
- ⏳ **Transaction Monitor** (Rust) - Pending (dependency conflicts)

### SSL & Reverse Proxy
- Nginx with Let's Encrypt SSL
- Rate limiting: 100 req/s
- Auto-renewal via certbot systemd timer
- HTTPS-only (HTTP redirects to HTTPS)

### Quick Health Check
```bash
# API Server
curl https://api.mevrebels.rectorspace.com/health

# Analytics Service
curl https://api.mevrebels.rectorspace.com/analytics/health
```

## Local Development

### Prerequisites
```bash
# Docker & Docker Compose V2
docker --version
docker compose version  # Note: V2 uses space, not hyphen

# Rust (for pool-monitor, transaction-monitor)
rustc --version

# Node.js 20+ (for api-server)
node --version
npm --version

# Python 3.11+ (for analytics)
python3 --version
pip3 --version
```

### Environment Setup
```bash
# Copy example env
cp .env.example .env

# Edit with your configuration
# - HELIUS_API_KEY
# - DATABASE_URL
# - REDIS_URL
```

### Local Development (Full Stack)
```bash
# Start infrastructure (PostgreSQL + Redis)
docker compose up -d postgres redis

# Run migrations
cd migrations && psql $DATABASE_URL -f init.sql

# Start all services (in separate terminals)
cd api-server && npm install && npm run dev        # Port 3001
cd analytics && pip install -r requirements.txt && python -m analytics.main  # Port 3004
cd pool-monitor && cargo run                       # Port 3003 (optional)
cd transaction-monitor && cargo run                # Webhook receiver (optional)
```

### Production Deployment (Simplified)
```bash
# Using docker-compose.simple.yml (without Rust services)
# This is the current production deployment

# Build services
docker compose -f docker-compose.simple.yml build

# Deploy
docker compose -f docker-compose.simple.yml up -d

# View logs
docker compose -f docker-compose.simple.yml logs -f

# Check service health
docker compose -f docker-compose.simple.yml ps
```

### Integration Testing
```bash
# Run comprehensive integration tests (SSL, health, API, CORS, performance)
cd tests
chmod +x integration-test.sh
./integration-test.sh

# Test specific endpoints
curl https://api.mevrebels.rectorspace.com/health
curl https://api.mevrebels.rectorspace.com/api/strategies
curl https://api.mevrebels.rectorspace.com/analytics/leaderboard
```

## Configuration

### Environment Variables

```bash
# Solana RPC
HELIUS_DEVNET_RPC=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
HELIUS_MAINNET_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/mevrebels

# Redis
REDIS_URL=redis://localhost:6379

# Program IDs (Devnet)
STRATEGY_REGISTRY_PROGRAM_ID=RECjnbr96LG2mDTXzhB5ZVY4JRfnSKmtx1pCgrGbMws
EXECUTION_ENGINE_PROGRAM_ID=REC2Aq9iAu4hu7efgJhtyFyWS1bSBDYgeoVXXQFtfpk
DAO_GOVERNANCE_PROGRAM_ID=RECwcpcHwBeDAV7tBvUuhJzsih16BaveZRC74kbBkSS
FLASH_LOAN_PROGRAM_ID=REChcXRRzBxhLvjs4v1HZ1Zx3R6hUnTEVjdKDwwbT9w

# API Server (Production ports: 3011 HTTP, 3012 WebSocket)
API_PORT=3001          # Local dev
WS_PORT=3002           # Local dev

# Production uses docker-compose.simple.yml with port mapping:
# - 3011:3001 (HTTP API)
# - 3012:3002 (WebSocket)
# - 3014:3004 (Analytics)
# - 5433:5432 (PostgreSQL)
# - 6380:6379 (Redis)

# Pool Monitor
POOL_MONITOR_PORT=3003
MIN_PROFIT_BPS=50  # 0.5%

# Analytics
ANALYTICS_PORT=3004    # Local dev (3014 in production)
CACHE_TTL_SECONDS=300  # 5 minutes
```

## Database Schema

### Tables

**strategies**
- id: UUID (primary key)
- creator: TEXT (wallet pubkey)
- strategy_id: BIGINT
- name: TEXT
- dexs: JSONB
- token_pairs: JSONB
- profit_threshold: INTEGER
- max_slippage: INTEGER
- status: TEXT (pending/approved/rejected)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ

**executions**
- id: UUID (primary key)
- strategy_id: UUID (foreign key)
- executor: TEXT (wallet pubkey)
- profit_lamports: BIGINT
- gas_used: INTEGER
- success: BOOLEAN
- timestamp: TIMESTAMPTZ (indexed)

**proposals**
- id: UUID (primary key)
- proposal_id: BIGINT
- type: TEXT (strategy-approval/parameter-change/treasury)
- title: TEXT
- description: TEXT
- proposer: TEXT
- votes_yes: BIGINT
- votes_no: BIGINT
- votes_abstain: BIGINT
- status: TEXT (active/passed/rejected/executed)
- created_at: TIMESTAMPTZ
- ends_at: TIMESTAMPTZ

## API Endpoints

### Production Endpoints
**Base URL**: `https://api.mevrebels.rectorspace.com`

### Health Checks
```bash
# API Server health
curl https://api.mevrebels.rectorspace.com/health
# Response: {"status":"ok","uptime":123456,"timestamp":"2025-10-30T..."}

# Analytics health
curl https://api.mevrebels.rectorspace.com/analytics/health
# Response: {"status":"healthy","service":"analytics"}
```

### REST API

**Strategies**
```bash
# List all strategies
GET https://api.mevrebels.rectorspace.com/api/strategies

# Get strategy details
GET https://api.mevrebels.rectorspace.com/api/strategies/:id

# Get strategy performance stats
GET https://api.mevrebels.rectorspace.com/api/strategies/:id/stats
```

**Executions**
```bash
# List all executions
GET https://api.mevrebels.rectorspace.com/api/executions

# Get execution details
GET https://api.mevrebels.rectorspace.com/api/executions/:id
```

**Proposals (DAO Governance)**
```bash
# List all proposals
GET https://api.mevrebels.rectorspace.com/api/proposals

# Get proposal details
GET https://api.mevrebels.rectorspace.com/api/proposals/:id
```

**Analytics**
```bash
# Strategy statistics
GET https://api.mevrebels.rectorspace.com/analytics/strategies/stats

# Execution statistics
GET https://api.mevrebels.rectorspace.com/analytics/executions/stats

# Leaderboard (top strategies and creators)
GET https://api.mevrebels.rectorspace.com/analytics/leaderboard
```

### WebSocket Events

**Opportunities**
```javascript
// Production WebSocket
const ws = new WebSocket('wss://api.mevrebels.rectorspace.com/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // { type: 'opportunity', data: {...} }
};
```

**Executions**
```javascript
// Real-time execution events
const ws = new WebSocket('wss://api.mevrebels.rectorspace.com/ws/executions');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // { type: 'execution', data: {...} }
};
```

### Local Development Endpoints
- `GET http://localhost:3001/health` - API Server health
- `GET http://localhost:3001/api/strategies` - Strategies
- `GET http://localhost:3004/health` - Analytics health
- `ws://localhost:3002` - WebSocket server

## Monitoring

### Production Health Checks
```bash
# API Server
curl https://api.mevrebels.rectorspace.com/health

# Analytics Service
curl https://api.mevrebels.rectorspace.com/analytics/health

# All endpoints (integration test)
cd tests && ./integration-test.sh
```

### Production Logs
```bash
# SSH into production VPS
ssh mevrebels

# View all service logs
cd /home/mevrebels/mevrebels-backend
docker compose -f docker-compose.simple.yml logs -f

# Specific service logs
docker compose logs -f api-server
docker compose logs -f analytics
docker compose logs -f postgres
docker compose logs -f redis

# Nginx logs
sudo tail -f /var/log/nginx/mevrebels-api-access.log
sudo tail -f /var/log/nginx/mevrebels-api-error.log
```

### Docker Service Status
```bash
# Check all services
docker compose -f docker-compose.simple.yml ps

# Expected output:
# NAME                    STATUS    PORTS
# mevrebels-postgres      healthy   0.0.0.0:5433->5432/tcp
# mevrebels-redis         healthy   0.0.0.0:6380->6379/tcp
# mevrebels-api-server    running   0.0.0.0:3011->3001/tcp, 0.0.0.0:3012->3002/tcp
# mevrebels-analytics     running   0.0.0.0:3014->3004/tcp
```

## Testing

### Integration Tests
```bash
# Comprehensive production tests (SSL, health, API, CORS, performance)
cd backend/tests
./integration-test.sh

# Test suite includes:
# - SSL certificate validity
# - HSTS security headers
# - Health endpoint checks
# - API endpoint responses
# - CORS headers
# - OPTIONS preflight
# - Response time (<500ms)
# - Docker service health
```

### Local Unit Tests
```bash
# API Server tests
cd api-server && npm test

# Analytics tests
cd analytics && pytest

# TypeScript type checking
cd api-server && npm run type-check

# TypeScript strict type checking
cd api-server && npm run typecheck:strict
```

## Deployment

### Automated Deployment Script
```bash
# Deploy from local machine to production VPS
cd backend/deployment
./deploy.sh

# This script:
# 1. Copies files to VPS
# 2. Builds Docker images
# 3. Starts services
# 4. Runs health checks
```

### Manual Deployment Steps
```bash
# 1. SSH into VPS
ssh mevrebels

# 2. Navigate to deployment directory
cd /home/mevrebels/mevrebels-backend

# 3. Pull latest changes (if using git)
git pull origin main

# 4. Rebuild and restart services
docker compose -f docker-compose.simple.yml build
docker compose -f docker-compose.simple.yml up -d

# 5. Verify services are healthy
docker compose -f docker-compose.simple.yml ps

# 6. Check logs
docker compose -f docker-compose.simple.yml logs -f
```

### Nginx + SSL Setup
```bash
# Deploy Nginx configuration and obtain SSL certificate
cd backend/deployment
./deploy-nginx.sh

# This script:
# 1. Installs Nginx and Certbot
# 2. Deploys temporary HTTP config
# 3. Obtains Let's Encrypt SSL certificate
# 4. Deploys full HTTPS config
# 5. Sets up auto-renewal
```

For detailed deployment guide, see [`deployment/README.md`](deployment/README.md).

## Performance Targets

- **Pool Monitor Latency**: <500ms from pool update to opportunity broadcast
- **API Response Time**: <200ms for GET requests
- **WebSocket Latency**: <100ms for event delivery
- **Database Query Time**: <50ms for indexed queries
- **Cache Hit Rate**: >90% for analytics endpoints

## Troubleshooting

### Production Issues & Solutions

#### 1. Docker Compose Command Not Found
**Error**: `bash: docker-compose: command not found`
**Cause**: VPS uses Docker Compose V2 (with space, not hyphen)
**Solution**:
```bash
# Use V2 syntax (space, not hyphen)
docker compose up -d  # ✅ Correct
docker-compose up -d  # ❌ Wrong (V1 syntax)
```

#### 2. Port Conflicts
**Error**: `failed to bind host port 0.0.0.0:6379: address already in use`
**Cause**: Multiple projects sharing same VPS, standard ports already taken
**Solution**: Changed all ports in `docker-compose.simple.yml`:
```yaml
# PostgreSQL: 5432 → 5433
# Redis: 6379 → 6380
# API Server HTTP: 3001 → 3011
# API Server WebSocket: 3002 → 3012
# Analytics: 3004 → 3014
```

#### 3. TypeScript Compilation Error (db.ts)
**Error**: `Type 'T' does not satisfy the constraint 'QueryResultRow'`
**Cause**: Missing type constraint on generic function
**Solution**:
```typescript
// Add QueryResultRow import and constraint
import { QueryResultRow } from 'pg';
export async function query<T extends QueryResultRow = any>(...)
```

#### 4. Python Dependency Conflicts
**Error**: `Cannot install solana==0.32.0 and httpx==0.25.2 (conflicting dependencies)`
**Cause**: Incompatible package versions in Solana ecosystem
**Solution**: Downgrade to compatible versions in `requirements.txt`:
```txt
solana==0.30.2      # Not 0.32.0
solders==0.18.1     # Not 0.20.0
httpx==0.23.3       # Not 0.25.2
anchorpy==0.18.0    # Requires solana<0.31.0
```

#### 5. Nginx Analytics 404
**Error**: `GET /analytics/health HTTP/2 404`
**Cause**: Nginx proxy_pass without trailing slash doesn't rewrite URLs correctly
**Solution**: Add trailing slash to proxy_pass directive:
```nginx
# Wrong:
location /analytics/ {
    proxy_pass http://analytics_service;
}

# Correct:
location /analytics/ {
    proxy_pass http://analytics_service/;  # Trailing slash!
}
```

#### 6. Rust Services Dependency Conflicts
**Error**: `failed to select a version for serde_core (all possible versions conflict)`
**Cause**: sqlx and Solana dependencies require incompatible serde versions
**Status**: ⏳ Unresolved - deployed without Rust services
**Workaround**: Using `docker-compose.simple.yml` with only API + Analytics + DB + Redis

#### 7. Missing package-lock.json on VPS
**Error**: `npm ci` requires package-lock.json but file not present
**Cause**: `npm install` run locally after deployment script copied files
**Solution**:
```bash
# Generate locally first
cd api-server && npm install

# Then copy to VPS
scp package-lock.json mevrebels:/home/mevrebels/mevrebels-backend/api-server/
```

### Common Issues

**PostgreSQL connection failed**
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# View logs
docker compose logs postgres

# Test connection
docker exec -it mevrebels-postgres psql -U postgres -d mevrebels
```

**Redis connection failed**
```bash
# Check if Redis is running
docker compose ps redis

# Test connection (note port 6380, not default 6379)
redis-cli -p 6380 -a ***REMOVED*** ping
```

**SSL certificate renewal failed**
```bash
# Check certbot timer status
ssh mevrebels
sudo systemctl status certbot.timer

# Manual renewal
sudo certbot renew --dry-run

# Check certificate expiry
openssl s_client -connect api.mevrebels.rectorspace.com:443 -servername api.mevrebels.rectorspace.com < /dev/null 2>&1 | grep -A 2 "Validity"
```

**Empty API responses (no data)**
```bash
# This is expected if no strategies/executions created yet
# Database is empty on initial deployment
# Data will populate when users interact with dApp

# Verify database schema exists
ssh mevrebels
docker exec -it mevrebels-postgres psql -U postgres -d mevrebels -c "\dt"
```

**High latency / slow responses**
```bash
# Check Docker resource usage
docker stats

# Check VPS resources
ssh mevrebels
htop  # or: top

# Optimize PostgreSQL if needed
docker exec -it mevrebels-postgres psql -U postgres -d mevrebels -c "ANALYZE;"
```

## Contributing

1. Create feature branch
2. Implement service
3. Add tests
4. Update documentation
5. Submit PR

## License

MIT
