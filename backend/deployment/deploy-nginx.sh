#!/bin/bash
#
# Deploy Nginx reverse proxy and configure SSL
# Run this AFTER deploying backend services
#

set -e

echo "🔧 MEVrebels Nginx & SSL Configuration"
echo "======================================="

VPS_HOST="mevrebels"
DOMAIN="api.mevrebels.rectorspace.com"
EMAIL="rheza10@gmail.com"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Check if Nginx is installed
echo ""
log_info "Step 1: Checking Nginx installation..."
if ! ssh $VPS_HOST "command -v nginx" > /dev/null 2>&1; then
    log_info "Nginx not found. Installing..."
    ssh $VPS_HOST "sudo apt-get update && sudo apt-get install -y nginx"
    log_success "Nginx installed"
else
    log_success "Nginx already installed"
fi

# Step 2: Install Certbot if not present
echo ""
log_info "Step 2: Checking Certbot installation..."
if ! ssh $VPS_HOST "command -v certbot" > /dev/null 2>&1; then
    log_info "Certbot not found. Installing..."
    ssh $VPS_HOST "sudo apt-get install -y certbot python3-certbot-nginx"
    log_success "Certbot installed"
else
    log_success "Certbot already installed"
fi

# Step 3: Copy Nginx configuration
echo ""
log_info "Step 3: Deploying Nginx configuration..."

# Create temporary config without SSL (for initial setup)
cat > /tmp/mevrebels-api-nossl.conf <<'EOF'
# Temporary config without SSL (for Let's Encrypt)
server {
    listen 80;
    listen [::]:80;
    server_name api.mevrebels.rectorspace.com;

    # Let's Encrypt ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Temporary proxy to API (will be replaced with SSL config)
    location / {
        proxy_pass http://localhost:3011;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Copy temporary config
scp /tmp/mevrebels-api-nossl.conf $VPS_HOST:/tmp/mevrebels-api
ssh $VPS_HOST "sudo mv /tmp/mevrebels-api /etc/nginx/sites-available/mevrebels-api"
ssh $VPS_HOST "sudo ln -sf /etc/nginx/sites-available/mevrebels-api /etc/nginx/sites-enabled/"

# Test and reload
ssh $VPS_HOST "sudo nginx -t && sudo systemctl reload nginx"
log_success "Nginx configuration deployed"

# Step 4: Obtain SSL certificate
echo ""
log_info "Step 4: Obtaining SSL certificate from Let's Encrypt..."
log_info "Domain: $DOMAIN"
log_info "Email: $EMAIL"

# Create certbot directory
ssh $VPS_HOST "sudo mkdir -p /var/www/certbot"

# Run certbot
if ssh $VPS_HOST "sudo certbot certonly --webroot -w /var/www/certbot -d $DOMAIN --email $EMAIL --agree-tos --non-interactive" > /dev/null 2>&1; then
    log_success "SSL certificate obtained"
else
    log_error "Failed to obtain SSL certificate"
    log_info "Manual steps required:"
    log_info "1. Ensure DNS A record points to VPS IP: $DOMAIN -> VPS_IP"
    log_info "2. Run: ssh $VPS_HOST 'sudo certbot certonly --webroot -w /var/www/certbot -d $DOMAIN --email $EMAIL --agree-tos'"
    exit 1
fi

# Step 5: Deploy full Nginx config with SSL
echo ""
log_info "Step 5: Deploying full Nginx configuration with SSL..."
scp backend/deployment/nginx.conf $VPS_HOST:/tmp/mevrebels-api-ssl
ssh $VPS_HOST "sudo mv /tmp/mevrebels-api-ssl /etc/nginx/sites-available/mevrebels-api"

# Test and reload
ssh $VPS_HOST "sudo nginx -t && sudo systemctl reload nginx"
log_success "Nginx configuration with SSL deployed"

# Step 6: Set up auto-renewal
echo ""
log_info "Step 6: Setting up SSL auto-renewal..."
ssh $VPS_HOST "sudo systemctl enable certbot.timer && sudo systemctl start certbot.timer"
log_success "SSL auto-renewal configured"

# Step 7: Test SSL
echo ""
log_info "Step 7: Testing SSL configuration..."
if curl -f -s https://$DOMAIN/health > /dev/null 2>&1; then
    log_success "SSL is working correctly"
else
    log_error "SSL test failed"
    log_info "Check Nginx logs: ssh $VPS_HOST 'sudo tail -f /var/log/nginx/error.log'"
fi

echo ""
echo "======================================="
log_success "Nginx & SSL configuration completed!"
echo ""
echo "Your API is now accessible at:"
echo "  HTTPS: https://$DOMAIN"
echo "  WebSocket: wss://$DOMAIN/ws"
echo ""
echo "Test endpoints:"
echo "  Health: https://$DOMAIN/health"
echo "  API: https://$DOMAIN/api/strategies"
echo ""
echo "SSL certificate will auto-renew via systemd timer."
echo ""
