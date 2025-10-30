'use client';

import { useState, useMemo, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import Link from 'next/link';
import { StrategyCard } from '@/components/strategies/StrategyCard';
import { api } from '@/lib/api';
import { Strategy, StrategyFilters, StrategySort } from '@/types/strategy';

export default function StrategiesPage() {
  const { connected } = useWallet();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<StrategyFilters>({});
  const [sortBy, setSortBy] = useState<StrategySort>('profit-desc');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch strategies from API on component mount
  useEffect(() => {
    async function fetchStrategies() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.strategies.getAll();
        setStrategies(data);
      } catch (err) {
        console.error('Failed to fetch strategies:', err);
        setError('Failed to load strategies. Please try again later.');
        // Fallback to empty array on error
        setStrategies([]);
      } finally {
        setLoading(false);
      }
    }

    fetchStrategies();
  }, []);

  // Filter and sort strategies
  const filteredStrategies = useMemo(() => {
    let result = [...strategies];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.creator.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply DEX filter
    if (filters.dex) {
      result = result.filter((s) => s.dexes.includes(filters.dex!));
    }

    // Apply min profit filter
    if (filters.minProfit) {
      result = result.filter((s) => s.profitThreshold >= filters.minProfit!);
    }

    // Apply status filter
    if (filters.status) {
      result = result.filter((s) => s.status === filters.status);
    }

    // Apply sorting
    switch (sortBy) {
      case 'profit-desc':
        result.sort((a, b) => b.totalProfit - a.totalProfit);
        break;
      case 'profit-asc':
        result.sort((a, b) => a.totalProfit - b.totalProfit);
        break;
      case 'executions-desc':
        result.sort((a, b) => b.executionCount - a.executionCount);
        break;
      case 'success-desc':
        result.sort((a, b) => b.successRate - a.successRate);
        break;
      case 'recent':
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return result;
  }, [strategies, filters, sortBy, searchTerm]);

  const handleExecute = (strategyId: string) => {
    if (!connected) {
      alert('Please connect your wallet first!');
      return;
    }
    // TODO: Implement actual strategy execution with Anchor
    alert(`Executing strategy ${strategyId}... (Coming soon!)`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative border-b border-border bg-gradient-to-br from-midnight-black to-midnight-black/50">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
                STRATEGY <span className="text-rebellious">MARKETPLACE</span>
              </h1>
              <p className="text-neutral-gray">
                Browse, execute, and profit from community-created arbitrage
                strategies
              </p>
            </div>
            <Link
              href="/strategies/create"
              className="px-6 py-3 bg-trust-blue text-white font-bold rounded-lg hover:bg-trust-blue/80 transition-all hover:scale-105 cursor-pointer"
            >
              + CREATE STRATEGY
            </Link>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="sticky top-16 z-40 border-b border-border bg-midnight-black/95 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search strategies or creators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-midnight-black border border-border rounded-lg text-white placeholder:text-neutral-gray focus:border-rebellious focus:outline-none transition-colors"
              />
            </div>

            {/* DEX Filter */}
            <select
              value={filters.dex || ''}
              onChange={(e) =>
                setFilters({ ...filters, dex: e.target.value || undefined })
              }
              className="px-4 py-2 bg-midnight-black border border-border rounded-lg text-white focus:border-trust-blue focus:outline-none transition-colors cursor-pointer"
            >
              <option value="">All DEXes</option>
              <option value="Raydium">Raydium</option>
              <option value="Orca">Orca</option>
              <option value="Meteora">Meteora</option>
              <option value="Jupiter">Jupiter</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as StrategySort)}
              className="px-4 py-2 bg-midnight-black border border-border rounded-lg text-white focus:border-trust-blue focus:outline-none transition-colors cursor-pointer"
            >
              <option value="profit-desc">Highest Profit</option>
              <option value="profit-asc">Lowest Profit</option>
              <option value="executions-desc">Most Executions</option>
              <option value="success-desc">Highest Success Rate</option>
              <option value="recent">Most Recent</option>
            </select>

            {/* Status Filter */}
            <select
              value={filters.status || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value as Strategy['status'] | undefined,
                })
              }
              className="px-4 py-2 bg-midnight-black border border-border rounded-lg text-white focus:border-trust-blue focus:outline-none transition-colors cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Active Filters Display */}
          {(filters.dex || filters.minProfit || filters.status || searchTerm) && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm text-neutral-gray">Active filters:</span>
              {searchTerm && (
                <span className="px-2 py-1 text-xs bg-rebellious/20 text-rebellious border border-rebellious/30 rounded">
                  Search: "{searchTerm}"
                </span>
              )}
              {filters.dex && (
                <span className="px-2 py-1 text-xs bg-trust-blue/20 text-trust-blue border border-trust-blue/30 rounded">
                  DEX: {filters.dex}
                </span>
              )}
              {filters.status && (
                <span className="px-2 py-1 text-xs bg-profit-green/20 text-profit-green border border-profit-green/30 rounded">
                  Status: {filters.status}
                </span>
              )}
              <button
                onClick={() => {
                  setFilters({});
                  setSearchTerm('');
                }}
                className="ml-2 text-xs text-neutral-gray hover:text-white transition-colors underline cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Strategy Grid */}
      <div className="container mx-auto px-4 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-rebellious mb-4"></div>
            <p className="text-neutral-gray">Loading strategies from API...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Failed to Load Strategies
            </h3>
            <p className="text-neutral-gray mb-2">{error}</p>
            <p className="text-sm text-neutral-gray mb-6">
              API: {process.env.NEXT_PUBLIC_API_URL || 'https://api.mevrebels.rectorspace.com'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-rebellious text-white font-bold rounded-lg hover:bg-rebellious/90 transition-all cursor-pointer"
            >
              RETRY
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredStrategies.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              No strategies found
            </h3>
            <p className="text-neutral-gray mb-6">
              {strategies.length === 0
                ? 'No strategies have been created yet. Be the first!'
                : 'Try adjusting your filters or create a new strategy'}
            </p>
            <Link
              href="/strategies/create"
              className="inline-block px-6 py-3 bg-rebellious text-white font-bold rounded-lg hover:bg-rebellious/90 transition-all cursor-pointer"
            >
              CREATE FIRST STRATEGY
            </Link>
          </div>
        )}

        {/* Strategies List */}
        {!loading && !error && filteredStrategies.length > 0 && (
          <>
            <div className="mb-6 flex justify-between items-center">
              <p className="text-neutral-gray">
                Showing{' '}
                <span className="font-mono text-white font-semibold">
                  {filteredStrategies.length}
                </span>{' '}
                {filteredStrategies.length === 1 ? 'strategy' : 'strategies'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStrategies.map((strategy) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  onExecute={handleExecute}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
