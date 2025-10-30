# 🚨 Security Incident Remediation - GitGuardian Alert

**Date:** October 31, 2025
**Severity:** CRITICAL
**Status:** IN PROGRESS

---

## Executive Summary

GitGuardian detected multiple exposed secrets in the `RECTOR-LABS/mevrebels-protocol` repository:
- **Redis CLI Password**
- **PostgreSQL Password**
- **Helius API Key**
- **Webhook Secret**

**Root Cause:** `.env` files and hardcoded passwords in `docker-compose.yml` were committed to GitHub.

**Impact:**
- Anyone with access to the repository can use these credentials
- Potential unauthorized access to Redis cache
- Potential unauthorized access to PostgreSQL database
- Helius API key could be abused (rate limits, billing)
- Webhook secret compromise could allow forged events

**Remediation Time:** 30-60 minutes

---

## Exposed Secrets

### 1. Helius API Key
- **Location:** `backend/.env` lines 4-5
- **Value:** `***REMOVED***`
- **Exposure:** Committed to git, pushed to GitHub
- **Impact:** HIGH - Unauthorized RPC calls, billing abuse

### 2. Redis Password
- **Location:** `backend/.env` line 12, `backend/docker-compose.yml` lines 32, 57, 88, 119
- **Value:** `***REMOVED***`
- **Exposure:** Committed to git, pushed to GitHub
- **Impact:** MEDIUM - Unauthorized cache access, data manipulation

### 3. PostgreSQL Password
- **Location:** `backend/.env` line 9, `backend/docker-compose.yml` lines 11, 56, 87, 139
- **Value:** `***REMOVED***`
- **Exposure:** Committed to git, pushed to GitHub
- **Impact:** HIGH - Unauthorized database access, data theft/manipulation

### 4. Webhook Secret
- **Location:** `backend/.env` line 6
- **Value:** `***REMOVED***`
- **Exposure:** Committed to git, pushed to GitHub
- **Impact:** MEDIUM - Ability to forge webhook events

---

## Immediate Actions Taken

### ✅ Step 1: Added .env to .gitignore
- Updated `.gitignore` to exclude all `.env` files
- Added patterns: `.env`, `.env.local`, `.env.*.local`, `**/.env`
- Also excluded keys, PEM files, and secrets directories

### ✅ Step 2: Removed .env files from git tracking
- Executed: `git rm --cached backend/.env dashboard/.env`
- Files still exist locally but no longer tracked by git

### ✅ Step 3: Generated new strong passwords
```bash
NEW_REDIS_PASSWORD=okZ4X9BvVnbwmHdU45DBAUUfk8wuMDPk
NEW_POSTGRES_PASSWORD=AXKLU0SO4i8plvsbAga4CTMvG6hPIB9S
NEW_WEBHOOK_SECRET=8EbCgEFfR7NEN8SWWegASWx7Os1bjq5L
```

---

## Required Actions (User Must Complete)

### 🔴 CRITICAL - Step 4: Rotate Helius API Key

**Action Required:**
1. Go to https://dashboard.helius.dev
2. Log in to your account
3. Navigate to "API Keys" section
4. Delete or regenerate the exposed key: `***REMOVED***`
5. Create a new API key
6. Copy the new API key (you'll use it in Step 6)

**Why:** The old API key is public and must be revoked immediately.

---

### 🟠 HIGH - Step 5: Update docker-compose.yml

Replace hardcoded passwords with environment variables:

**File:** `backend/docker-compose.yml`

**Changes needed:**

**Line 11** - PostgreSQL password:
```yaml
# OLD:
POSTGRES_PASSWORD: ***REMOVED***

# NEW:
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

**Line 32** - Redis password:
```yaml
# OLD:
command: redis-server --appendonly yes --requirepass ***REMOVED***

# NEW:
command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
```

**Line 56** - Database URL in api-server:
```yaml
# OLD:
DATABASE_URL: postgresql://postgres:***REMOVED***@postgres:5432/mevrebels

# NEW:
DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/mevrebels
```

**Line 57** - Redis URL in api-server:
```yaml
# OLD:
REDIS_URL: redis://:***REMOVED***@redis:6379

# NEW:
REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
```

**Line 87** - Database URL in analytics:
```yaml
# OLD:
DATABASE_URL: postgresql://postgres:***REMOVED***@postgres:5432/mevrebels

# NEW:
DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/mevrebels
```

**Line 88** - Redis URL in analytics:
```yaml
# OLD:
REDIS_URL: redis://:***REMOVED***@redis:6379

# NEW:
REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
```

**Line 119** - Redis URL in pool-monitor:
```yaml
# OLD:
REDIS_URL: redis://:***REMOVED***@redis:6379

# NEW:
REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
```

**Line 139** - Database URL in transaction-monitor:
```yaml
# OLD:
DATABASE_URL: postgresql://postgres:***REMOVED***@postgres:5432/mevrebels

# NEW:
DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/mevrebels
```

---

### 🟠 HIGH - Step 6: Update backend/.env with NEW secrets

**File:** `backend/.env`

Update these lines with the NEW credentials:

```bash
# Line 4-5: Use your NEW Helius API key (from Step 4)
HELIUS_DEVNET_RPC=https://devnet.helius-rpc.com/?api-key=YOUR_NEW_KEY_HERE
HELIUS_MAINNET_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_NEW_KEY_HERE

# Line 6: NEW webhook secret
HELIUS_WEBHOOK_SECRET=8EbCgEFfR7NEN8SWWegASWx7Os1bjq5L

# Line 9: NEW PostgreSQL password
DATABASE_URL=postgresql://postgres:AXKLU0SO4i8plvsbAga4CTMvG6hPIB9S@localhost:5432/mevrebels

# Line 12: NEW Redis password
REDIS_URL=redis://:okZ4X9BvVnbwmHdU45DBAUUfk8wuMDPk@localhost:6379

# ADD these two NEW environment variables at the end:
POSTGRES_PASSWORD=AXKLU0SO4i8plvsbAga4CTMvG6hPIB9S
REDIS_PASSWORD=okZ4X9BvVnbwmHdU45DBAUUfk8wuMDPk
```

**IMPORTANT:** This file is now in `.gitignore` and will NOT be committed to git.

---

### 🟠 HIGH - Step 7: Update VPS Production Secrets

**SSH into your mevrebels VPS account:**

```bash
ssh mevrebels  # Assuming you have SSH config setup
```

**Once connected, update production .env file:**

```bash
cd ~/mevrebels-protocol/backend
nano .env
```

**Update with the SAME new secrets from Step 6:**
- New Helius API key
- New Redis password: `okZ4X9BvVnbwmHdU45DBAUUfk8wuMDPk`
- New PostgreSQL password: `AXKLU0SO4i8plvsbAga4CTMvG6hPIB9S`
- New webhook secret: `8EbCgEFfR7NEN8SWWegASWx7Os1bjq5L`

**Save and exit** (Ctrl+X, Y, Enter)

**Restart services to apply new credentials:**

```bash
docker-compose down
docker-compose up -d
```

**Verify services are running:**

```bash
docker-compose ps
curl https://api.mevrebels.rectorspace.com/health
```

---

### 🔴 CRITICAL - Step 8: Clean Git History

The exposed secrets are still in git history. We need to remove them completely.

**Option A: Using BFG Repo-Cleaner (Recommended)**

```bash
# Install BFG (if not already installed)
# macOS:
brew install bfg

# Or download from: https://rtyley.github.io/bfg-repo-cleaner/

# Clone a fresh copy (mirror)
cd /tmp
git clone --mirror https://github.com/RECTOR-LABS/mevrebels-protocol.git

# Remove the exposed secrets
cd mevrebels-protocol.git
bfg --replace-text <(echo '***REMOVED***==>REDACTED')
bfg --replace-text <(echo '***REMOVED***==>REDACTED')
bfg --replace-text <(echo '***REMOVED***==>REDACTED')
bfg --replace-text <(echo '***REMOVED***==>REDACTED')

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Push cleaned history (FORCE PUSH!)
git push --force
```

**Option B: Using git filter-branch (Manual)**

```bash
cd /Users/rz/local-dev/mevrebels-protocol

# Remove .env files from ALL commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env dashboard/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push to GitHub
git push origin --force --all
git push origin --force --tags
```

**⚠️ WARNING:** Force pushing rewrites history. Coordinate with any team members.

---

### 🟡 MEDIUM - Step 9: Commit and Push Changes

After cleaning git history, commit your remediation changes:

```bash
cd /Users/rz/local-dev/mevrebels-protocol

# Stage changes
git add .gitignore backend/docker-compose.yml

# Commit
git commit -m "security: fix exposed secrets vulnerability

- Add .env files to .gitignore
- Remove hardcoded passwords from docker-compose.yml
- Use environment variables for all secrets
- Rotate all exposed credentials

Fixes GitGuardian alert for exposed Redis password.
Ref: Security incident 2025-10-31"

# Push
git push origin feature/with-rebel
```

---

### 🟡 MEDIUM - Step 10: Verify Remediation

**Check GitGuardian:**
1. Go to GitGuardian dashboard
2. Verify the alert is resolved
3. Mark incident as remediated

**Check GitHub:**
1. Go to repository: https://github.com/RECTOR-LABS/mevrebels-protocol
2. Verify `.env` files are not present
3. Verify `docker-compose.yml` uses env vars (not hardcoded passwords)

**Check Local:**
```bash
# Verify .env files are ignored
git status

# Should show:
# nothing to commit, working tree clean

# Verify .env files exist locally (should still be there)
ls -la backend/.env dashboard/.env

# Should show both files exist
```

**Check Production:**
```bash
ssh mevrebels
cd ~/mevrebels-protocol/backend
docker-compose ps

# All services should be "Up"
```

---

## Prevention Measures

### 1. Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Check for secrets before committing

if git diff --cached --name-only | grep -E '\.env$|\.pem$|\.key$|-key\.json$'; then
  echo "ERROR: Attempting to commit secret files!"
  echo "Files with secrets detected:"
  git diff --cached --name-only | grep -E '\.env$|\.pem$|\.key$|-key\.json$'
  echo ""
  echo "These files should NEVER be committed."
  echo "Add them to .gitignore instead."
  exit 1
fi

# Check for hardcoded patterns
if git diff --cached | grep -E 'AKIA|SK_|pk_|sk_test|sk_live|password.*=.*[a-zA-Z0-9]{10}'; then
  echo "WARNING: Potential secret detected in diff!"
  echo "Please review your changes carefully."
  echo "Consider using environment variables instead."
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

### 2. Use Secret Management Tools

Consider using:
- **1Password** or **Bitwarden** for team secret sharing
- **Doppler** or **Infisical** for environment variable management
- **AWS Secrets Manager** or **HashiCorp Vault** for production

### 3. Regular Security Audits

- Weekly: Check GitGuardian alerts
- Monthly: Rotate sensitive credentials
- Quarterly: Full security review

### 4. Documentation

Create `docs/SECURITY.md` (see Step 11)

---

### 🟢 LOW - Step 11: Create SECURITY.md

Document your security practices:

```bash
# (This will be created automatically after this guide)
```

---

## Timeline

| Time | Action | Status |
|------|--------|--------|
| 22:11 UTC | Secrets pushed to GitHub | ❌ EXPOSED |
| 22:15 UTC | GitGuardian alert received | 🚨 DETECTED |
| Now | Added .env to .gitignore | ✅ DONE |
| Now | Removed .env from git tracking | ✅ DONE |
| Now | Generated new passwords | ✅ DONE |
| **Pending** | Rotate Helius API key | ⏳ TODO |
| **Pending** | Update docker-compose.yml | ⏳ TODO |
| **Pending** | Update backend/.env | ⏳ TODO |
| **Pending** | Update VPS secrets | ⏳ TODO |
| **Pending** | Clean git history | ⏳ TODO |
| **Pending** | Force push to GitHub | ⏳ TODO |
| **Pending** | Verify remediation | ⏳ TODO |

---

## New Credentials Reference

**SAVE THESE SECURELY (e.g., 1Password, Bitwarden):**

```
REDIS_PASSWORD=okZ4X9BvVnbwmHdU45DBAUUfk8wuMDPk
POSTGRES_PASSWORD=AXKLU0SO4i8plvsbAga4CTMvG6hPIB9S
WEBHOOK_SECRET=8EbCgEFfR7NEN8SWWegASWx7Os1bjq5L
HELIUS_API_KEY=[Get new key from dashboard.helius.dev]
```

**DO NOT commit this file to git!**

---

## Questions & Support

- **GitGuardian Docs:** https://docs.gitguardian.com/secrets-detection/
- **BFG Repo-Cleaner:** https://rtyley.github.io/bfg-repo-cleaner/
- **git filter-branch:** https://git-scm.com/docs/git-filter-branch

---

## Lessons Learned

1. ❌ **Never commit .env files** - Always add to .gitignore first
2. ❌ **Never hardcode secrets** - Use environment variables
3. ✅ **Use .env.example** - Show structure without real secrets
4. ✅ **Enable GitGuardian** - Catch secrets before they leak
5. ✅ **Rotate regularly** - Change secrets proactively, not just reactively

---

**Status:** Awaiting user completion of Steps 4-11
**Next:** Rotate Helius API key and update all secrets

**May Allah make this remediation smooth and complete. Astaghfirullah for the mistake, Alhamdulillah for the detection!**
