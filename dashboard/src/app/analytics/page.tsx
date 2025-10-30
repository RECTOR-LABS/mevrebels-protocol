'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { api } from '@/lib/api';

export default function AnalyticsPage() {
  const { connected, publicKey } = useWallet();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);

  // Fetch analytics data from API
  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all analytics data in parallel
        const [strategyStats, executionStats, leaderboardData] = await Promise.all([
          api.analytics.getStrategyStats(),
          api.analytics.getExecutionStats(),
          api.analytics.getLeaderboard(),
        ]);

        setStats({
          strategies: strategyStats,
          executions: executionStats,
        });
        setLeaderboard(leaderboardData);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setError('Failed to load analytics. Please try again later.');
        // Set default values on error
        setStats({
          strategies: {
            totalStrategies: 0,
            activeStrategies: 0,
            totalProfit: 0,
            totalExecutions: 0,
          },
          executions: {
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0,
            avgProfitPerExecution: 0,
            totalVolume: 0,
          },
        });
        setLeaderboard({ topStrategies: [], topCreators: [] });
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  // Extract stats for easy access
  const totalVolume = stats?.executions?.totalVolume || 0;
  const totalExecutions = stats?.executions?.totalExecutions || 0;
  const activeStrategies = stats?.strategies?.activeStrategies || 0;
  const avgSuccessRate = stats?.executions?.totalExecutions > 0
    ? (stats?.executions?.successfulExecutions / stats?.executions?.totalExecutions) * 100
    : 0;

  // Top strategies from leaderboard
  const topStrategies = leaderboard?.topStrategies || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-br from-midnight-black to-midnight-black/50">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
            PROTOCOL <span className="text-profit-green">ANALYTICS</span>
          </h1>
          <p className="text-neutral-gray">
            Track performance, profits, and protocol health in real-time
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-profit-green mb-4"></div>
            <p className="text-neutral-gray">Loading analytics from API...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Failed to Load Analytics
            </h3>
            <p className="text-neutral-gray mb-2">{error}</p>
            <p className="text-sm text-neutral-gray mb-6">
              API: {process.env.NEXT_PUBLIC_API_URL || 'https://api.mevrebels.rectorspace.com'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-profit-green text-white font-bold rounded-lg hover:bg-profit-green/90 transition-all cursor-pointer"
            >
              RETRY
            </button>
          </div>
        )}

        {/* Analytics Content */}
        {!loading && !error && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <MetricCard
            label="Total Volume"
            value={`$${totalVolume.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            trend="+24%"
            icon="📊"
            color="trust-blue"
          />
          <MetricCard
            label="Active Strategies"
            value={activeStrategies.toString()}
            trend="+12"
            icon="⚡"
            color="warning-orange"
          />
          <MetricCard
            label="Total Executions"
            value={totalExecutions.toLocaleString()}
            trend="+18%"
            icon="🚀"
            color="rebellious"
          />
          <MetricCard
            label="Avg Success Rate"
            value={`${avgSuccessRate.toFixed(1)}%`}
            trend="+2.3%"
            icon="✅"
            color="profit-green"
          />
        </div>

        {/* User Earnings (if connected) */}
        {connected && publicKey && (
          <div className="mb-12 bg-gradient-to-br from-trust-blue/10 to-midnight-black border-2 border-trust-blue rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              💰 Your Earnings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-neutral-gray text-sm uppercase mb-2">
                  Creator Earnings
                </div>
                <div className="text-3xl font-black font-mono text-profit-green">
                  $2,543.89
                </div>
                <div className="text-xs text-profit-green font-mono mt-1">
                  +15.6% this week
                </div>
              </div>
              <div>
                <div className="text-neutral-gray text-sm uppercase mb-2">
                  Executor Earnings
                </div>
                <div className="text-3xl font-black font-mono text-trust-blue">
                  $1,876.45
                </div>
                <div className="text-xs text-trust-blue font-mono mt-1">
                  +8.2% this week
                </div>
              </div>
              <div>
                <div className="text-neutral-gray text-sm uppercase mb-2">
                  Total Earned
                </div>
                <div className="text-3xl font-black font-mono text-white">
                  $4,420.34
                </div>
                <div className="text-xs text-neutral-gray font-mono mt-1">
                  All time
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Strategies Leaderboard */}
        <div className="bg-midnight-black/50 border border-border rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">
            🏆 Top Performing Strategies
          </h2>
          <div className="space-y-4">
            {topStrategies.length === 0 ? (
              <div className="text-center py-12 text-neutral-gray">
                No strategy data available yet
              </div>
            ) : (
              topStrategies.map((strategy: any, index: number) => (
                <div
                  key={strategy.strategyId || index}
                  className="flex items-center gap-4 p-4 bg-midnight-black border border-border rounded-lg hover:border-rebellious transition-colors"
                >
                  <div className="text-3xl font-black font-mono text-neutral-gray w-12 text-center">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-bold mb-1">{strategy.name || 'Unknown Strategy'}</div>
                    <div className="flex items-center gap-4 text-sm text-neutral-gray">
                      <span className="font-mono">by {strategy.creator || 'Anonymous'}</span>
                      <span>•</span>
                      <span>{strategy.executionCount || 0} executions</span>
                      <span>•</span>
                      <span className="text-trust-blue">
                        {strategy.successRate?.toFixed(1) || 0}% success
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black font-mono text-profit-green">
                      ${(strategy.totalProfit || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-neutral-gray uppercase">
                      Total Profit
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* DEX Distribution */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-midnight-black/50 border border-border rounded-lg p-8">
            <h3 className="text-xl font-bold text-white mb-6">DEX Distribution</h3>
            <div className="space-y-4">
              <DistributionBar label="Raydium" value={45} color="rebellious" />
              <DistributionBar label="Orca" value={32} color="trust-blue" />
              <DistributionBar label="Meteora" value={18} color="profit-green" />
              <DistributionBar label="Jupiter" value={5} color="warning-orange" />
            </div>
          </div>

          <div className="bg-midnight-black/50 border border-border rounded-lg p-8">
            <h3 className="text-xl font-bold text-white mb-6">
              Token Pair Distribution
            </h3>
            <div className="space-y-4">
              <DistributionBar label="SOL/USDC" value={38} color="rebellious" />
              <DistributionBar label="SOL/USDT" value={24} color="trust-blue" />
              <DistributionBar label="BONK/SOL" value={16} color="profit-green" />
              <DistributionBar label="JUP/USDC" value={12} color="warning-orange" />
              <DistributionBar label="Others" value={10} color="neutral-gray" />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-midnight-black/50 border border-border rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">⚡ Recent Activity</h2>
          <div className="space-y-3">
            {topStrategies.length === 0 ? (
              <div className="text-center py-12 text-neutral-gray">
                No recent activity
              </div>
            ) : (
              topStrategies.slice(0, 6).map((strategy: any, index: number) => (
                <div
                  key={strategy.strategyId || index}
                  className="flex items-center justify-between p-3 bg-midnight-black rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-profit-green rounded-full animate-pulse" />
                    <span className="text-white">{strategy.name || 'Unknown Strategy'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-neutral-gray text-sm font-mono">
                      {new Date().toLocaleTimeString()}
                    </span>
                    <span className="text-profit-green font-mono font-bold">
                      +${((strategy.totalProfit || 0) / (strategy.executionCount || 1)).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  trend,
  icon,
  color,
}: {
  label: string;
  value: string;
  trend: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-gradient-to-br from-midnight-black to-midnight-black/50 border border-border rounded-lg p-6 hover:scale-105 transition-all hover:shadow-xl">
      <div className="flex items-start justify-between mb-3">
        <div className="text-neutral-gray text-sm uppercase tracking-wider">
          {label}
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
      <div className={`text-3xl font-black font-mono text-${color} mb-1`}>
        {value}
      </div>
      <div className="text-profit-green text-sm font-mono">{trend}</div>
    </div>
  );
}

function DistributionBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-white">{label}</span>
        <span className="font-mono text-neutral-gray">{value}%</span>
      </div>
      <div className="h-3 bg-midnight-black rounded-full overflow-hidden">
        <div
          className={`h-full bg-${color} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
