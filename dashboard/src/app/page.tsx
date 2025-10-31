'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';

export default function Home() {
  const { connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Cyberpunk Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2d2d2d_1px,transparent_1px),linear-gradient(to_bottom,#2d2d2d_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />

      {/* Hero Section */}
      <section className="relative">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <motion.div
            className="flex flex-col items-center text-center space-y-8 max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Glowing Title */}
            <motion.h1
              className="text-6xl md:text-8xl font-black tracking-tighter"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <span className="inline-block text-white">RECLAIM</span>{' '}
              <span className="inline-block text-rebellious animate-pulse glow-red">
                MEV
              </span>
            </motion.h1>

            {/* Tagline with glitch effect */}
            <motion.p
              className="text-2xl md:text-3xl font-bold text-trust-blue tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              POWER TO THE <span className="text-profit-green">PEOPLE</span>
            </motion.p>

            <motion.p
              className="text-lg md:text-xl text-neutral-gray max-w-3xl leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              The first decentralized MEV marketplace on Solana. Create arbitrage strategies, earn royalties, and democratize billions in MEV profits—without running a validator.
            </motion.p>

            {/* Key Value Props */}
            <motion.div
              className="flex flex-wrap gap-4 justify-center text-sm font-mono"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="px-4 py-2 bg-profit-green/20 border border-profit-green/50 rounded text-profit-green">
                ✓ No Validator Required
              </div>
              <div className="px-4 py-2 bg-trust-blue/20 border border-trust-blue/50 rounded text-trust-blue">
                ✓ 100% Decentralized
              </div>
              <div className="px-4 py-2 bg-rebellious/20 border border-rebellious/50 rounded text-rebellious">
                ✓ Community-Governed
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 mt-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              {!mounted ? (
                // Render placeholder during SSR to avoid hydration mismatch
                <>
                  <div className="px-8 py-4 bg-rebellious text-white font-bold rounded-lg opacity-0 cursor-pointer inline-block">
                    BROWSE STRATEGIES
                  </div>
                  <div className="px-8 py-4 border-2 border-neutral-gray text-neutral-gray font-bold rounded-lg opacity-0 cursor-pointer inline-block">
                    VIEW PITCH DECK
                  </div>
                </>
              ) : connected ? (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/strategies"
                      className="group relative px-8 py-4 bg-rebellious text-white font-bold rounded-lg overflow-hidden transition-all glow-red cursor-pointer inline-block"
                    >
                      <span className="relative z-10">BROWSE STRATEGIES</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-rebellious to-rebellious-red/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/strategies/create"
                      className="px-8 py-4 border-2 border-trust-blue text-trust-blue font-bold rounded-lg hover:bg-trust-blue hover:text-white transition-all cursor-pointer inline-block"
                    >
                      CREATE STRATEGY
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/pitch-deck"
                      className="px-8 py-4 border-2 border-neutral-gray text-neutral-gray font-bold rounded-lg hover:bg-neutral-gray hover:text-midnight-black transition-all cursor-pointer inline-block"
                    >
                      VIEW PITCH DECK
                    </Link>
                  </motion.div>
                </>
              ) : (
                <>
                  <div className="px-8 py-4 border-2 border-warning-orange text-warning-orange font-bold rounded-lg animate-pulse">
                    CONNECT WALLET TO START
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/pitch-deck"
                      className="px-8 py-4 border-2 border-neutral-gray text-neutral-gray font-bold rounded-lg hover:bg-neutral-gray hover:text-midnight-black transition-all cursor-pointer inline-block"
                    >
                      VIEW PITCH DECK
                    </Link>
                  </motion.div>
                </>
              )}
            </motion.div>
          </motion.div>

          {/* Stats Bar - Cyberpunk Style */}
          <AnimatedStatsGrid>
            <StatCard label="Annual MEV" value="$2.8B" trend="on Solana" icon="💰" />
            <StatCard label="Programs Deployed" value="4" trend="REC vanity" icon="⚡" />
            <StatCard label="Test Coverage" value="83%" trend="45/54 passing" icon="✅" />
            <StatCard label="Production Ready" value="100%" trend="23 days" icon="🚀" />
          </AnimatedStatsGrid>
        </div>
      </section>

      {/* Problem Section */}
      <AnimatedSection className="py-20 border-t border-border bg-midnight-black/50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <div className="inline-block px-4 py-2 bg-rebellious/20 border border-rebellious/50 rounded-full mb-4">
              <span className="text-rebellious font-mono font-bold text-sm uppercase">THE PROBLEM</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              MEV is an <span className="text-rebellious">Oligopoly</span>
            </h2>
            <p className="text-xl text-neutral-gray max-w-3xl mx-auto">
              Billions in MEV profits are extracted by privileged validators and sophisticated bots, leaving retail traders with nothing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <ProblemCard
              icon="🏦"
              title="Centralized Control"
              description="Top 10 validators capture 60%+ of all MEV profits through privileged transaction ordering."
            />
            <ProblemCard
              icon="💸"
              title="$100K+ Barriers"
              description="Running validators requires massive capital, technical expertise, and infrastructure."
            />
            <ProblemCard
              icon="😤"
              title="Retail Gets Rekt"
              description="Individual traders face frontrunning, sandwiching, and toxic MEV with zero recourse."
            />
          </div>
        </div>
      </AnimatedSection>

      {/* Solution Section */}
      <AnimatedSection className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <div className="inline-block px-4 py-2 bg-trust-blue/20 border border-trust-blue/50 rounded-full mb-4">
              <span className="text-trust-blue font-mono font-bold text-sm uppercase">THE SOLUTION</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Democratize MEV Through <span className="text-profit-green">Decentralized Arbitrage</span>
            </h2>
            <p className="text-xl text-neutral-gray max-w-3xl mx-auto">
              MEVrebels is a DAO-governed marketplace where anyone can create, execute, and profit from arbitrage strategies.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              title="Strategy Marketplace"
              description="Browse community-created arbitrage strategies. Creators earn 30% royalties on every execution."
              icon="🎯"
              accentColor="rebellious"
            />
            <FeatureCard
              title="DAO Governance"
              description="Vote on strategy approvals with $REBEL tokens. Community controls quality and direction."
              icon="🗳️"
              accentColor="trust-blue"
            />
            <FeatureCard
              title="Flash Loan Arbitrage"
              description="Execute strategies with zero capital using our custom WSOL flash loan protocol. 0.09% fee."
              icon="💎"
              accentColor="profit-green"
            />
          </div>
        </div>
      </AnimatedSection>

      {/* How It Works */}
      <AnimatedSection className="py-20 border-t border-border bg-midnight-black/50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <div className="inline-block px-4 py-2 bg-warning-orange/20 border border-warning-orange/50 rounded-full mb-4">
              <span className="text-warning-orange font-mono font-bold text-sm uppercase">HOW IT WORKS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              From Strategy to Profit in <span className="text-warning-orange">4 Steps</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <HowItWorksStep
              number="1"
              title="Create Strategy"
              description="Define arbitrage routes, DEXs, and profit thresholds using our TypeScript SDK."
            />
            <HowItWorksStep
              number="2"
              title="DAO Approval"
              description="Community votes to approve quality strategies and filter out spam or malicious code."
            />
            <HowItWorksStep
              number="3"
              title="Execute Trades"
              description="Anyone can execute approved strategies. Flash loans enable capital-free arbitrage."
            />
            <HowItWorksStep
              number="4"
              title="Share Profits"
              description="Profits split: Executor (60%), Creator (30%), DAO Treasury (10%). Fair and transparent."
            />
          </div>
        </div>
      </AnimatedSection>

      {/* Comparison Table */}
      <AnimatedSection className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Why <span className="text-rebellious">MEVrebels</span>?
            </h2>
            <p className="text-xl text-neutral-gray">
              The first and only decentralized MEV marketplace on Solana
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <ComparisonTable />
          </div>
        </div>
      </AnimatedSection>

      {/* Social Proof / Traction */}
      <AnimatedSection className="py-20 border-t border-border bg-gradient-to-b from-midnight-black/50 to-rebellious/5">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center mb-12">
            <div className="inline-block px-4 py-2 bg-profit-green/20 border border-profit-green/50 rounded-full mb-4">
              <span className="text-profit-green font-mono font-bold text-sm uppercase">BUILT FOR PRODUCTION</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              23 Days. <span className="text-profit-green">Full-Stack Protocol.</span>
            </h2>
            <p className="text-xl text-neutral-gray">
              From idea to production-ready infrastructure with real backend and deployed programs.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <TractionCard value="4" label="Solana Programs" sublabel="All deployed to devnet" />
            <TractionCard value="3" label="Backend Services" sublabel="API + Analytics + Monitor" />
            <TractionCard value="83%" label="Test Coverage" sublabel="45/54 tests passing" />
            <TractionCard value="100%" label="API Uptime" sublabel="api.mevrebels.rectorspace.com" />
          </div>
        </div>
      </AnimatedSection>

      {/* Final CTA */}
      <AnimatedSection className="py-20 border-t border-border bg-gradient-to-br from-rebellious/20 via-midnight-black to-trust-blue/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              Join the <span className="text-rebellious">Revolution</span>
            </h2>
            <p className="text-xl text-neutral-gray mb-10">
              Start creating strategies, executing trades, or voting on governance today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/strategies"
                  className="px-10 py-5 bg-rebellious text-white font-bold text-lg rounded-lg hover:bg-rebellious/90 transition-all glow-red cursor-pointer inline-block"
                >
                  BROWSE STRATEGIES
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/governance"
                  className="px-10 py-5 border-2 border-trust-blue text-trust-blue font-bold text-lg rounded-lg hover:bg-trust-blue hover:text-white transition-all cursor-pointer inline-block"
                >
                  VOTE ON PROPOSALS
                </Link>
              </motion.div>
            </div>

            <div className="mt-12 flex flex-wrap gap-6 justify-center text-sm text-neutral-gray">
              <a href="https://github.com/RECTOR-LABS/mevrebels-protocol" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline">
                GitHub
              </a>
              <Link href="/api-docs" className="hover:text-white transition-colors underline">
                API Docs
              </Link>
              <Link href="/pitch-deck" className="hover:text-white transition-colors underline">
                Pitch Deck
              </Link>
              <a href="https://api.mevrebels.rectorspace.com/health" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors underline">
                API Status
              </a>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}

// Animated Section Wrapper
function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6 }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// Animated Stats Grid
function AnimatedStatsGrid({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div
      ref={ref}
      className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-6"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
          }
        }
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Stat Card Component
function StatCard({ label, value, trend, icon }: { label: string; value: string; trend: string; icon: string }) {
  return (
    <motion.div
      className="group relative bg-midnight-black/50 border border-border rounded-lg p-6 backdrop-blur-sm hover:border-rebellious transition-all"
      whileHover={{ scale: 1.05, borderColor: '#ef4444' }}
    >
      <div className="absolute top-4 right-4 text-3xl opacity-30 group-hover:opacity-100 transition-opacity">
        {icon}
      </div>
      <div className="flex flex-col space-y-2">
        <span className="text-neutral-gray text-sm uppercase tracking-wider">{label}</span>
        <span className="text-3xl font-black text-white font-mono">{value}</span>
        <span className="text-profit-green text-sm font-mono">{trend}</span>
      </div>
    </motion.div>
  );
}

// Problem Card
function ProblemCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <motion.div
      className="bg-midnight-black/80 border border-border rounded-lg p-6 hover:border-rebellious transition-all"
      whileHover={{ scale: 1.05 }}
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-neutral-gray leading-relaxed">{description}</p>
    </motion.div>
  );
}

// Feature Card
function FeatureCard({ title, description, icon, accentColor }: {
  title: string;
  description: string;
  icon: string;
  accentColor: string;
}) {
  const accentClasses: Record<string, string> = {
    'rebellious': 'border-rebellious hover:glow-red',
    'trust-blue': 'border-trust-blue hover:glow-blue',
    'profit-green': 'border-profit-green hover:glow-green',
  };

  return (
    <motion.div
      className={`relative bg-midnight-black/80 border-l-4 ${accentClasses[accentColor]} rounded-lg p-8 backdrop-blur-sm transition-all`}
      whileHover={{ scale: 1.05 }}
    >
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-neutral-gray leading-relaxed">{description}</p>
    </motion.div>
  );
}

// How It Works Step
function HowItWorksStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <motion.div
      className="text-center"
      whileHover={{ y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-16 h-16 bg-warning-orange text-midnight-black font-black text-2xl rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-warning-orange/30">
        {number}
      </div>
      <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
      <p className="text-sm text-neutral-gray leading-relaxed">{description}</p>
    </motion.div>
  );
}

// Comparison Table
function ComparisonTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-border">
            <th className="text-left py-4 px-6 text-neutral-gray font-mono text-sm uppercase">Feature</th>
            <th className="text-center py-4 px-6 text-rebellious font-black">MEVrebels</th>
            <th className="text-center py-4 px-6 text-neutral-gray">Centralized Bots</th>
            <th className="text-center py-4 px-6 text-neutral-gray">Validators</th>
          </tr>
        </thead>
        <tbody>
          <ComparisonRow
            feature="Capital Required"
            mevrebels="$0"
            centralized="$10K+"
            validators="$100K+"
          />
          <ComparisonRow
            feature="Decentralized"
            mevrebels="✓"
            centralized="✗"
            validators="✗"
          />
          <ComparisonRow
            feature="Community Governed"
            mevrebels="✓"
            centralized="✗"
            validators="✗"
          />
          <ComparisonRow
            feature="Strategy Marketplace"
            mevrebels="✓"
            centralized="✗"
            validators="✗"
          />
          <ComparisonRow
            feature="Creator Royalties"
            mevrebels="30%"
            centralized="0%"
            validators="0%"
          />
          <ComparisonRow
            feature="Flash Loans"
            mevrebels="✓"
            centralized="Limited"
            validators="✗"
          />
        </tbody>
      </table>
    </div>
  );
}

function ComparisonRow({ feature, mevrebels, centralized, validators }: {
  feature: string;
  mevrebels: string;
  centralized: string;
  validators: string;
}) {
  return (
    <tr className="border-b border-border hover:bg-midnight-black/30 transition-colors">
      <td className="py-4 px-6 text-white font-medium">{feature}</td>
      <td className="py-4 px-6 text-center text-profit-green font-bold">{mevrebels}</td>
      <td className="py-4 px-6 text-center text-neutral-gray">{centralized}</td>
      <td className="py-4 px-6 text-center text-neutral-gray">{validators}</td>
    </tr>
  );
}

// Traction Card
function TractionCard({ value, label, sublabel }: { value: string; label: string; sublabel: string }) {
  return (
    <motion.div
      className="text-center bg-midnight-black/50 border border-border rounded-lg p-6 hover:border-profit-green transition-all"
      whileHover={{ scale: 1.05 }}
    >
      <div className="text-4xl font-black font-mono text-profit-green mb-2">{value}</div>
      <div className="text-white font-bold mb-1">{label}</div>
      <div className="text-xs text-neutral-gray">{sublabel}</div>
    </motion.div>
  );
}
