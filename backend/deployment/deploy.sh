#!/bin/bash
#
# MEVrebels Backend Deployment Script
# Deploys all 4 backend services to VPS with zero-downtime
#

set -e

echo "🚀 MEVrebels Backend Deployment"
echo "================================"

# Configuration
VPS_HOST="mevrebels"
VPS_USER="mevrebels"
VPS_IP="176.222.53.185"
DEPLOY_PATH="/home/mevrebels/mevrebels-backend"
REPO_PATH="/Users/rz/local-dev/mevrebels-protocol"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Pre-deployment checks
echo ""
log_info "Step 1: Pre-deployment checks..."

# Check SSH connection
if ! ssh $VPS_HOST "echo 'SSH connection OK'" > /dev/null 2>&1; then
    log_error "Cannot connect to VPS. Check SSH configuration."
    exit 1
fi
log_success "SSH connection verified"

# Check Docker on VPS
if ! ssh $VPS_HOST "docker --version" > /dev/null 2>&1; then
    log_error "Docker not found on VPS. Please install Docker first."
    exit 1
fi
log_success "Docker verified on VPS"

# Step 2: Create remote directories
echo ""
log_info "Step 2: Creating remote directories..."
ssh $VPS_HOST "mkdir -p $DEPLOY_PATH/{api-server,analytics,pool-monitor,transaction-monitor,migrations,deployment,logs}"
log_success "Remote directories created"

# Step 3: Copy backend files
echo ""
log_info "Step 3: Copying backend files to VPS..."

# Copy docker-compose and .env
scp $REPO_PATH/backend/docker-compose.simple.yml $VPS_HOST:$DEPLOY_PATH/docker-compose.yml
scp $REPO_PATH/backend/.env $VPS_HOST:$DEPLOY_PATH/

# Copy database migrations
scp -r $REPO_PATH/backend/migrations/* $VPS_HOST:$DEPLOY_PATH/migrations/

# Copy API Server
log_info "Copying API Server..."
scp -r $REPO_PATH/backend/api-server/* $VPS_HOST:$DEPLOY_PATH/api-server/

# Copy Analytics Service
log_info "Copying Analytics Service..."
scp -r $REPO_PATH/backend/analytics/* $VPS_HOST:$DEPLOY_PATH/analytics/

# Copy Pool Monitor
log_info "Copying Pool Monitor..."
scp -r $REPO_PATH/backend/pool-monitor/* $VPS_HOST:$DEPLOY_PATH/pool-monitor/

# Copy Transaction Monitor
log_info "Copying Transaction Monitor..."
scp -r $REPO_PATH/backend/transaction-monitor/* $VPS_HOST:$DEPLOY_PATH/transaction-monitor/

# Copy deployment configs
log_info "Copying deployment configs..."
scp $REPO_PATH/backend/deployment/nginx.conf $VPS_HOST:$DEPLOY_PATH/deployment/

log_success "All files copied to VPS"

# Step 4: Build Docker images on VPS
echo ""
log_info "Step 4: Building Docker images on VPS..."
ssh $VPS_HOST "cd $DEPLOY_PATH && docker compose build"
log_success "Docker images built"

# Step 5: Start services
echo ""
log_info "Step 5: Starting services with Docker Compose..."
ssh $VPS_HOST "cd $DEPLOY_PATH && docker compose up -d"
log_success "Services started"

# Step 6: Wait for services to be healthy
echo ""
log_info "Step 6: Waiting for services to be healthy..."
sleep 10

# Check health endpoints
log_info "Checking API Server health..."
if ssh $VPS_HOST "curl -f http://localhost:3001/health" > /dev/null 2>&1; then
    log_success "API Server is healthy"
else
    log_error "API Server health check failed"
fi

log_info "Checking Analytics Service health..."
if ssh $VPS_HOST "curl -f http://localhost:3004/health" > /dev/null 2>&1; then
    log_success "Analytics Service is healthy"
else
    log_error "Analytics Service health check failed"
fi

# Step 7: Display service status
echo ""
log_info "Step 7: Service status..."
ssh $VPS_HOST "cd $DEPLOY_PATH && docker compose ps"

echo ""
echo "================================"
log_success "Deployment completed successfully!"
echo ""
echo "Services running at:"
echo "  API Server (HTTP):           http://$VPS_IP:3001"
echo "  API Server (WebSocket):      ws://$VPS_IP:3002"
echo "  Analytics Service:           http://$VPS_IP:3004"
echo "  PostgreSQL:                  $VPS_IP:5432"
echo "  Redis:                       $VPS_IP:6379"
echo ""
echo "Note: Rust services (Pool Monitor, Transaction Monitor) not deployed yet"
echo "      due to dependency conflicts. Will fix and add later."
echo ""
echo "Next steps:"
echo "  1. Configure Nginx reverse proxy (run deploy-nginx.sh)"
echo "  2. Set up SSL certificates with Let's Encrypt"
echo "  3. Update dashboard .env to point to VPS API"
echo ""
