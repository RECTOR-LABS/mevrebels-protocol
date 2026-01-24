# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MEVrebels: Democratizing MEV Through Decentralized Arbitrage**

**Project Identity:**
- **Name**: MEVrebels
- **Tagline**: "Reclaim MEV. Power to the People."
- **Vision**: Democratize MEV profits through decentralized arbitrage strategies with DAO governance

**Project Status:** Post-Hackathon → Production Development
- **Origin**: Built during Superteam Earn Cypherpunk Hackathon (Oct 2025)
- **Architecture**: ArbitrageDAO - self-contained, no validator dependency
- **Current Phase**: Production hardening, mainnet preparation
- **Infrastructure**: Backend live, dashboard deployed, programs tested (83% coverage)

## Strategic Approach

**Primary Focus: Production & Partnerships**
- **Strategic Partnerships** (highest priority):
  - Jupiter (integrate flashloan arb as feature)
  - Staking Facilities (validator integration pilot)
  - Jito Labs / Helius (MEV infrastructure alignment)
- **Seed Funding**: Solana Ventures, 6th Man, Multicoin ($100K-$250K target)
- **Investor-ready**: PRD, execution plan, brand guidelines complete

**Core Capabilities (Production-Ready):**
1. ✅ **DeFi Atomic Arbitrage** - Core protocol functionality
2. ✅ **AMMs** - Cross-DEX arbitrage (Raydium/Orca/Meteora)
3. ✅ **Transaction Simulation** - Strategy backtesting and validation
4. ✅ **Flash Loans** - Custom WSOL implementation (0.09% fee)
5. ⏳ **Multi-Token Flash Loans** - USDC, USDT, mSOL support (roadmap)
6. ⏳ **Priority Fee Management** - Optimal fee calculation
7. ⏳ **Mainnet Deployment** - Real liquidity, security audit

## Brand Guidelines

**Full brand guidelines available in:** [`BRAND.md`](docs/brand/BRAND.md)

**Quick Reference:**
- **Brand Personality**: Punky, rebellious, community-first, technically excellent
- **Visual Identity**: Revolutionary (red/black), trust (blue), modern typography
- **Narrative**: Fighting MEV oligopoly, empowering individual traders/developers
- **Investor Pitch**: Decentralized strategy marketplace disrupting centralized MEV bots

When creating any user-facing content, marketing materials, or documentation, refer to `docs/brand/BRAND.md` for comprehensive brand guidelines.

## Tech Stack

### Solana Programs (On-Chain)

- **Framework**: Anchor (v0.30+)
- **Language**: Rust (stable toolchain)
- **Testing**: Anchor testing framework with Solana Test Validator
- **Core Programs**:
  - Strategy Registry Program (user-submitted strategies) ✅ COMPLETE
  - Execution Engine Program (atomic arbitrage with flashloans) ✅ COMPLETE
  - DAO Governance Program (voting, profit distribution) ✅ COMPLETE
  - Flash Loan Program (custom WSOL flash loans) ✅ COMPLETE

### Backend Services (Off-Chain) ✅ PRODUCTION

- **API Server**: Node.js/TypeScript (REST API, WebSocket) ✅ DEPLOYED
- **Analytics Service**: Python/FastAPI (performance tracking, metrics) ✅ DEPLOYED
- **Database**: PostgreSQL 15 + TimescaleDB (time-series data) ✅ DEPLOYED
- **Cache**: Redis 7 (caching, pub/sub) ✅ DEPLOYED
- **Pool Monitor**: Rust (Raydium/Orca/Meteora integration) ⏳ NOT DEPLOYED (dependency conflicts)
- **Transaction Monitor**: Rust (Geyser webhooks, alerts) ⏳ NOT DEPLOYED (dependency conflicts)

### Frontend (Dashboard) ✅ DEPLOYED

- **Framework**: Next.js 14 (App Router) ✅
- **Wallet Integration**: Solana Wallet Adapter v2 (Phantom, Solflare, Coinbase) ✅
- **UI Library**: Custom components + Tailwind CSS (MEVrebels brand) ✅
- **Forms**: React Hook Form + Zod validation ✅
- **Features Deployed**:
  - Strategy Marketplace (filtering, sorting, search) ✅
  - Strategy Creation Form (validation, preview) ✅
  - DAO Governance (voting UI, proposals) ✅
  - Analytics Dashboard (metrics, leaderboard) ✅
  - Toast notifications & loading states ✅
- **Deployment**: Docker + GitHub Actions + Blue-Green CI/CD ✅
- **Production URL**: https://mevrebels.rectorspace.com ✅ LIVE
- **Documentation**: README, DEPLOYMENT.md, DNS-SETUP.md ✅

**Production TODO:**
- [ ] Replace mock data with real on-chain data
- [ ] Connect to mainnet programs
- [ ] Add real-time WebSocket updates from pool monitor

### Infrastructure ✅ PRODUCTION

- **Production API**: https://api.mevrebels.rectorspace.com ✅ LIVE
- **WebSocket**: wss://api.mevrebels.rectorspace.com/ws ✅ LIVE
- **SSL/TLS**: Let's Encrypt with auto-renewal ✅
- **Reverse Proxy**: Nginx with rate limiting (100 req/s) ✅
- **RPC Provider**: Helius Devnet RPC ✅
- **Hosting**: VPS with Docker (176.222.53.185) ✅
- **Container Registry**: GitHub Container Registry (GHCR) ✅ DASHBOARD ONLY
- **Flash Loans**: Custom WSOL implementation on devnet ✅
- **Deployment**: Docker Compose with health checks ✅

### Package Manager

- **Use npm** (not Bun) for this project
- **Reason**: Solana ecosystem compatibility
  - `@solana/web3.js` and `@coral-xyz/anchor` have native crypto dependencies
  - Anchor's TypeScript client generation assumes Node.js
  - Wallet adapters may have Bun compatibility issues
  - All Solana documentation uses npm
- **Trade-off**: Stability and compatibility > speed for Solana ecosystem

## Development Commands

### Solana/Anchor Development

```bash
# Initialize Anchor project
anchor init mevrebels

# Build programs
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Deploy to mainnet
anchor deploy --provider.cluster mainnet

# Start local validator
solana-test-validator

# Check program logs
solana logs
```

### Frontend Development (Next.js)

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Testing

```bash
# Run all Anchor tests
anchor test

# Run specific test file
anchor test tests/strategy-registry.ts

# Run frontend tests (if using Jest/Vitest)
npm test

# Run integration tests
npm run test:integration

# Performance testing
k6 run tests/load-test.js

# Backend integration tests
bash backend/tests/integration-test.sh
```

## Production API Endpoints ✅ ALL WORKING

**Base URL**: `https://api.mevrebels.rectorspace.com`

### Health Checks

```bash
# API Server health
curl https://api.mevrebels.rectorspace.com/health

# Analytics Service health (Python/FastAPI)
curl https://api.mevrebels.rectorspace.com/analytics/health
```

### Strategy Management (6 strategies with mock data)

```bash
# List all strategies (returns 6 mock + real strategies)
curl https://api.mevrebels.rectorspace.com/api/strategies

# Get specific strategy
curl https://api.mevrebels.rectorspace.com/api/strategies/{id}

# Create new strategy (POST)
curl -X POST https://api.mevrebels.rectorspace.com/api/strategies \
  -H "Content-Type: application/json" \
  -d '{"name":"My Strategy","description":"...","parameters":{...}}'
```

### Execution History

```bash
# List all executions
curl https://api.mevrebels.rectorspace.com/api/executions

# Get specific execution
curl https://api.mevrebels.rectorspace.com/api/executions/{id}

# List executions for a strategy
curl https://api.mevrebels.rectorspace.com/api/executions?strategy_id={id}
```

### DAO Governance (4 proposals with mock data)

```bash
# List all proposals (returns 4 mock proposals)
curl https://api.mevrebels.rectorspace.com/api/proposals

# Get specific proposal
curl https://api.mevrebels.rectorspace.com/api/proposals/{id}

# Create proposal (POST)
curl -X POST https://api.mevrebels.rectorspace.com/api/proposals \
  -H "Content-Type: application/json" \
  -d '{"title":"...","description":"...","type":"strategy_approval"}'
```

### Analytics ✅ NEW (Just Deployed)

```bash
# Strategy statistics (6 total, 5 active, 111.93 SOL profit)
curl https://api.mevrebels.rectorspace.com/api/analytics/strategies/stats

# Execution statistics (3 executions, 2 successful)
curl https://api.mevrebels.rectorspace.com/api/analytics/executions/stats

# Leaderboard (top 5 strategies by profit)
curl https://api.mevrebels.rectorspace.com/api/analytics/leaderboard
```

### WebSocket (Real-time Updates)

```javascript
const ws = new WebSocket('wss://api.mevrebels.rectorspace.com/ws');

ws.onopen = () => {
  // Subscribe to strategy updates
  ws.send(JSON.stringify({ type: 'subscribe', channel: 'strategies' }));

  // Subscribe to execution updates
  ws.send(JSON.stringify({ type: 'subscribe', channel: 'executions' }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

## Project Architecture - MEVrebels

### Multi-Program Structure

**Program 1: Strategy Registry** (`programs/strategy-registry/`)
- On-chain registry for user-submitted arbitrage strategies
- Strategy validation and approval mechanism
- Creator attribution and profit share tracking
- Uses PDA (Program Derived Addresses) for strategy accounts

**Program 2: Execution Engine** (`programs/execution-engine/`)
- Atomic arbitrage execution with flashloans
- Multi-hop swap routing via Jupiter CPI
- Profit calculation and distribution logic
- Slippage protection and failure handling

**Program 3: DAO Governance** (`programs/dao-governance/`)
- Voting mechanism for strategy approval
- Profit distribution to strategy creators, executors, DAO treasury
- Governance token (REBEL token) management
- Proposal creation and execution

**Key Design Patterns:**
- Use PDA for deterministic account addresses
- Implement CPI guards to prevent reentrancy attacks
- Use zero-copy deserialization for large accounts
- Emit events for off-chain indexing and analytics

### Backend Services Pipeline

```
Pool Monitor → Opportunity Detection → Strategy Matching → Execution Queue
                                                                  ↓
                                                          WebSocket Broadcast
                                                                  ↓
                                                          Dashboard + Bots
```

**Service Components:**

1. **Pool Monitor** (Rust): Real-time pool data from Raydium/Orca/Meteora
2. **Opportunity Detection** (Rust): Price discrepancy analysis, arbitrage identification
3. **Strategy Matcher** (Python): Match opportunities to registered strategies
4. **Execution Coordinator** (TypeScript): Queue management, priority fee optimization
5. **Analytics Service** (Python): Strategy performance, profit tracking, leaderboards

### Frontend Structure

```
dashboard/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── strategies/   # Strategy marketplace
│   │   ├── execute/      # Execution interface
│   │   ├── governance/   # DAO voting
│   │   └── analytics/    # Performance dashboard
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui components (brand-aligned)
│   │   ├── wallet/      # Wallet connection
│   │   └── charts/      # Strategy performance visualization
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and SDK integrations
│   └── stores/          # Zustand state stores
```

## Production Roadmap

### Phase 1: Production Hardening (Current)

**Infrastructure:**
- [ ] Fix Rust service dependency conflicts (pool-monitor, tx-monitor)
- [ ] Deploy all backend services to production
- [ ] Replace mock data with real on-chain data
- [ ] Connect dashboard to mainnet programs

**Testing:**
- [ ] Achieve 95%+ test coverage
- [ ] Fix remaining 9 failing tests (execution engine, DAO governance)
- [ ] Add integration tests for full arbitrage flow
- [ ] Load testing (1000+ concurrent executions)

### Phase 2: Multi-Token Support

**Flash Loan Expansion:**
- [ ] USDC flash loan pool
- [ ] USDT flash loan pool
- [ ] mSOL flash loan pool
- [ ] Configurable base token per strategy

**DEX Integration:**
- [ ] Full Jupiter CPI integration (production routes)
- [ ] Raydium CLMM support
- [ ] Orca Whirlpool integration
- [ ] Meteora DLMM support

### Phase 3: Security & Mainnet

**Security Audit:**
- [ ] Formal audit by reputable firm (OtterSec, Neodyme, etc.)
- [ ] Bug bounty program setup
- [ ] Reentrancy attack testing
- [ ] Economic attack simulations

**Mainnet Deployment:**
- [ ] Deploy programs to mainnet-beta
- [ ] Seed liquidity in flash loan pools
- [ ] Gradual rollout (whitelisted strategies first)
- [ ] Full public launch

### Phase 4: Governance & Token

**REBEL Token Launch:**
- [ ] Token mint and distribution
- [ ] Governance staking mechanism
- [ ] Profit distribution to token holders
- [ ] DEX liquidity pools (Raydium, Orca)

**DAO Operations:**
- [ ] Strategy approval voting live
- [ ] Treasury management proposals
- [ ] Protocol upgrade governance

## Production Success Criteria

### Technical Requirements

1. **Scalable Architecture**: Handle 1000+ strategies, 100+ concurrent executions
2. **Security**: Formal audit passed, no critical vulnerabilities
3. **Performance**: Strategy execution <5s, dashboard <3s load
4. **Reliability**: 99.9% uptime, graceful failure handling
5. **Testing**: 95%+ coverage on critical paths

### Business Requirements

1. **Product-Market Fit**: Real user demand, active strategy creators
2. **Clear Moat**: DAO governance, multi-token support, transparent profit sharing
3. **Growth Potential**: Path to $10M+ ARR via protocol fees
4. **Partnerships**: Integration with major Solana protocols (Jupiter, Jito)
5. **Documentation**: Investor-ready PRD, brand guidelines, API docs

### Current Test Status

- Flash Loan: 3/3 passing (100%)
- Strategy Registry: 18/18 passing (100%)
- Execution Engine: 13/20 passing (65%)
- DAO Governance: 7/13 passing (54%)
- DAO Integration: 4/6 passing (67%)
- **Overall**: 45/54 passing (83%)

**Target**: 95%+ before mainnet launch

## Important Files

- **`docs/brand/BRAND.md`**: Comprehensive brand guidelines for MEVrebels (read for all user-facing content)
- **`docs/planning/MEVrebels-strategy.md`**: Strategic analysis and technical approach (replaces bounty-analysis.md)
- **`docs/planning/MEVrebels-PRD.md`**: Product Requirements Document with Epic/Story/Task structure (investor-ready)
- **`docs/planning/MEVrebels-execution-plan.md`**: Progress tracking against PRD (daily updates)
- **`README.md`**: Project overview and quick start guide
- **`docs/RESOURCES.md`**: Curated links to Solana docs, Jupiter, flashloan protocols

## Key Technical Considerations

### Flashloan Integration

**✅ IMPLEMENTED**: Custom WSOL Flash Loan Program
- Built custom flash loan program using SPL Token standard
- WSOL (Wrapped SOL) token-based flash loans
- 0.09% fee (9 basis points)
- Pool-based liquidity model
- Reentrancy protection via `flash_loan_active` flag

**Why Custom Implementation:**
- Solend/marginfi block CPI calls for security (FlashBorrowCpi error)
- Custom program gives full control over fee structure and logic
- Uses SPL Token program for WSOL transfers (production-ready pattern)
- Deployed and tested: **3/3 flash loan tests passing (100%)**

**Implementation Approach:**
1. Initialize flash loan pool with WSOL token account
2. Deposit WSOL liquidity to pool
3. Borrow WSOL via SPL token transfer from pool to borrower
4. Execute arbitrage strategy (multi-hop swaps via Jupiter)
5. Repay WSOL + 0.09% fee via SPL token transfer
6. Distribute profits (strategy creator, executor, DAO treasury)
7. If unprofitable: transaction fails, no loss

**Program Location**: `programs/flash-loan/`
**Test Status**: 100% passing (45/54 total tests passing across all programs)

### Jupiter Integration (CPI)

**Critical Pattern**: Cross-Program Invocation to Jupiter aggregator
- Study Jupiter CPI examples thoroughly
- Handle route calculation off-chain (via API)
- Pass optimal route to on-chain program
- Execute swap via CPI (atomic with flashloan)

**Resources:**
- [Jupiter CPI Examples](https://github.com/jup-ag/jupiter-cpi-example)
- [Jupiter Docs](https://station.jup.ag/docs/apis/cpi)

### DAO Governance Token (REBEL)

**Token Distribution:**
- 40% Community (strategy creators, executors)
- 30% DAO Treasury (future development)
- 20% Early Contributors (team, advisors)
- 10% Liquidity Provision (DEX pools)

**Governance Rights:**
- Vote on strategy approval (quality control)
- Propose protocol upgrades
- Adjust profit distribution percentages
- Treasury management

### Security Priorities

- Implement proper CPI guards in Solana programs (prevent reentrancy)
- Validate all inputs (strategy parameters, swap amounts)
- Use secure arithmetic (no overflow/underflow)
- Rate limit API endpoints (prevent DoS)
- Never commit private keys or secrets
- Audit flashloan repayment logic (critical path)

### Performance Optimization

- Use zero-copy deserialization for large accounts
- Implement aggressive caching (Redis for hot opportunities)
- Optimize critical path (strategy execution flow)
- Profile early and often
- Target <5s for full arbitrage execution (flashloan → swap → repay)

## Risk Mitigation

### Technical Risks

1. **Jupiter CPI Complexity**: Study examples thoroughly, ask Discord for help
2. **Flashloan Integration Fails**: Have mock flashloan for demo (simulated borrowing)
3. **Profit Calculation Errors**: Extensive testing, conservative slippage bounds
4. **Performance Issues**: Profile continuously, optimize hot paths

### Development Risks

1. **Scope Creep**: Strict phase definitions, prioritize production-critical features
2. **Integration Delays**: Mock external dependencies, parallel development
3. **Dependency Conflicts**: Rust services have conflicting deps (known issue)

### Market Risks (Investor Path)

1. **No Product-Market Fit**: Pivot to hackathon-only focus, maximize prize
2. **Competition Emerges**: Differentiate through superior UX, DAO governance
3. **Regulatory Concerns**: Position as "tool for traders" not "investment product"

## Testing Strategy

### Unit Tests

- Solana program instructions (>90% coverage)
- Strategy validation logic
- Profit calculation accuracy
- Governance voting mechanisms

### Integration Tests

- End-to-end arbitrage flows (flashloan → swap → repay)
- Cross-program invocations (Jupiter CPI, flashloan CPI)
- DAO governance flows (propose → vote → execute)
- Use Solana test validator

### Performance Tests

- Load testing with k6 (1000+ concurrent strategy executions)
- Latency benchmarking (<5s target)
- Gas cost analysis (optimize compute units)

### Security Tests

- Fuzz testing program instructions
- Reentrancy attack simulations
- Arithmetic overflow/underflow tests
- Access control validation

## Deployment Strategy

1. **Devnet** (Current): All programs deployed, integration tests passing
2. **Testnet**: Beta testing with invited strategy creators
3. **Mainnet**: Post-audit deployment with gradual rollout
   - Phase 1: Whitelisted strategies only
   - Phase 2: Public strategy submission with DAO approval
   - Phase 3: Full permissionless operation

## Production Checklist

### Pre-Mainnet Requirements

**Technical:**
- [ ] All tests passing (95%+ coverage)
- [ ] Security audit completed
- [ ] Performance benchmarks met (<5s execution)
- [ ] No console errors, proper error handling
- [ ] Real data replacing all mock data

**Infrastructure:**
- [ ] All backend services deployed (including Rust monitors)
- [ ] Mainnet RPC provider configured
- [ ] Monitoring and alerting setup
- [ ] Backup and recovery procedures

**Documentation:**
- [ ] README with clear setup instructions
- [ ] Architecture diagrams (program interactions, data flow)
- [ ] Strategy creation guide
- [ ] API documentation
- [ ] Security model documentation

### Partnership Outreach

**Targets:**
- [ ] Jupiter (flashloan arb integration)
- [ ] Staking Facilities (validator integration)
- [ ] Jito Labs (MEV infrastructure)
- [ ] Helius (RPC and indexing)

**Materials:**
- [ ] Pitch deck (15-20 slides)
- [ ] Technical whitepaper
- [ ] Live demo environment
- [ ] Partnership proposal document

## Resources

### Critical Documentation

- [Solana Cookbook](https://solanacookbook.com/) - Practical guides
- [Anchor Book](https://book.anchor-lang.com/) - Program development
- [Jupiter CPI Examples](https://github.com/jup-ag/jupiter-cpi-example) - Integration patterns
- [Solend Flashloan Docs](https://docs.solend.fi/protocol/developers/flashloan) - Flashloan integration

### Community Support

- Solana Tech Discord: Technical help
- Anchor Discord: Program development questions
- Superteam Discord: Hackathon support
- Jupiter Discord: CPI integration help

### Example Projects

- [Jito MEV](https://jito-labs.gitbook.io/mev) - MEV infrastructure reference
- [Flashbots](https://docs.flashbots.net/) - Ethereum MEV (parallel concepts)
- [Jupiter Limit Order](https://github.com/jup-ag/limit-order-sdk) - On-chain execution patterns

## Notes for Claude Code

**Core Principles:**
- Production-first mindset - no shortcuts, no "demo quality" compromises
- "Punky/edgy" attitude matters - MEVrebels fights MEV oligopoly
- Working code beats vaporware - ship functional, tested features
- Read `docs/brand/BRAND.md` for all user-facing content (maintain brand consistency)
- Refer to `docs/planning/MEVrebels-PRD.md` for Epic/Story/Task structure

**Decision Framework:**
- If uncertain about feature priority: Check Production Roadmap phases above
- If uncertain about branding: Read docs/brand/BRAND.md
- If uncertain about technical approach: Read docs/planning/MEVrebels-strategy.md

**Success Criteria:**
1. **Technical**: 95%+ test coverage, security audit passed, <5s execution
2. **Partnerships**: Strategic partnership (Jupiter/Staking Facilities) or seed funding ($100K-$250K)
3. **Community**: Active strategy creators, real TVL in flash loan pools
4. **Revenue**: Protocol fees generating sustainable income

**Hackathon Origin (Oct 2025):**
- Built during Superteam Earn Cypherpunk Hackathon
- Achieved 83% test coverage, full stack deployed
- Proof of concept validated, now scaling to production

InshaAllah, MEVrebels will democratize MEV for the people! 🚀
