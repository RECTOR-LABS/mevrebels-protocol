# MEVrebels Dashboard Deployment Guide

## Prerequisites

- Docker and Docker Compose installed on VPS
- GitHub account with GHCR access
- VPS with at least 2GB RAM, 20GB disk
- Domain configured (e.g., mevrebels.rectorspace.com)

## VPS Setup

### 1. SSH Configuration

Add to `~/.ssh/config`:

```
Host mevrebels-vps
    HostName YOUR_VPS_IP
    User mevrebels
    Port 22
    IdentityFile ~/.ssh/id_rsa
```

### 2. Create Deployment User

```bash
# SSH into VPS as root
ssh root@YOUR_VPS_IP

# Create mevrebels user
adduser mevrebels
usermod -aG docker mevrebels
usermod -aG sudo mevrebels

# Create deployment directory
mkdir -p /home/mevrebels/dashboard
chown -R mevrebels:mevrebels /home/mevrebels/dashboard
```

### 3. Install Docker

```bash
# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt-get install docker-compose-plugin -y

# Start Docker service
systemctl start docker
systemctl enable docker
```

### 4. Copy Deployment Files

```bash
# From local machine
scp docker-compose.yml mevrebels-vps:/home/mevrebels/dashboard/
scp .env.production mevrebels-vps:/home/mevrebels/dashboard/.env
```

## GitHub Secrets Configuration

Add these secrets to your GitHub repository:

1. **VPS_HOST**: VPS IP address
2. **VPS_USERNAME**: `mevrebels`
3. **VPS_SSH_KEY**: Private SSH key for VPS access
4. **VPS_PORT**: SSH port (default: 22)
5. **GITHUB_TOKEN**: Automatically provided by GitHub Actions

## Blue-Green Deployment Workflow

### How It Works

1. **Build**: GitHub Actions builds Docker image on every push to `main`
2. **Push**: Image pushed to GHCR (ghcr.io/rector-labs/mevrebels-dashboard)
3. **Deploy**: SSH into VPS, determine active deployment (blue/green)
4. **Standby**: Start standby container with new image
5. **Health Check**: Verify standby is healthy
6. **Switch**: Route traffic to standby, stop active
7. **Rollback**: If health check fails, keep active deployment

### Manual Deployment

```bash
# SSH into VPS
ssh mevrebels-vps

# Navigate to deployment directory
cd /home/mevrebels/dashboard

# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Pull latest image
docker pull ghcr.io/rector-labs/mevrebels-dashboard:latest

# Start blue deployment (initial)
docker-compose up -d mevrebels-blue

# Check logs
docker logs -f mevrebels-blue

# Health check
curl http://localhost:3000
```

### Switch Between Blue and Green

```bash
# Current active: blue, switch to green
docker-compose up -d mevrebels-green
sleep 10  # Wait for green to start

# Health check green
curl http://localhost:3001

# If healthy, stop blue
docker stop mevrebels-blue
docker rm mevrebels-blue

# Update port mapping (or use reverse proxy)
```

## Reverse Proxy with Nginx

### Install Nginx

```bash
apt-get install nginx certbot python3-certbot-nginx -y
```

### Configure Nginx

Create `/etc/nginx/sites-available/mevrebels`:

```nginx
upstream mevrebels_backend {
    server localhost:3000;  # Blue deployment
}

server {
    listen 80;
    server_name mevrebels.rectorspace.com;

    location / {
        proxy_pass http://mevrebels_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
ln -s /etc/nginx/sites-available/mevrebels /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### SSL with Let's Encrypt

```bash
certbot --nginx -d mevrebels.rectorspace.com
```

## Monitoring

### View Logs

```bash
# Blue deployment
docker logs -f mevrebels-blue

# Green deployment
docker logs -f mevrebels-green
```

### Resource Usage

```bash
docker stats mevrebels-blue mevrebels-green
```

### Container Status

```bash
docker ps -a --filter "name=mevrebels"
```

## Rollback

```bash
# Stop current deployment
docker stop mevrebels-green

# Start previous deployment
docker-compose up -d mevrebels-blue

# Or use specific image tag
docker pull ghcr.io/rector-labs/mevrebels-dashboard:main-abc123
docker tag ghcr.io/rector-labs/mevrebels-dashboard:main-abc123 ghcr.io/rector-labs/mevrebels-dashboard:latest
docker-compose up -d mevrebels-blue
```

## Environment Variables

Production `.env`:

```bash
NODE_ENV=production
NEXT_PUBLIC_CLUSTER=mainnet-beta
NEXT_PUBLIC_RPC_ENDPOINT=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_STRATEGY_REGISTRY_PROGRAM_ID=...
NEXT_PUBLIC_EXECUTION_ENGINE_PROGRAM_ID=...
NEXT_PUBLIC_DAO_GOVERNANCE_PROGRAM_ID=...
NEXT_PUBLIC_FLASH_LOAN_PROGRAM_ID=...
```

## Troubleshooting

### Image Pull Fails

```bash
# Re-authenticate
docker logout ghcr.io
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### Container Won't Start

```bash
# Check logs
docker logs mevrebels-blue

# Check ports
netstat -tulpn | grep 3000

# Restart container
docker-compose restart mevrebels-blue
```

### Disk Space Issues

```bash
# Clean up old images
docker image prune -af

# Clean up volumes
docker volume prune -f
```

## Security Best Practices

1. **Never commit secrets** - Use `.env` files (gitignored)
2. **Use SSH keys** - Disable password authentication
3. **Firewall rules** - Only allow necessary ports (22, 80, 443)
4. **Regular updates** - Keep system and Docker updated
5. **Non-root user** - Run containers as non-root (already configured)

## Support

- GitHub Issues: https://github.com/RECTOR-LABS/mevrebels-protocol/issues
- Documentation: See project README.md
