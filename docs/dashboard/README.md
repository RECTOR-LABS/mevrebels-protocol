# MEVrebels Dashboard

**Democratizing MEV Through Decentralized Arbitrage**

A Next.js 14 dashboard for the MEVrebels Protocol - enabling community-driven MEV strategies with DAO governance on Solana.

---

## Features

### 🎯 Strategy Marketplace
- Browse community-created arbitrage strategies
- Advanced filtering (DEX, status, profit threshold)
- Real-time sorting (profit, executions, success rate)
- Search by strategy name or creator

### ⚡ Strategy Creation
- User-friendly form with validation
- Multi-DEX selection (Raydium, Orca, Meteora, Jupiter)
- Token pair configuration
- Profit threshold and slippage controls
- Preview before submission
- DAO approval workflow

### 🗳️ DAO Governance
- Vote on strategy approvals
- Vote on protocol upgrades
- Vote on treasury allocations
- Real-time vote distribution
- Quorum tracking
- Active/closed proposal tabs

### 📊 Analytics Dashboard
- Protocol-wide metrics (volume, strategies, executions)
- Top performing strategies leaderboard
- DEX distribution charts
- Token pair analytics
- User earnings breakdown (wallet-connected)

### 🎨 Design
- Cyberpunk/rebellious aesthetic
- MEVrebels brand colors (Rebellious Red, Trust Blue, Profit Green)
- Unique, non-generic UI components
- Animated hover effects and glows
- Fully responsive design
- Dark mode first

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom brand theme
- **Wallet**: Solana Wallet Adapter v2
- **Forms**: React Hook Form + Zod validation
- **Blockchain**: @solana/web3.js, @coral-xyz/anchor
- **Deployment**: Docker + GitHub Actions + GHCR

---

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Solana CLI (for local development)
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/RECTOR-LABS/mevrebels-protocol.git
cd mevrebels-protocol/dashboard

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Configure Solana RPC endpoint in .env.local
# NEXT_PUBLIC_CLUSTER=devnet
# NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com

# Run development server
npm run dev
```

Open http://localhost:3000 in your browser.

### Build for Production

```bash
# Build optimized production bundle
npm run build

# Start production server
npm start
```

---

## Environment Variables

Create `.env.local` for development:

```bash
# Solana Network (Helius Devnet RPC)
NEXT_PUBLIC_CLUSTER=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY

# Program IDs (deployed to devnet)
NEXT_PUBLIC_STRATEGY_REGISTRY_PROGRAM_ID=6JSrB5FXwC9WxPsY1s7w1wnK51TzjX4mwQ9PEiTUzxC1
NEXT_PUBLIC_EXECUTION_ENGINE_PROGRAM_ID=ExecRebe1sEngineMocKF1ash1oanArbitrageV1111
NEXT_PUBLIC_DAO_GOVERNANCE_PROGRAM_ID=CXkpLkkHiCTJ9ZcxRbc23cR7kQpKGeYxDy2z7xqWd1r8
NEXT_PUBLIC_FLASH_LOAN_PROGRAM_ID=F1agXX4p3jFV6ASqqv4ZfTNvW94WtJiinvhKH8NZ77VG
```

For production, use mainnet-beta and a premium RPC provider (Helius, QuickNode, Triton).

---

## Project Structure

```
dashboard/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── strategies/        # Strategy marketplace
│   │   ├── governance/        # DAO governance
│   │   └── analytics/         # Analytics dashboard
│   ├── components/
│   │   ├── layout/           # Header, Footer
│   │   ├── strategies/       # StrategyCard, etc.
│   │   ├── ui/               # Button, Toast, Spinner
│   │   └── wallet/           # Wallet integration
│   ├── data/                 # Mock data (strategies, proposals)
│   ├── types/                # TypeScript interfaces
│   ├── lib/                  # Utilities
│   └── stores/               # State management (future)
├── public/                   # Static assets
├── Dockerfile                # Docker build config
├── docker-compose.yml        # Blue-green deployment
├── .github/workflows/        # CI/CD automation
├── DEPLOYMENT.md             # Deployment guide
├── DNS-SETUP.md              # DNS configuration
└── README.md                 # This file
```

---

## Deployment

### Docker Deployment (VPS)

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete VPS deployment guide.

**Quick Start:**

```bash
# Build Docker image
docker build -t mevrebels-dashboard .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_CLUSTER=mainnet-beta \
  -e NEXT_PUBLIC_RPC_ENDPOINT=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY \
  mevrebels-dashboard
```

### Blue-Green Deployment

Automated via GitHub Actions on push to `main`:

1. Builds Docker image
2. Pushes to GHCR (ghcr.io/rector-labs/mevrebels-dashboard)
3. SSHs into VPS
4. Starts standby deployment (blue or green)
5. Health checks
6. Switches traffic to standby
7. Stops previous deployment

**Rollback:** Previous deployment remains available for instant rollback.

### DNS Setup

See **[DNS-SETUP.md](./DNS-SETUP.md)** for mevrebels.rectorspace.com configuration.

**TL;DR:**
1. Add A record: `mevrebels` → `YOUR_VPS_IP`
2. Wait for DNS propagation (5-60 min)
3. Install Certbot for SSL
4. Visit https://mevrebels.rectorspace.com

---

## Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)

# Build
npm run build        # Production build
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking (future)
```

### Connecting to Solana Programs

Update `.env.local` with deployed program IDs:

```bash
NEXT_PUBLIC_STRATEGY_REGISTRY_PROGRAM_ID=<PROGRAM_ID>
NEXT_PUBLIC_EXECUTION_ENGINE_PROGRAM_ID=<PROGRAM_ID>
NEXT_PUBLIC_DAO_GOVERNANCE_PROGRAM_ID=<PROGRAM_ID>
NEXT_PUBLIC_FLASH_LOAN_PROGRAM_ID=<PROGRAM_ID>
```

### Mock Data

Currently using mock data in `src/data/`:
- `mockStrategies.ts` - 8 example strategies
- `mockProposals.ts` - 5 example DAO proposals

Replace with real Anchor program calls when ready.

---

## Features Roadmap

### Current (v1.0 - Hackathon MVP)
- ✅ Strategy marketplace with filtering/sorting
- ✅ Strategy creation form with validation
- ✅ DAO governance voting UI
- ✅ Analytics dashboard
- ✅ Wallet integration
- ✅ Docker deployment
- ✅ Blue-green CI/CD

### Future (v2.0+)
- [ ] Real Anchor program integration
- [ ] WebSocket for live updates
- [ ] Strategy performance charts (TradingView)
- [ ] User profiles and reputation
- [ ] Strategy backtesting simulator
- [ ] Mobile app (React Native)
- [ ] Advanced analytics (APY, Sharpe ratio)
- [ ] Multi-language support

---

## Contributing

See main project [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## License

MIT License - see [LICENSE](../LICENSE)

---

## Support

- **GitHub Issues**: https://github.com/RECTOR-LABS/mevrebels-protocol/issues
- **Documentation**: See `/docs` in main repository
- **Deployment**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **DNS Setup**: See [DNS-SETUP.md](./DNS-SETUP.md)

---

## Acknowledgments

- **Solana Foundation**: For the robust blockchain infrastructure
- **Superteam Earn**: For hosting the Cypherpunk Hackathon
- **Staking Facilities**: For sponsoring the hackathon prize
- **MEVrebels Community**: For believing in democratized MEV

---

**Built with ❤️ by RECTOR and the MEVrebels community**

**Reclaim MEV. Power to the People.**
