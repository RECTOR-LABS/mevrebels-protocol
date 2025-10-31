'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, type: "spring" as const, stiffness: 100 }
  }
};

// Scroll animation wrapper component
function ScrollAnimateSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeInUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated grid with stagger effect
function AnimatedGrid({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      className="grid md:grid-cols-3 gap-8 mb-12"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={staggerContainer}
      transition={{ delay }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div variants={fadeInUp} key={index}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Animated 2-column grid - centered when only 2 items
function AnimatedGrid2Col({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  // Check number of children to determine if centering is needed
  const childCount = React.Children.count(children);
  const gridClass = childCount === 2
    ? "grid md:grid-cols-2 gap-8 mb-12 max-w-5xl mx-auto"
    : "grid md:grid-cols-2 gap-8 mb-12";

  return (
    <motion.div
      ref={ref}
      className={gridClass}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={staggerContainer}
      transition={{ delay }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div variants={fadeInUp} key={index}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default function PitchDeckPage() {
  const [scrollY, setScrollY] = useState(0);
  const { scrollYProgress } = useScroll();

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden border-b border-border">
        {/* Animated Background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-rebellious/20 via-midnight-black to-trust-blue/20"
          style={{ y: backgroundY, opacity }}
        />
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.1) 0%, transparent 50%)',
            y: backgroundY,
          }}
        />

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Logo / Brand */}
            <motion.div
              className="mb-8 inline-block"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="text-6xl font-black text-rebellious mb-2"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
              >
                MEVREBELS
              </motion.div>
              <motion.div
                className="text-xl text-neutral-gray font-mono uppercase tracking-wider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Reclaim MEV. Power to the People.
              </motion.div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Democratizing MEV on{' '}
              <motion.span
                className="text-profit-green"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                Solana
              </motion.span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-neutral-gray mb-12 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              The first decentralized arbitrage protocol that lets anyone create, share, and profit from MEV strategies—without running a validator.
            </motion.p>

            {/* Key Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    delayChildren: 0.6,
                    staggerChildren: 0.1
                  }
                }
              }}
            >
              <motion.div variants={fadeInUp}>
                <StatCard value="$2.8B" label="Annual MEV on Solana" icon="💰" />
              </motion.div>
              <motion.div variants={fadeInUp}>
                <StatCard value="4" label="Programs Deployed" icon="⚡" />
              </motion.div>
              <motion.div variants={fadeInUp}>
                <StatCard value="100%" label="Decentralized" icon="🔓" />
              </motion.div>
              <motion.div variants={fadeInUp}>
                <StatCard value="0.3%" label="Protocol Fee" icon="📊" />
              </motion.div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/strategies"
                  className="px-8 py-4 bg-rebellious text-white font-bold text-lg rounded-lg hover:bg-rebellious/90 transition-all cursor-pointer inline-block"
                >
                  EXPLORE STRATEGIES
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/api-docs"
                  className="px-8 py-4 border-2 border-trust-blue text-trust-blue font-bold text-lg rounded-lg hover:bg-trust-blue hover:text-white transition-all cursor-pointer inline-block"
                >
                  VIEW API DOCS
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <div className="text-neutral-gray text-sm mb-2">SCROLL TO LEARN MORE</div>
          <div className="w-6 h-10 border-2 border-neutral-gray rounded-full mx-auto flex items-start justify-center p-2">
            <motion.div
              className="w-1 h-3 bg-neutral-gray rounded-full"
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </div>
        </motion.div>
      </section>

      {/* Problem Section */}
      <section className="py-20 border-b border-border bg-gradient-to-b from-midnight-black to-midnight-black/50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <ScrollAnimateSection>
              <SectionHeader
                label="THE PROBLEM"
                title="MEV is Controlled by the Few"
                subtitle="Billions in profits are extracted by validators and sophisticated bots, leaving retail traders with the scraps."
              />
            </ScrollAnimateSection>

            <AnimatedGrid delay={0.2}>
              <ProblemCard
                icon="🏦"
                title="Centralized Extraction"
                description="Top 10 validators capture 60%+ of MEV profits through privileged transaction ordering."
              />
              <ProblemCard
                icon="🔒"
                title="High Barriers to Entry"
                description="Running validators requires $100K+ capital, technical expertise, and infrastructure."
              />
              <ProblemCard
                icon="😔"
                title="Retail Gets Rekt"
                description="Individual traders face frontrunning, sandwiching, and toxic MEV with no recourse."
              />
            </AnimatedGrid>

            {/* Market Opportunity */}
            <ScrollAnimateSection>
              <motion.div
                className="relative bg-gradient-to-br from-rebellious/20 via-midnight-black to-rebellious/10 border-2 border-rebellious/50 rounded-2xl p-8 overflow-hidden shadow-2xl"
                whileHover={{ scale: 1.01, borderColor: '#ef4444' }}
                transition={{ duration: 0.3 }}
              >
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ef444410_1px,transparent_1px),linear-gradient(to_bottom,#ef444410_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-30" />

                {/* Content */}
                <div className="relative z-10">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-rebellious/20 border border-rebellious/50 rounded-full mb-4">
                      <span className="text-3xl">📈</span>
                      <span className="text-xl font-black text-white uppercase tracking-wider">Market Opportunity</span>
                    </div>
                    <p className="text-neutral-gray max-w-2xl mx-auto">
                      Massive untapped value in Solana's DeFi ecosystem waiting to be democratized
                    </p>
                  </div>

                  <motion.div
                    className="grid md:grid-cols-3 gap-6"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                  >
                    <motion.div
                      variants={scaleIn}
                      className="group relative bg-midnight-black/50 backdrop-blur-sm border border-border hover:border-rebellious rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-rebellious/20"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-rebellious/10 rounded-full blur-3xl group-hover:bg-rebellious/20 transition-all" />
                      <div className="relative">
                        <div className="text-5xl font-black font-mono bg-gradient-to-r from-rebellious to-rebellious-red bg-clip-text text-transparent mb-3">
                          $2.8B
                        </div>
                        <div className="text-xs uppercase tracking-wider text-neutral-gray font-semibold mb-1">
                          Annual MEV on Solana
                        </div>
                        <div className="text-xs text-rebellious/70">(2024 Data)</div>
                      </div>
                    </motion.div>

                    <motion.div
                      variants={scaleIn}
                      className="group relative bg-midnight-black/50 backdrop-blur-sm border border-border hover:border-trust-blue rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-trust-blue/20"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-trust-blue/10 rounded-full blur-3xl group-hover:bg-trust-blue/20 transition-all" />
                      <div className="relative">
                        <div className="text-5xl font-black font-mono bg-gradient-to-r from-trust-blue to-trust-blue/70 bg-clip-text text-transparent mb-3">
                          10M+
                        </div>
                        <div className="text-xs uppercase tracking-wider text-neutral-gray font-semibold mb-1">
                          Active Solana Wallets
                        </div>
                        <div className="text-xs text-trust-blue/70">Potential Users</div>
                      </div>
                    </motion.div>

                    <motion.div
                      variants={scaleIn}
                      className="group relative bg-midnight-black/50 backdrop-blur-sm border border-border hover:border-profit-green rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-profit-green/20"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-profit-green/10 rounded-full blur-3xl group-hover:bg-profit-green/20 transition-all" />
                      <div className="relative">
                        <div className="text-5xl font-black font-mono bg-gradient-to-r from-profit-green to-profit-green/70 bg-clip-text text-transparent mb-3">
                          $140B
                        </div>
                        <div className="text-xs uppercase tracking-wider text-neutral-gray font-semibold mb-1">
                          Total DEX Volume
                        </div>
                        <div className="text-xs text-profit-green/70">Annual Trading</div>
                      </div>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Bottom Gradient Line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rebellious to-transparent" />
              </motion.div>
            </ScrollAnimateSection>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <ScrollAnimateSection>
              <SectionHeader
                label="THE SOLUTION"
                title="Democratize MEV Through Decentralized Arbitrage"
                subtitle="MEVrebels empowers anyone to create, execute, and profit from arbitrage strategies on Solana."
              />
            </ScrollAnimateSection>

            <AnimatedGrid delay={0.2}>
              <SolutionCard
                icon="⚡"
                title="Strategy Marketplace"
                description="Browse and execute community-created arbitrage strategies. Creators earn royalties on every execution."
                features={[
                  'Multi-DEX arbitrage (Raydium, Orca, Meteora)',
                  'Atomic execution with flash loans',
                  'Real-time profit calculations',
                  'Gas-optimized transactions',
                ]}
              />
              <SolutionCard
                icon="🗳️"
                title="DAO Governance"
                description="Community-driven governance with $REBEL token. Vote on strategy approvals, protocol upgrades, and treasury allocation."
                features={[
                  'On-chain voting with proposal system',
                  'Strategy quality control via DAO',
                  'Transparent profit distribution',
                  'Treasury-funded development',
                ]}
              />
              <SolutionCard
                icon="💎"
                title="Flash Loan Arbitrage"
                description="Execute strategies with zero capital using our custom WSOL flash loan protocol. Capital-free arbitrage for everyone."
                features={[
                  '0.09% flash loan fee (9 basis points)',
                  'Custom WSOL implementation',
                  'Atomic execution guarantees',
                  'Pool-based liquidity model',
                ]}
              />
            </AnimatedGrid>

            {/* How It Works */}
            <div className="bg-gradient-to-br from-trust-blue/10 to-midnight-black border border-trust-blue rounded-lg p-8">
              <h3 className="text-2xl font-bold text-white mb-8 text-center">
                How It Works
              </h3>
              <div className="grid md:grid-cols-4 gap-6">
                <WorkflowStep
                  number="1"
                  title="Create Strategy"
                  description="Define arbitrage routes, DEXs, and profit thresholds using our SDK."
                />
                <WorkflowStep
                  number="2"
                  title="DAO Approval"
                  description="Community votes to approve quality strategies and filter out spam."
                />
                <WorkflowStep
                  number="3"
                  title="Execute Trades"
                  description="Anyone can execute approved strategies. Flash loans enable capital-free arbitrage."
                />
                <WorkflowStep
                  number="4"
                  title="Share Profits"
                  description="Profits split between executor (60%), creator (30%), DAO treasury (10%)."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Traction Section */}
      <section className="py-20 border-b border-border bg-gradient-to-b from-midnight-black/50 to-midnight-black">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <ScrollAnimateSection>
              <SectionHeader
                label="TRACTION"
                title="Built for Production"
                subtitle="23 days from idea to full-stack protocol with real backend infrastructure."
              />
            </ScrollAnimateSection>

            {/* Key Achievements */}
            <AnimatedGrid2Col delay={0.2}>
              <AchievementCard
                icon="✅"
                title="4 Programs Deployed to Devnet"
                items={[
                  'Strategy Registry (RECjnbr...)',
                  'Execution Engine (REC2Aq9...)',
                  'DAO Governance (RECwcpc...)',
                  'Flash Loan Protocol (REChcXR...)',
                ]}
                highlight="All with REC vanity addresses"
              />
              <AchievementCard
                icon="🚀"
                title="Production Backend Live"
                items={[
                  'RESTful API + WebSocket server',
                  'PostgreSQL + Redis infrastructure',
                  'Pool monitoring (Raydium/Orca/Meteora)',
                  'Analytics service with metrics',
                ]}
                highlight="api.mevrebels.rectorspace.com"
              />
              <AchievementCard
                icon="🎨"
                title="Full-Stack Dashboard"
                items={[
                  'Strategy marketplace with filtering',
                  'Real-time execution monitoring',
                  'DAO governance voting interface',
                  'Analytics & leaderboards',
                ]}
                highlight="Next.js + TypeScript + Tailwind"
              />
              <AchievementCard
                icon="📚"
                title="Comprehensive Documentation"
                items={[
                  'Complete API documentation',
                  'Strategy creation guides',
                  'Deployment instructions',
                  'Architecture diagrams',
                ]}
                highlight="Developer-ready"
              />
            </AnimatedGrid2Col>

            {/* Technical Highlights */}
            <div className="bg-midnight-black border border-border rounded-lg p-8">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                Technical Excellence
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <TechHighlight
                  metric="83%"
                  label="Test Coverage"
                  detail="45/54 tests passing"
                />
                <TechHighlight
                  metric="<5s"
                  label="Execution Latency"
                  detail="Flash loan → swap → repay"
                />
                <TechHighlight
                  metric="0.09%"
                  label="Flash Loan Fee"
                  detail="Custom WSOL implementation"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="py-20 border-b border-border bg-gradient-to-b from-midnight-black to-midnight-black/50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <ScrollAnimateSection>
              <SectionHeader
                label="DEMO"
                title="See MEVrebels in Action"
                subtitle="Watch our full-stack protocol in action: from strategy creation to execution to profit distribution."
              />
            </ScrollAnimateSection>

            <ScrollAnimateSection>
              <VideoPlayer videoUrl="https://www.youtube.com/embed/YOUR_VIDEO_ID" />
            </ScrollAnimateSection>

            {/* Video Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.3
                  }
                }
              }}
            >
              <motion.div
                className="text-center"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <div className="text-3xl font-black font-mono text-rebellious mb-2">4:32</div>
                <div className="text-sm text-neutral-gray">Demo Duration</div>
              </motion.div>
              <motion.div
                className="text-center"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <div className="text-3xl font-black font-mono text-trust-blue mb-2">7</div>
                <div className="text-sm text-neutral-gray">Key Features Shown</div>
              </motion.div>
              <motion.div
                className="text-center"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <div className="text-3xl font-black font-mono text-profit-green mb-2">100%</div>
                <div className="text-sm text-neutral-gray">Working Features</div>
              </motion.div>
              <motion.div
                className="text-center"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
              >
                <div className="text-3xl font-black font-mono text-warning-orange mb-2">Live</div>
                <div className="text-sm text-neutral-gray">Production API</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <SectionHeader
              label="TECHNOLOGY"
              title="Production-Grade Architecture"
              subtitle="Built with modern stack for scalability, security, and performance."
            />

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <TechStackCard
                category="On-Chain"
                icon="⛓️"
                technologies={[
                  'Anchor Framework (Rust)',
                  'Solana Programs (v1.18)',
                  'SPL Token integration',
                  'Jupiter CPI for swaps',
                ]}
              />
              <TechStackCard
                category="Backend"
                icon="⚙️"
                technologies={[
                  'Node.js/TypeScript API',
                  'Python Analytics',
                  'PostgreSQL + Redis',
                  'Helius RPC integration',
                ]}
              />
              <TechStackCard
                category="Frontend"
                icon="🎨"
                technologies={[
                  'Next.js 14 (App Router)',
                  'Solana Wallet Adapter',
                  'Tailwind CSS',
                  'Real-time WebSockets',
                ]}
              />
            </div>

            {/* Architecture Diagram Placeholder */}
            <div className="bg-gradient-to-br from-midnight-black to-midnight-black/50 border-2 border-border rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🏗️</div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Scalable Microservices Architecture
              </h3>
              <p className="text-neutral-gray mb-6">
                4 Solana programs + 3 backend services + Next.js dashboard
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {[
                  'Pool Monitor',
                  'Analytics Engine',
                  'API Server',
                  'WebSocket Server',
                  'Strategy Registry',
                  'Execution Engine',
                  'DAO Governance',
                  'Flash Loan Protocol',
                ].map((service) => (
                  <span
                    key={service}
                    className="px-4 py-2 bg-trust-blue/20 border border-trust-blue/50 rounded-lg text-trust-blue font-mono text-sm"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 border-b border-border bg-gradient-to-b from-midnight-black to-rebellious/5">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <SectionHeader
              label="VISION"
              title="The Future of MEV on Solana"
              subtitle="From hackathon MVP to the default MEV infrastructure for the entire ecosystem."
            />

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <RoadmapCard
                phase="Phase 1: Launch"
                timeline="Q1 2026"
                items={[
                  'Mainnet deployment with audited programs',
                  '50+ curated arbitrage strategies',
                  '$1M+ TVL in flash loan pools',
                  '1,000+ active strategy executors',
                ]}
              />
              <RoadmapCard
                phase="Phase 2: Scale"
                timeline="Q2 2026"
                items={[
                  'ML-powered strategy optimization',
                  'Cross-chain arbitrage (Solana ↔ EVM)',
                  'Validator MEV integration (Jito/Staking Facilities)',
                  '$10M+ monthly volume',
                ]}
              />
              <RoadmapCard
                phase="Phase 3: Expand"
                timeline="Q3-Q4 2026"
                items={[
                  'MEV-as-a-Service API for dApps',
                  'Strategy marketplace v2 (NFT-based)',
                  'Institutional partnerships',
                  'Expand to other L1s (Aptos, Sui)',
                ]}
              />
              <RoadmapCard
                phase="Phase 4: Dominate"
                timeline="2027+"
                items={[
                  'Default MEV infrastructure for Solana',
                  '10,000+ strategies live',
                  '$100M+ annual profit distributed',
                  'Become the "Uniswap of MEV"',
                ]}
              />
            </div>

            {/* Market Position */}
            <div className="relative bg-gradient-to-br from-rebellious/10 via-midnight-black to-trust-blue/10 border-2 border-rebellious/50 rounded-2xl p-10 overflow-hidden shadow-2xl">
              {/* Animated Corner Accents */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-rebellious/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-trust-blue/20 rounded-full blur-3xl" />

              {/* Header */}
              <div className="relative z-10 text-center mb-10">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-rebellious/30 to-trust-blue/30 border border-rebellious/50 rounded-full mb-4">
                  <span className="text-2xl">⚡</span>
                  <span className="text-2xl font-black text-white uppercase tracking-wider">Competitive Advantage</span>
                </div>
                <p className="text-neutral-gray max-w-2xl mx-auto">
                  Why MEVrebels will dominate the decentralized MEV landscape on Solana
                </p>
              </div>

              {/* Advantage Cards */}
              <div className="relative z-10 grid md:grid-cols-3 gap-8">
                <motion.div
                  className="group relative bg-midnight-black/60 backdrop-blur-sm border-2 border-border hover:border-rebellious rounded-xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-rebellious/30"
                  whileHover={{ y: -8 }}
                >
                  {/* Icon Badge */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="w-14 h-14 bg-gradient-to-br from-rebellious to-rebellious-red rounded-full flex items-center justify-center border-4 border-midnight-black shadow-lg shadow-rebellious/50">
                      <span className="text-2xl">🚀</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mt-6 text-center">
                    <h4 className="text-xl font-black text-white mb-3 group-hover:text-rebellious transition-colors">
                      First Mover
                    </h4>
                    <p className="text-sm text-neutral-gray leading-relaxed group-hover:text-white transition-colors">
                      No decentralized MEV marketplace exists on Solana today. We're defining the category.
                    </p>
                  </div>

                  {/* Bottom Accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rebellious to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>

                <motion.div
                  className="group relative bg-midnight-black/60 backdrop-blur-sm border-2 border-border hover:border-trust-blue rounded-xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-trust-blue/30"
                  whileHover={{ y: -8 }}
                >
                  {/* Icon Badge */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="w-14 h-14 bg-gradient-to-br from-trust-blue to-trust-blue/70 rounded-full flex items-center justify-center border-4 border-midnight-black shadow-lg shadow-trust-blue/50">
                      <span className="text-2xl">🔄</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mt-6 text-center">
                    <h4 className="text-xl font-black text-white mb-3 group-hover:text-trust-blue transition-colors">
                      Network Effects
                    </h4>
                    <p className="text-sm text-neutral-gray leading-relaxed group-hover:text-white transition-colors">
                      More strategies = more opportunities = more users. Self-reinforcing growth loop.
                    </p>
                  </div>

                  {/* Bottom Accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-trust-blue to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>

                <motion.div
                  className="group relative bg-midnight-black/60 backdrop-blur-sm border-2 border-border hover:border-profit-green rounded-xl p-8 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-profit-green/30"
                  whileHover={{ y: -8 }}
                >
                  {/* Icon Badge */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="w-14 h-14 bg-gradient-to-br from-profit-green to-profit-green/70 rounded-full flex items-center justify-center border-4 border-midnight-black shadow-lg shadow-profit-green/50">
                      <span className="text-2xl">⚙️</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mt-6 text-center">
                    <h4 className="text-xl font-black text-white mb-3 group-hover:text-profit-green transition-colors">
                      Infrastructure Moat
                    </h4>
                    <p className="text-sm text-neutral-gray leading-relaxed group-hover:text-white transition-colors">
                      23 days from zero to production proves execution speed. First to market wins.
                    </p>
                  </div>

                  {/* Bottom Accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-profit-green to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
              </div>

              {/* Bottom Decorative Line */}
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rebellious to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section className="py-20 border-b border-border bg-midnight-black/50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <ScrollAnimateSection>
              <SectionHeader
                label="THE DEVELOPER"
                title="Built by RECTOR"
                subtitle="Solana maximalist and blockchain innovator with a proven track record in DeFi architecture."
              />
            </ScrollAnimateSection>

            <ScrollAnimateSection>
              <div className="bg-gradient-to-br from-rebellious/10 to-midnight-black border-2 border-rebellious rounded-lg p-8 md:p-12">
                <div className="grid md:grid-cols-3 gap-8">
                  {/* Profile Image & Basic Info */}
                  <div className="md:col-span-1 text-center md:text-left space-y-4">
                    <div className="w-32 h-32 mx-auto md:mx-0 rounded-full border-4 border-rebellious/30 overflow-hidden">
                      <Image
                        src="https://avatars.githubusercontent.com/u/95009642"
                        alt="RECTOR Profile"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                        priority
                      />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white mb-1">RECTOR</h3>
                      <p className="text-rebellious font-mono text-sm mb-2">@rz1989s</p>
                      <p className="text-neutral-gray text-sm mb-4">Founder, RECTOR LABS</p>
                      <div className="flex items-center justify-center md:justify-start gap-3">
                        <a
                          href="https://github.com/rz1989s"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-midnight-black border border-border rounded-lg hover:border-rebellious transition-colors"
                          aria-label="GitHub Profile"
                        >
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                          </svg>
                        </a>
                        <a
                          href="https://twitter.com/rz1989sol"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-midnight-black border border-border rounded-lg hover:border-rebellious transition-colors"
                          aria-label="Twitter Profile"
                        >
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </a>
                        <a
                          href="https://docs.rectorspace.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-midnight-black border border-border rounded-lg hover:border-rebellious transition-colors"
                          aria-label="Website"
                        >
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Bio & Achievements */}
                  <div className="md:col-span-2 space-y-6">
                    {/* Bio */}
                    <div>
                      <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <span className="text-xl">💡</span>
                        About
                      </h4>
                      <p className="text-neutral-gray leading-relaxed">
                        "Building for eternity" — A Solana maximalist and blockchain innovator focused on decentralized finance architecture and high-performance systems. Founder of RECTOR LABS, pioneering MEV democratization and DeFi innovation on Solana.
                      </p>
                    </div>

                    {/* GitHub Stats */}
                    <div>
                      <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <span className="text-xl">📊</span>
                        GitHub Stats
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-midnight-black/50 border border-border rounded-lg p-4 text-center hover:border-profit-green transition-colors">
                          <div className="text-2xl font-black font-mono text-profit-green mb-1">24</div>
                          <div className="text-xs text-neutral-gray">Repositories</div>
                        </div>
                        <div className="bg-midnight-black/50 border border-border rounded-lg p-4 text-center hover:border-profit-green transition-colors">
                          <div className="text-2xl font-black font-mono text-profit-green mb-1">244</div>
                          <div className="text-xs text-neutral-gray">Stars Earned</div>
                        </div>
                        <div className="bg-midnight-black/50 border border-border rounded-lg p-4 text-center hover:border-profit-green transition-colors">
                          <div className="text-2xl font-black font-mono text-profit-green mb-1">20</div>
                          <div className="text-xs text-neutral-gray">Followers</div>
                        </div>
                        <div className="bg-midnight-black/50 border border-border rounded-lg p-4 text-center hover:border-profit-green transition-colors">
                          <div className="text-2xl font-black font-mono text-profit-green mb-1">3x</div>
                          <div className="text-xs text-neutral-gray">Pair Extraordinaire</div>
                        </div>
                      </div>
                    </div>

                    {/* Notable Projects */}
                    <div>
                      <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <span className="text-xl">🚀</span>
                        Notable Projects
                      </h4>
                      <div className="space-y-3">
                        <div className="bg-midnight-black/50 border border-border rounded-lg p-4 hover:border-trust-blue transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h5 className="text-white font-bold mb-1">recMEV-installer</h5>
                              <p className="text-sm text-neutral-gray mb-2">High-performance Solana arbitrage engine installer</p>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="px-2 py-1 bg-trust-blue/20 border border-trust-blue/50 rounded text-trust-blue">Shell</span>
                                <span className="px-2 py-1 bg-rebellious/20 border border-rebellious/50 rounded text-rebellious">Solana</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-midnight-black/50 border border-border rounded-lg p-4 hover:border-trust-blue transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h5 className="text-white font-bold mb-1">claude-code-statusline</h5>
                              <p className="text-sm text-neutral-gray mb-2">Terminal statusline tool with cost tracking — 126 stars, 8 forks</p>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="px-2 py-1 bg-trust-blue/20 border border-trust-blue/50 rounded text-trust-blue">TypeScript</span>
                                <span className="px-2 py-1 bg-profit-green/20 border border-profit-green/50 rounded text-profit-green">126 ⭐</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-midnight-black/50 border border-border rounded-lg p-4 hover:border-trust-blue transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h5 className="text-white font-bold mb-1">recSOL</h5>
                              <p className="text-sm text-neutral-gray mb-2">Liquid Staking Token maintaining 1:1 value with SOL</p>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="px-2 py-1 bg-trust-blue/20 border border-trust-blue/50 rounded text-trust-blue">Rust</span>
                                <span className="px-2 py-1 bg-rebellious/20 border border-rebellious/50 rounded text-rebellious">DeFi</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tech Stack */}
                    <div>
                      <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <span className="text-xl">🛠️</span>
                        Tech Stack
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {['Rust', 'TypeScript', 'Python', 'React', 'Node.js', 'Solana', 'Web3.js', 'Docker', 'PostgreSQL'].map((tech) => (
                          <span
                            key={tech}
                            className="px-3 py-1 bg-midnight-black/50 border border-border rounded text-sm text-white hover:border-rebellious transition-colors"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quote */}
                <div className="mt-8 pt-8 border-t border-border">
                  <blockquote className="text-center">
                    <p className="text-xl text-white italic mb-2">"23 days from idea to production-ready MEV infrastructure"</p>
                    <cite className="text-sm text-neutral-gray">— Execution speed meets technical excellence</cite>
                  </blockquote>
                </div>
              </div>
            </ScrollAnimateSection>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-rebellious/20 via-midnight-black to-trust-blue/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              Join the MEV Revolution
            </h2>
            <p className="text-xl text-neutral-gray mb-12 max-w-2xl mx-auto">
              Start creating strategies, executing trades, or vote on governance proposals today.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <Link
                href="/strategies/create"
                className="px-10 py-5 bg-rebellious text-white font-bold text-xl rounded-lg hover:bg-rebellious/90 transition-all hover:scale-105 cursor-pointer inline-block"
              >
                CREATE STRATEGY
              </Link>
              <Link
                href="/governance"
                className="px-10 py-5 border-2 border-trust-blue text-trust-blue font-bold text-xl rounded-lg hover:bg-trust-blue hover:text-white transition-all hover:scale-105 cursor-pointer inline-block"
              >
                VOTE ON PROPOSALS
              </Link>
              <Link
                href="/analytics"
                className="px-10 py-5 border-2 border-profit-green text-profit-green font-bold text-xl rounded-lg hover:bg-profit-green hover:text-midnight-black transition-all hover:scale-105 cursor-pointer inline-block"
              >
                VIEW ANALYTICS
              </Link>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-6 justify-center text-sm text-neutral-gray">
              <a
                href="https://github.com/RECTOR-LABS/mevrebels-protocol"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors underline"
              >
                GitHub Repository
              </a>
              <Link href="/api-docs" className="hover:text-white transition-colors underline">
                API Documentation
              </Link>
              <a
                href="https://api.mevrebels.rectorspace.com/health"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors underline"
              >
                API Health Status
              </a>
              <a
                href="https://earn.superteam.fun"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors underline"
              >
                Superteam Earn
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Component: Stat Card
function StatCard({ value, label, icon }: { value: string; label: string; icon: string }) {
  return (
    <div className="bg-midnight-black/50 border border-border rounded-lg p-6 hover:border-rebellious transition-all hover:scale-105">
      <div className="text-4xl mb-3 text-center">{icon}</div>
      <div className="text-3xl md:text-4xl font-black font-mono text-white text-center mb-2">
        {value}
      </div>
      <div className="text-sm text-neutral-gray text-center uppercase tracking-wide">
        {label}
      </div>
    </div>
  );
}

// Component: Section Header
function SectionHeader({
  label,
  title,
  subtitle,
}: {
  label: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center mb-16">
      <div className="inline-block px-4 py-2 bg-rebellious/20 border border-rebellious/50 rounded-full mb-4">
        <span className="text-rebellious font-mono font-bold text-sm uppercase tracking-wider">
          {label}
        </span>
      </div>
      <h2 className="text-4xl md:text-5xl font-black text-white mb-4">{title}</h2>
      <p className="text-xl text-neutral-gray max-w-3xl mx-auto">{subtitle}</p>
    </div>
  );
}

// Component: Problem Card
function ProblemCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-midnight-black/50 border border-border rounded-lg p-6 hover:border-rebellious transition-all">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-neutral-gray leading-relaxed">{description}</p>
    </div>
  );
}

// Component: Solution Card
function SolutionCard({
  icon,
  title,
  description,
  features,
}: {
  icon: string;
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <div className="bg-gradient-to-br from-trust-blue/10 to-midnight-black border border-trust-blue rounded-lg p-8 hover:scale-105 transition-all">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-neutral-gray mb-6 leading-relaxed">{description}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-white">
            <span className="text-profit-green mt-1">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Component: Workflow Step
function WorkflowStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-trust-blue text-white font-black text-2xl rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-trust-blue/30">
        {number}
      </div>
      <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
      <p className="text-sm text-neutral-gray leading-relaxed">{description}</p>
    </div>
  );
}

// Component: Achievement Card
function AchievementCard({
  icon,
  title,
  items,
  highlight,
}: {
  icon: string;
  title: string;
  items: string[];
  highlight: string;
}) {
  return (
    <div className="bg-midnight-black border border-border rounded-lg p-6 hover:border-profit-green transition-all">
      <div className="flex items-start gap-4 mb-4">
        <div className="text-4xl">{icon}</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <div className="inline-block px-3 py-1 bg-profit-green/20 border border-profit-green/50 rounded text-profit-green text-xs font-mono mb-4">
            {highlight}
          </div>
        </div>
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-neutral-gray text-sm">
            <span className="text-profit-green mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Component: Tech Highlight
function TechHighlight({
  metric,
  label,
  detail,
}: {
  metric: string;
  label: string;
  detail: string;
}) {
  return (
    <div className="text-center">
      <div className="text-4xl font-black font-mono text-trust-blue mb-2">{metric}</div>
      <div className="text-white font-bold mb-1">{label}</div>
      <div className="text-sm text-neutral-gray">{detail}</div>
    </div>
  );
}

// Component: Tech Stack Card
function TechStackCard({
  category,
  icon,
  technologies,
}: {
  category: string;
  icon: string;
  technologies: string[];
}) {
  return (
    <div className="bg-midnight-black/50 border border-border rounded-lg p-6 hover:border-trust-blue transition-all">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{icon}</span>
        <h3 className="text-xl font-bold text-white">{category}</h3>
      </div>
      <ul className="space-y-2">
        {technologies.map((tech, index) => (
          <li key={index} className="flex items-start gap-2 text-neutral-gray">
            <span className="text-trust-blue mt-1">→</span>
            <span>{tech}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Component: Roadmap Card
function RoadmapCard({
  phase,
  timeline,
  items,
}: {
  phase: string;
  timeline: string;
  items: string[];
}) {
  return (
    <div className="bg-midnight-black border border-border rounded-lg p-6 hover:border-rebellious transition-all">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-1">{phase}</h3>
        <div className="text-rebellious font-mono text-sm">{timeline}</div>
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-neutral-gray text-sm">
            <span className="text-rebellious mt-0.5">▸</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Component: Advantage Card
function AdvantageCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center">
      <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
      <p className="text-sm text-neutral-gray leading-relaxed">{description}</p>
    </div>
  );
}

// Component: Video Player
function VideoPlayer({ videoUrl }: { videoUrl: string }) {
  return (
    <motion.div
      className="relative w-full max-w-4xl mx-auto"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* Video Container with Border & Glow */}
      <div className="relative bg-midnight-black border-2 border-rebellious rounded-xl overflow-hidden shadow-2xl group">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-rebellious/20 to-trust-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Aspect Ratio Container for 16:9 */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={videoUrl}
            title="MEVrebels Demo Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Bottom Gradient Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-midnight-black to-transparent pointer-events-none" />
      </div>

      {/* Video Info Below */}
      <div className="mt-6 text-center">
        <p className="text-neutral-gray text-sm">
          🎥 Full demo showcasing strategy creation, DAO voting, arbitrage execution, and real-time analytics
        </p>
        <div className="mt-4 flex flex-wrap gap-3 justify-center">
          <a
            href={videoUrl.replace('/embed/', '/watch?v=')}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-rebellious/20 border border-rebellious/50 text-rebellious rounded text-sm font-mono hover:bg-rebellious/30 transition-colors"
          >
            Watch on YouTube
          </a>
          <a
            href="https://github.com/RECTOR-LABS/mevrebels-protocol"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-trust-blue/20 border border-trust-blue/50 text-trust-blue rounded text-sm font-mono hover:bg-trust-blue/30 transition-colors"
          >
            View Source Code
          </a>
        </div>
      </div>
    </motion.div>
  );
}
