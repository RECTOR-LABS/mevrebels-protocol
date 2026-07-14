<!-- Satellite context file — extends the global hub (~/.claude/CLAUDE.md | ~/.pi/agent/AGENTS.md). Host-neutral; project-specific only. Do not duplicate hub standards here. -->

# MEVrebels Protocol

> Democratizing MEV through decentralized arbitrage. "Reclaim MEV. Power to the People." Dual-purpose: Superteam Earn Cypherpunk hackathon submission (Staking Facilities sponsor, $5K USDC pool) + investor-ready startup MVP.

**Deadline:** October 30, 2025 · **Status:** Day 23 — DEMO READY (backend live, dashboard complete with mock data, 100% demo-ready).
**Live:** https://mevrebels.rectorspace.com · **API:** https://api.mevrebels.rectorspace.com

## Tech Stack

### Solana Programs (on-chain)
- Anchor v0.30+, Rust. 4 programs: **Strategy Registry** (user-submitted strategies) ✅ · **Execution Engine** (atomic arbitrage w/ flashloans) ✅ · **DAO Governance** (voting, profit distribution) ✅ · **Flash Loan** (custom WSOL flash loans) ✅

### Backend (off-chain) ✅ production
- API Server: Node.js/TypeScript (REST + WebSocket) ✅ deployed
- Analytics: Python/FastAPI (performance tracking, metrics) ✅ deployed
- DB: PostgreSQL 15 + TimescaleDB ✅ · Cache: Redis 7 ✅
- Pool Monitor + Transaction Monitor (Rust) ⏳ NOT deployed (dependency conflicts)

### Frontend (dashboard) ✅ demo ready
- Next.js 14 (App Router) · Solana Wallet Adapter v2 (Phantom, Solflare, Coinbase) · custom components + Tailwind (MEVrebels brand) · React Hook Form + Zod
- Strategy Marketplace, Strategy Creation, DAO Governance, Analytics Dashboard (with mock data: 6 strategies, 4 proposals) · Docker + GitHub Actions blue-green CI/CD

### Infra ✅ production
- Production API + WebSocket live · Let's Encrypt SSL · Nginx rate limiting (100 req/s) · Helius Devnet RPC · VPS Docker (176.222.53.185) · GHCR (dashboard only) · custom WSOL flash loans on devnet

**Package manager:** npm (not Bun — Solana ecosystem compatibility: `@solana/web3.js` + `@coral-xyz/anchor` native crypto deps, Anchor TS client assumes Node.js).

## Common Commands

```bash
# Solana/Anchor
anchor build · anchor test · anchor deploy --provider.cluster devnet
solana-test-validator · solana logs

# Frontend (Next.js)
npm install · npm run dev · npm run build · npm start · npm run lint · npm run type-check

# Testing
anchor test · anchor test tests/strategy-registry.ts · npm test · npm run test:integration
k6 run tests/load-test.js · bash backend/tests/integration-test.sh
```

## Production API Endpoints (all working)

Base: `https://api.mevrebels.rectorspace.com`

- Health: `GET /health` · `GET /analytics/health`
- Strategies: `GET /api/strategies` (6 mock + real) · `GET /api/strategies/{id}` · `POST /api/strategies`
- Executions: `GET /api/executions` · `GET /api/executions/{id}` · `GET /api/executions?strategy_id={id}`
- Proposals: `GET /api/proposals` (4 mock) · `GET /api/proposals/{id}` · `POST /api/proposals`
- Analytics: `GET /api/analytics/strategies/stats` · `GET /api/analytics/executions/stats` · `GET /api/analytics/leaderboard`
- WebSocket: `wss://api.mevrebels.rectorspace.com/ws` (subscribe to `strategies` / `executions` channels)

## Architecture

**Multi-program:** Strategy Registry (PDA strategy accounts, validation/approval, creator attribution + profit share) · Execution Engine (atomic arbitrage, flashloans, multi-hop swap via Jupiter CPI, profit calc + distribution, slippage protection) · DAO Governance (voting, profit distribution to creators/executors/treasury, REBEL token, proposals).

**Backend pipeline:** Pool Monitor → Opportunity Detection → Strategy Matching → Execution Queue → WebSocket Broadcast → Dashboard + Bots.

**Frontend:** `dashboard/src/{app,components,hooks,lib,stores}/` — strategies marketplace, execute, governance, analytics.

## Flashloan Integration (custom WSOL)

Solend/marginfi block CPI calls (FlashBorrowCpi error) → custom WSOL flash loan program. SPL Token standard, 0.09% fee (9 bps), pool-based liquidity, reentrancy protection via `flash_loan_active` flag. Flow: init pool → deposit WSOL → borrow (SPL transfer) → execute arbitrage (Jupiter multi-hop) → repay WSOL + 0.09% → distribute profits (creator, executor, DAO treasury) → fail = tx reverts, no loss. `programs/flash-loan/`. **3/3 flash loan tests passing.**

## Test Results (45/54 total)

Flash Loan 3/3 (100%) · Strategy Registry 18/18 (100%) · Execution Engine 13/20 (65% — mock arbitrage limitations) · DAO Governance 7/13 (54%) · DAO Integration 4/6 (67%).

## Brand

Punky, rebellious, community-first, technically excellent. Revolutionary (red/black), trust (blue), modern typography. Read `docs/brand/BRAND.md` for all user-facing content.

## Key Docs

`docs/brand/BRAND.md` · `docs/planning/{MEVrebels-strategy,MEVrebels-PRD,MEVrebels-execution-plan}.md` · `README.md` · `docs/RESOURCES.md`.

## Strategy

**Hackathon:** top-3 ($1K-$2.5K). **Secondary:** strategic partnerships (Jupiter — integrate flashloan arb as feature; Staking Facilities — validator integration pilot) or seed funding ($100K-$250K); acqui-hire fallback (Jito/Helius, $50K-$150K).

## Security Priorities

CPI guards (prevent reentrancy) · validate all inputs · secure arithmetic (no overflow/underflow) · rate-limit API · never commit keys · audit flashloan repayment logic (critical path).