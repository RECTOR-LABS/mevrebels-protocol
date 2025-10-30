# DNS Setup Guide for mevrebels.rectorspace.com

## Overview

You'll create a subdomain `mevrebels.rectorspace.com` that points to your VPS IP address.

## Prerequisites

- Domain: rectorspace.com (already owned)
- VPS IP address (where MEVrebels will be deployed)
- Access to DNS management (Cloudflare, Namecheap, GoDaddy, etc.)

## Step-by-Step DNS Configuration

### Option 1: Cloudflare (Recommended)

**Why Cloudflare:**
- Free SSL/TLS encryption
- DDoS protection
- Global CDN for faster loading
- Easy DNS management

**Steps:**

1. **Login to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Select `rectorspace.com` domain

2. **Add A Record**
   - Click **DNS** tab
   - Click **Add record** button
   - Configure:
     - Type: `A`
     - Name: `mevrebels`
     - IPv4 address: `YOUR_VPS_IP` (e.g., 203.0.113.42)
     - Proxy status: `Proxied` (orange cloud) - **Recommended for SSL**
     - TTL: `Auto`
   - Click **Save**

3. **SSL/TLS Settings**
   - Go to **SSL/TLS** tab
   - Set encryption mode to: `Full (strict)` or `Flexible`
   - Enable **Always Use HTTPS**

4. **Verify DNS Propagation**
   ```bash
   # From terminal (wait 5-15 minutes after DNS change)
   dig mevrebels.rectorspace.com +short
   # Should return: YOUR_VPS_IP

   # Alternative
   nslookup mevrebels.rectorspace.com
   ```

### Option 2: Traditional DNS Provider (Namecheap, GoDaddy, etc.)

**Steps:**

1. **Login to DNS Provider**
   - Access your DNS management panel for rectorspace.com

2. **Add A Record**
   - Host/Name: `mevrebels`
   - Type: `A`
   - Value/Points to: `YOUR_VPS_IP`
   - TTL: `300` (5 minutes) or `Auto`

3. **Save Changes**

4. **Wait for DNS Propagation**
   - Can take 5 minutes to 48 hours (typically <1 hour)
   - Check status: https://www.whatsmydns.net/#A/mevrebels.rectorspace.com

### Option 3: Using `rectorspace.com` Nameservers

If you manage DNS directly on your VPS:

1. **Add Zone File Entry**

   Edit `/etc/bind/db.rectorspace.com` (or equivalent):

   ```bind
   mevrebels    IN    A    YOUR_VPS_IP
   ```

2. **Restart DNS Service**
   ```bash
   sudo systemctl restart bind9
   # or
   sudo systemctl restart named
   ```

## SSL Certificate Setup

### Let's Encrypt with Certbot (Free SSL)

After DNS is configured and propagating:

```bash
# SSH into VPS
ssh mevrebels-vps

# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx -y

# Obtain certificate (interactive)
sudo certbot --nginx -d mevrebels.rectorspace.com

# Follow prompts:
# - Enter email address
# - Agree to Terms of Service
# - Choose: Redirect HTTP to HTTPS (option 2)
```

**Auto-renewal:**
```bash
# Certbot auto-renews via systemd timer
sudo systemctl status certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

## DNS Records Summary

After setup, your DNS should look like:

| Type | Name       | Value          | Proxy | TTL  |
|------|------------|----------------|-------|------|
| A    | mevrebels  | YOUR_VPS_IP    | Yes*  | Auto |
| AAAA | mevrebels  | YOUR_VPS_IPv6  | Yes*  | Auto (if IPv6) |

*Only if using Cloudflare

## Verification Checklist

1. **DNS Resolution**
   ```bash
   # Should return VPS IP
   dig mevrebels.rectorspace.com +short
   ```

2. **HTTP Access**
   ```bash
   curl -I http://mevrebels.rectorspace.com
   # Should redirect to HTTPS or show Nginx/app response
   ```

3. **HTTPS Access**
   ```bash
   curl -I https://mevrebels.rectorspace.com
   # Should return 200 OK (after SSL setup)
   ```

4. **Browser Test**
   - Visit: https://mevrebels.rectorspace.com
   - Check: Green padlock (valid SSL)

## Common Issues

### DNS Not Resolving

**Problem:** `dig` returns no results

**Solutions:**
- Wait longer (DNS propagation can take time)
- Clear local DNS cache:
  ```bash
  # macOS
  sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

  # Linux
  sudo systemd-resolve --flush-caches

  # Windows
  ipconfig /flushdns
  ```
- Verify DNS record was saved in provider dashboard

### Certificate Errors

**Problem:** "Your connection is not private" in browser

**Solutions:**
- Ensure Nginx is running: `sudo systemctl status nginx`
- Check certificate: `sudo certbot certificates`
- Verify Nginx config: `sudo nginx -t`
- Renew certificate: `sudo certbot renew --force-renewal`

### Cloudflare SSL Loop

**Problem:** Too many redirects

**Solutions:**
- Set Cloudflare SSL mode to `Flexible` (if no certificate on VPS)
- Or set to `Full (strict)` (if Certbot installed on VPS)
- Clear browser cache and cookies

## Quick DNS Configuration (Copy-Paste)

```bash
# Get your VPS IP
curl -4 ifconfig.me

# Expected output: YOUR_VPS_IP (e.g., 203.0.113.42)
```

**Add this A record to DNS:**
- **Hostname:** mevrebels
- **Record Type:** A
- **Value:** [OUTPUT_FROM_ABOVE]
- **TTL:** Auto/300

## Testing Deployment

After DNS + SSL setup:

```bash
# On VPS
cd /home/mevrebels/dashboard
docker-compose up -d mevrebels-blue

# Wait 30 seconds for container to start
sleep 30

# Test from local machine
curl -I https://mevrebels.rectorspace.com
```

**Expected Output:**
```
HTTP/2 200
server: nginx
content-type: text/html
...
```

## Next Steps

1. ✅ Configure DNS (A record)
2. ✅ Wait for propagation (5-60 minutes)
3. ✅ SSH into VPS
4. ✅ Start Docker containers
5. ✅ Install Certbot & obtain SSL
6. ✅ Verify https://mevrebels.rectorspace.com

## Support

- DNS Issues: Check with your domain registrar support
- SSL Issues: Certbot docs: https://certbot.eff.org
- Cloudflare: https://dash.cloudflare.com
- MEVrebels: See DEPLOYMENT.md
