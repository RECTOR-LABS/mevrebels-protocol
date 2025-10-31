'use client';

import { Strategy } from '@/types/strategy';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface StrategyCardProps {
  strategy: Strategy;
  onExecute: (strategyId: string) => void;
}

export function StrategyCard({ strategy, onExecute }: StrategyCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative bg-gradient-to-br from-midnight-black to-midnight-black/80 border border-border rounded-lg overflow-hidden transition-all duration-300 hover:border-rebellious hover:scale-[1.02] hover:shadow-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Top Border */}
      <div
        className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rebellious to-transparent transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Status Badge */}
      <div className="absolute top-4 right-4">
        {strategy.status === 'active' ? (
          <div className="flex items-center gap-2 px-3 py-1 bg-profit-green/20 border border-profit-green/50 rounded-full">
            <div className="w-2 h-2 bg-profit-green rounded-full animate-pulse" />
            <span className="text-xs font-mono text-profit-green uppercase">
              LIVE
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 bg-warning-orange/20 border border-warning-orange/50 rounded-full">
            <div className="w-2 h-2 bg-warning-orange rounded-full" />
            <span className="text-xs font-mono text-warning-orange uppercase">
              {strategy.status}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-rebellious transition-colors">
            {strategy.name}
          </h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-neutral-gray">by</span>
            <span className="font-mono text-trust-blue">{strategy.creator}</span>
          </div>
        </div>

        {/* DEXes & Token Pairs */}
        <div className="flex flex-wrap gap-2">
          {strategy.dexes.map((dex) => (
            <span
              key={dex}
              className="px-2 py-1 text-xs font-mono bg-trust-blue/20 text-trust-blue border border-trust-blue/30 rounded uppercase"
            >
              {dex}
            </span>
          ))}
          {strategy.tokenPairs.map((pair: any, idx: number) => {
            // Handle both object format {tokenA, tokenB} and string format
            if (typeof pair === 'object' && pair.tokenA && pair.tokenB) {
              const tokenAShort = pair.tokenA.slice(0, 4) + '...' + pair.tokenA.slice(-4);
              const tokenBShort = pair.tokenB.slice(0, 4) + '...' + pair.tokenB.slice(-4);
              return (
                <span
                  key={`${pair.tokenA}-${pair.tokenB}-${idx}`}
                  className="px-2 py-1 text-xs font-mono bg-midnight-black/50 text-neutral-gray border border-border rounded"
                  title={`${pair.tokenA} / ${pair.tokenB}`}
                >
                  {tokenAShort} / {tokenBShort}
                </span>
              );
            }
            // Fallback for string format
            return (
              <span
                key={`${pair}-${idx}`}
                className="px-2 py-1 text-xs font-mono bg-midnight-black/50 text-neutral-gray border border-border rounded"
              >
                {pair}
              </span>
            );
          })}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-border">
          <div className="text-center">
            <div className="text-2xl font-black font-mono text-profit-green">
              {(strategy.totalProfit / 1_000_000_000).toFixed(2)} SOL
            </div>
            <div className="text-xs text-neutral-gray uppercase mt-1">
              Total Profit
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black font-mono text-white">
              {strategy.executionCount}
            </div>
            <div className="text-xs text-neutral-gray uppercase mt-1">
              Executions
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black font-mono text-trust-blue">
              {strategy.successRate.toFixed(1)}%
            </div>
            <div className="text-xs text-neutral-gray uppercase mt-1">
              Success Rate
            </div>
          </div>
        </div>

        {/* Strategy Params */}
        <div className="flex justify-between text-sm">
          <div>
            <span className="text-neutral-gray">Min Profit:</span>{' '}
            <span className="font-mono text-white font-semibold">
              {(strategy.profitThreshold / 100).toFixed(2)}%
            </span>
          </div>
          <div>
            <span className="text-neutral-gray">Max Slippage:</span>{' '}
            <span className="font-mono text-white font-semibold">
              {(strategy.maxSlippage / 100).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Last Executed */}
        {strategy.lastExecuted && (
          <div className="text-xs text-neutral-gray flex items-center gap-2">
            <span>⚡ Last executed</span>
            <span className="font-mono text-trust-blue">
              {formatDistanceToNow(strategy.lastExecuted, { addSuffix: true })}
            </span>
          </div>
        )}

        {/* Execute Button */}
        {strategy.status === 'active' && (
          <button
            onClick={() => onExecute(strategy.id)}
            className="w-full py-3 px-4 bg-rebellious text-white font-bold rounded-lg hover:bg-rebellious/90 transition-all hover:shadow-lg hover:shadow-rebellious/50 active:scale-95 cursor-pointer"
          >
            EXECUTE STRATEGY
          </button>
        )}
      </div>

      {/* Hover Glow Effect */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-br from-rebellious/5 to-transparent pointer-events-none" />
      )}
    </div>
  );
}
