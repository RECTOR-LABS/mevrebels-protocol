# MEVrebels Backend Deployment Guide

**Production API**: https://api.mevrebels.rectorspace.com

This guide covers deploying MEVrebels backend services (API Server, Analytics, PostgreSQL, Redis) to a production VPS with Nginx reverse proxy and SSL.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [VPS Setup](#vps-setup)
3. [Deployment Workflow](#deployment-workflow)
4. [Nginx & SSL Configuration](#nginx--ssl-configuration)
5. [Integration Testing](#integration-testing)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **VPS**: 2GB RAM minimum, 20GB disk space
- **OS**: Ubuntu 22.04 LTS or later
- **Domain**: DNS A record pointing to VPS IP (e.g., api.mevrebels.rectorspace.com)

### Local Machine
- **Docker Compose V2**: For local testing
- **Node.js 20+**: For API Server development
- **Python 3.11+**: For Analytics Service development
- **SSH Access**: Configured SSH key for VPS

### Services
- **Helius RPC**: API key for Solana devnet/mainnet access
- **GitHub**: Optional (for version control)

## VPS Setup

### 1. Create Dedicated Deployment User

Follow the "1 project = 1 account" principle for security isolation:

```bash
# SSH into VPS as root or existing sudo user
ssh root@YOUR_VPS_IP

# Create mevrebels user
adduser mevrebels

# Add to docker group (for container management)
usermod -aG docker mevrebels

# Add to sudo group (for system operations)
usermod -aG sudo mevrebels

# Configure passwordless sudo for automation
echo 'mevrebels ALL=(ALL) NOPASSWD:ALL' | sudo tee /etc/sudoers.d/mevrebels

# Create deployment directory
mkdir -p /home/mevrebels/mevrebels-backend
chown -R mevrebels:mevrebels /home/mevrebels/mevrebels-backend
```

### 2. SSH Key Configuration

On your local machine, add SSH configuration:

**File**: `~/.ssh/config`

```
Host mevrebels
  HostName 176.222.53.185
  User mevrebels
  IdentityFile ~/.ssh/id_ed25519
```

Test SSH access:
```bash
ssh mevrebels
```

### 3. Install Docker (If Not Installed)

```bash
# SSH into VPS
ssh mevrebels

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose V2 (plugin)
sudo apt-get install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version  # Note: V2 uses space, not hyphen

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify user is in docker group
groups  # Should show "docker"
```

## Deployment Workflow

### Option 1: Automated Deployment (Recommended)

Use the deployment script from your local machine:

```bash
# From local machine, navigate to backend directory
cd /Users/rz/local-dev/mevrebels-protocol/backend

# Run deployment script
cd deployment
./deploy.sh

# This script:
# 1. Copies backend files to VPS via SCP
# 2. Generates package-lock.json for API Server
# 3. Copies environment variables
# 4. Builds Docker images on VPS
# 5. Starts services with docker-compose.simple.yml
# 6. Runs health checks
```

### Option 2: Manual Deployment

#### Step 1: Copy Files to VPS

```bash
# From local machine
cd /Users/rz/local-dev/mevrebels-protocol

# Copy backend directory (excluding node_modules, __pycache__)
rsync -avz --exclude 'node_modules' --exclude '__pycache__' \
  backend/ mevrebels:/home/mevrebels/mevrebels-backend/

# Copy environment variables
scp backend/.env mevrebels:/home/mevrebels/mevrebels-backend/.env
```

#### Step 2: Prepare API Server Dependencies

```bash
# Local machine - generate package-lock.json
cd backend/api-server
npm install  # Generates package-lock.json

# Copy to VPS
scp package-lock.json mevrebels:/home/mevrebels/mevrebels-backend/api-server/
```

#### Step 3: Build and Start Services

```bash
# SSH into VPS
ssh mevrebels
cd /home/mevrebels/mevrebels-backend

# Build Docker images
docker compose -f docker-compose.simple.yml build

# Start services
docker compose -f docker-compose.simple.yml up -d

# Check service status
docker compose -f docker-compose.simple.yml ps

# Expected output:
# NAME                    STATUS    PORTS
# mevrebels-postgres      healthy   0.0.0.0:5433->5432/tcp
# mevrebels-redis         healthy   0.0.0.0:6380->6379/tcp
# mevrebels-api-server    running   0.0.0.0:3011->3001/tcp, 0.0.0.0:3012->3002/tcp
# mevrebels-analytics     running   0.0.0.0:3014->3004/tcp
```

#### Step 4: Verify Services

```bash
# Test API Server health
curl http://localhost:3011/health
# Expected: {"status":"ok","uptime":...}

# Test Analytics health
curl http://localhost:3014/health
# Expected: {"status":"healthy","service":"analytics"}

# Check logs
docker compose -f docker-compose.simple.yml logs -f
```

## Nginx & SSL Configuration

### Automated Setup (Recommended)

```bash
# From local machine
cd /Users/rz/local-dev/mevrebels-protocol/backend/deployment
./deploy-nginx.sh

# This script:
# 1. Installs Nginx and Certbot
# 2. Deploys temporary HTTP config (for Let's Encrypt ACME challenge)
# 3. Obtains SSL certificate from Let's Encrypt
# 4. Deploys full HTTPS config with rate limiting
# 5. Sets up auto-renewal via systemd timer
# 6. Tests SSL configuration
```

### Manual Nginx Setup

#### Step 1: Install Nginx and Certbot

```bash
# SSH into VPS
ssh mevrebels

# Install packages
sudo apt-get update
sudo apt-get install nginx certbot python3-certbot-nginx -y

# Verify installation
nginx -v
certbot --version
```

#### Step 2: Deploy Temporary HTTP Config

Create `/tmp/mevrebels-api-nossl.conf`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.mevrebels.rectorspace.com;

    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Temporary proxy to API
    location / {
        proxy_pass http://localhost:3011;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Deploy config:

```bash
# Copy config
sudo cp /tmp/mevrebels-api-nossl.conf /etc/nginx/sites-available/mevrebels-api

# Enable site
sudo ln -sf /etc/nginx/sites-available/mevrebels-api /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 3: Obtain SSL Certificate

```bash
# Create certbot directory
sudo mkdir -p /var/www/certbot

# Run certbot (replace with your email and domain)
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d api.mevrebels.rectorspace.com \
  --email rheza10@gmail.com \
  --agree-tos \
  --non-interactive

# Verify certificate
sudo ls -la /etc/letsencrypt/live/api.mevrebels.rectorspace.com/
```

#### Step 4: Deploy Full HTTPS Config

Copy `backend/deployment/nginx.conf` to VPS:

```bash
# From local machine
scp backend/deployment/nginx.conf mevrebels:/tmp/mevrebels-api-ssl

# On VPS
ssh mevrebels
sudo mv /tmp/mevrebels-api-ssl /etc/nginx/sites-available/mevrebels-api

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 5: Set Up Auto-Renewal

```bash
# Enable certbot timer
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Check timer status
sudo systemctl status certbot.timer

# Test renewal (dry run)
sudo certbot renew --dry-run
```

## DNS Configuration

### A Record Setup

In your domain provider's DNS panel (e.g., Cloudflare, NameCheap):

1. **Add A Record**:
   - **Type**: A
   - **Name**: api.mevrebels or api.mevrebels.rectorspace.com
   - **Content**: 176.222.53.185 (your VPS IP)
   - **TTL**: Auto or 3600

2. **Verify DNS Propagation**:
```bash
# From local machine
dig api.mevrebels.rectorspace.com +short
# Should return: 176.222.53.185

# Or use
nslookup api.mevrebels.rectorspace.com
```

3. **Wait for Propagation**: Usually 1-5 minutes, can take up to 48 hours

## Integration Testing

### Run Full Test Suite

```bash
# From local machine
cd /Users/rz/local-dev/mevrebels-protocol/backend/tests
./integration-test.sh

# Test suite includes:
# - SSL certificate validity
# - HSTS security headers
# - Health endpoint checks (API, Analytics)
# - API endpoint responses (strategies, executions, proposals)
# - Analytics endpoints (stats, leaderboard)
# - CORS headers
# - OPTIONS preflight
# - Response time (<500ms target)
# - Docker service health
```

### Manual Health Checks

```bash
# API Server
curl https://api.mevrebels.rectorspace.com/health

# Analytics Service
curl https://api.mevrebels.rectorspace.com/analytics/health

# Strategies endpoint
curl https://api.mevrebels.rectorspace.com/api/strategies

# Executions endpoint
curl https://api.mevrebels.rectorspace.com/api/executions

# Proposals endpoint
curl https://api.mevrebels.rectorspace.com/api/proposals

# Leaderboard
curl https://api.mevrebels.rectorspace.com/analytics/leaderboard
```

### WebSocket Testing

```javascript
// From browser console or Node.js
const ws = new WebSocket('wss://api.mevrebels.rectorspace.com/ws');

ws.onopen = () => {
  console.log('WebSocket connected');
};

ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

## Monitoring & Maintenance

### Production Logs

```bash
# SSH into VPS
ssh mevrebels
cd /home/mevrebels/mevrebels-backend

# View all service logs (live)
docker compose -f docker-compose.simple.yml logs -f

# Specific service logs
docker compose logs -f api-server
docker compose logs -f analytics
docker compose logs -f postgres
docker compose logs -f redis

# View last 100 lines
docker compose logs --tail=100 api-server

# Nginx access logs
sudo tail -f /var/log/nginx/mevrebels-api-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/mevrebels-api-error.log
```

### Service Status

```bash
# Check all containers
docker compose -f docker-compose.simple.yml ps

# Check specific container
docker inspect mevrebels-api-server

# Resource usage
docker stats

# Disk usage
docker system df
```

### Database Maintenance

```bash
# Connect to PostgreSQL
docker exec -it mevrebels-postgres psql -U postgres -d mevrebels

# View tables
\dt

# View table schema
\d strategies
\d executions
\d proposals

# Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Optimize database
ANALYZE;
VACUUM;

# Exit
\q
```

### Redis Monitoring

```bash
# Connect to Redis (note custom port 6380)
docker exec -it mevrebels-redis redis-cli -p 6379 -a ***REMOVED***

# Check info
INFO

# Check keys
KEYS *

# Check memory usage
INFO memory

# Exit
exit
```

### Restart Services

```bash
# Restart all services
docker compose -f docker-compose.simple.yml restart

# Restart specific service
docker compose restart api-server

# Rebuild and restart (after code changes)
docker compose -f docker-compose.simple.yml build api-server
docker compose -f docker-compose.simple.yml up -d api-server
```

### SSL Certificate Renewal

```bash
# Check certificate expiry
openssl s_client -connect api.mevrebels.rectorspace.com:443 \
  -servername api.mevrebels.rectorspace.com < /dev/null 2>&1 | \
  grep -A 2 "Validity"

# Manual renewal (certbot auto-renews via systemd timer)
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run

# After renewal, reload Nginx
sudo systemctl reload nginx
```

## Troubleshooting

### 1. Docker Compose Command Not Found

**Error**: `bash: docker-compose: command not found`

**Cause**: VPS uses Docker Compose V2 (with space, not hyphen)

**Solution**:
```bash
# Use V2 syntax
docker compose up -d  # ✅ Correct
docker-compose up -d  # ❌ Wrong (V1 syntax)
```

### 2. Port Conflicts

**Error**: `failed to bind host port 0.0.0.0:6379: address already in use`

**Cause**: Standard ports already used by other services on VPS

**Solution**: Use custom ports in `docker-compose.simple.yml`:
```yaml
# PostgreSQL: 5432 → 5433
# Redis: 6379 → 6380
# API Server HTTP: 3001 → 3011
# API Server WebSocket: 3002 → 3012
# Analytics: 3004 → 3014
```

### 3. TypeScript Compilation Error

**Error**: `Type 'T' does not satisfy the constraint 'QueryResultRow'`

**Location**: `api-server/src/services/db.ts`

**Solution**: Add type constraint:
```typescript
import { QueryResultRow } from 'pg';

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  // ...
}
```

### 4. Python Dependency Conflicts

**Error**: `Cannot install solana==0.32.0 and httpx==0.25.2 (conflicting dependencies)`

**Solution**: Use compatible versions in `analytics/requirements.txt`:
```txt
solana==0.30.2      # Not 0.32.0
solders==0.18.1     # Not 0.20.0
httpx==0.23.3       # Not 0.25.2
anchorpy==0.18.0    # Requires solana<0.31.0
```

Rebuild analytics service:
```bash
docker compose -f docker-compose.simple.yml build analytics
docker compose -f docker-compose.simple.yml up -d analytics
```

### 5. Nginx Proxy Returns 404

**Error**: `GET /analytics/health HTTP/2 404`

**Cause**: Missing trailing slash in `proxy_pass` directive

**Solution**: Update nginx.conf:
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

Reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL Certificate Validation Failed

**Error**: `Verify return code: 19 (self-signed certificate in certificate chain)`

**Solutions**:

1. **Check DNS propagation**:
```bash
dig api.mevrebels.rectorspace.com +short
```

2. **Ensure certbot succeeded**:
```bash
sudo certbot certificates
```

3. **Check Nginx SSL config**:
```bash
sudo nginx -t
grep ssl_certificate /etc/nginx/sites-enabled/mevrebels-api
```

4. **Re-obtain certificate**:
```bash
sudo certbot delete --cert-name api.mevrebels.rectorspace.com
sudo certbot certonly --webroot -w /var/www/certbot \
  -d api.mevrebels.rectorspace.com \
  --email rheza10@gmail.com \
  --agree-tos
sudo systemctl reload nginx
```

### 7. Empty API Responses

**Symptom**: `GET /api/strategies` returns `[]`

**Cause**: Database is empty (no strategies created yet)

**Expected Behavior**: This is normal on fresh deployment

**Verification**:
```bash
# Connect to database
docker exec -it mevrebels-postgres psql -U postgres -d mevrebels

# Check table schema exists
\dt

# Check row count
SELECT COUNT(*) FROM strategies;
SELECT COUNT(*) FROM executions;
SELECT COUNT(*) FROM proposals;
```

### 8. High Latency / Slow Responses

**Diagnosis**:
```bash
# Check Docker resource usage
docker stats

# Check VPS resources
ssh mevrebels
htop  # or: top

# Check database performance
docker exec -it mevrebels-postgres psql -U postgres -d mevrebels -c "
  SELECT * FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"

# Optimize PostgreSQL
docker exec -it mevrebels-postgres psql -U postgres -d mevrebels -c "ANALYZE; VACUUM;"
```

**Solutions**:
- Upgrade VPS (more RAM/CPU)
- Add database indexes
- Implement caching (Redis)
- Enable PostgreSQL query caching

### 9. Container Won't Start

**Diagnosis**:
```bash
# Check container status
docker compose -f docker-compose.simple.yml ps

# View logs
docker compose logs api-server

# Check for port conflicts
sudo netstat -tulpn | grep 3011

# Check Docker daemon
sudo systemctl status docker
```

**Solutions**:
```bash
# Restart Docker daemon
sudo systemctl restart docker

# Remove and recreate containers
docker compose -f docker-compose.simple.yml down
docker compose -f docker-compose.simple.yml up -d

# Rebuild images
docker compose -f docker-compose.simple.yml build --no-cache
docker compose -f docker-compose.simple.yml up -d
```

### 10. Disk Space Full

**Diagnosis**:
```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df
```

**Solutions**:
```bash
# Clean up unused images
docker image prune -af

# Clean up stopped containers
docker container prune -f

# Clean up unused volumes
docker volume prune -f

# Clean up build cache
docker builder prune -af

# Full cleanup
docker system prune -af --volumes
```

## Environment Variables

### Production .env File

**File**: `backend/.env` (copy to VPS as `/home/mevrebels/mevrebels-backend/.env`)

```bash
# Node Environment
NODE_ENV=production

# Solana RPC
HELIUS_DEVNET_RPC=https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY
HELIUS_MAINNET_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY

# Database (internal Docker network)
DATABASE_URL=postgresql://postgres:***REMOVED***@postgres:5432/mevrebels

# Redis (internal Docker network)
REDIS_URL=redis://:***REMOVED***@redis:6379

# Program IDs (Devnet)
STRATEGY_REGISTRY_PROGRAM_ID=RECjnbr96LG2mDTXzhB5ZVY4JRfnSKmtx1pCgrGbMws
EXECUTION_ENGINE_PROGRAM_ID=REC2Aq9iAu4hu7efgJhtyFyWS1bSBDYgeoVXXQFtfpk
DAO_GOVERNANCE_PROGRAM_ID=RECwcpcHwBeDAV7tBvUuhJzsih16BaveZRC74kbBkSS
FLASH_LOAN_PROGRAM_ID=REChcXRRzBxhLvjs4v1HZ1Zx3R6hUnTEVjdKDwwbT9w

# API Server (internal container ports)
PORT=3001
WS_PORT=3002

# Analytics Service (internal container port)
ANALYTICS_PORT=3004
POLLING_INTERVAL_SECONDS=5

# Logging
LOG_LEVEL=INFO

# Cache
CACHE_TTL_SECONDS=300

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=https://mevrebels.rectorspace.com
```

**Security Note**: Never commit production `.env` to git. Use `.env.example` as template.

## Port Reference

### Docker Internal Ports (container)
- API Server HTTP: `3001`
- API Server WebSocket: `3002`
- Analytics: `3004`
- PostgreSQL: `5432`
- Redis: `6379`

### VPS Exposed Ports (host)
- API Server HTTP: `3011` → `3001`
- API Server WebSocket: `3012` → `3002`
- Analytics: `3014` → `3004`
- PostgreSQL: `5433` → `5432`
- Redis: `6380` → `6379`

### Nginx Reverse Proxy (public)
- HTTP: `80` → Redirects to HTTPS
- HTTPS: `443` → Routes to backend services

## Service Architecture

```
Public Internet
     ↓
[Nginx :443 HTTPS]
     ↓
┌─────────────────────────────────────────┐
│         Nginx Reverse Proxy             │
│  - Rate Limiting: 100 req/s             │
│  - SSL Termination                      │
│  - CORS Headers                         │
│  - Gzip Compression                     │
└─────────────────────────────────────────┘
     ↓
┌─────────────────┬───────────────────┬───────────────┐
│  API Server     │   Analytics       │   Webhook     │
│  :3011 (HTTP)   │   :3014           │   :3003       │
│  :3012 (WS)     │                   │               │
└─────────────────┴───────────────────┴───────────────┘
     ↓                    ↓                    ↓
┌─────────────────┬───────────────────────────────────┐
│  PostgreSQL     │        Redis                      │
│  :5433          │        :6380                      │
│  (TimescaleDB)  │        (Cache/PubSub)             │
└─────────────────┴───────────────────────────────────┘
```

## Production URLs

- **Base API**: https://api.mevrebels.rectorspace.com
- **WebSocket**: wss://api.mevrebels.rectorspace.com/ws
- **Health Check**: https://api.mevrebels.rectorspace.com/health
- **Strategies**: https://api.mevrebels.rectorspace.com/api/strategies
- **Executions**: https://api.mevrebels.rectorspace.com/api/executions
- **Proposals**: https://api.mevrebels.rectorspace.com/api/proposals
- **Analytics**: https://api.mevrebels.rectorspace.com/analytics/leaderboard

## Support

- **Backend README**: See [`backend/README.md`](../../backend/README.md)
- **Integration Tests**: See [`backend/tests/integration-test.sh`](../../backend/tests/integration-test.sh)
- **GitHub Issues**: https://github.com/RECTOR-LABS/mevrebels-protocol/issues
- **Documentation**: See project root `CLAUDE.md`
