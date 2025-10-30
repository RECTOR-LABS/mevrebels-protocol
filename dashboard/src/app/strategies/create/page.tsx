'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const strategySchema = z.object({
  name: z
    .string()
    .min(5, 'Name must be at least 5 characters')
    .max(50, 'Name must be less than 50 characters'),
  dexes: z.array(z.string()).min(1, 'Select at least one DEX'),
  tokenPairs: z
    .string()
    .min(1, 'Enter at least one token pair')
    .refine(
      (val) => val.split(',').every((pair) => pair.trim().includes('/')),
      'Token pairs must be in format: TOKEN1/TOKEN2'
    ),
  profitThreshold: z
    .number()
    .min(0.1, 'Minimum profit threshold is 0.1%')
    .max(10, 'Maximum profit threshold is 10%'),
  maxSlippage: z
    .number()
    .min(0.1, 'Minimum slippage is 0.1%')
    .max(5, 'Maximum slippage is 5%'),
});

type StrategyFormData = z.infer<typeof strategySchema>;

const DEX_OPTIONS = ['Raydium', 'Orca', 'Meteora', 'Jupiter'];

export default function CreateStrategyPage() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<StrategyFormData>({
    resolver: zodResolver(strategySchema),
    defaultValues: {
      name: '',
      dexes: [],
      tokenPairs: '',
      profitThreshold: 0.5,
      maxSlippage: 1.0,
    },
  });

  const formValues = watch();

  const onSubmit = async (data: StrategyFormData) => {
    if (!connected || !publicKey) {
      alert('Please connect your wallet first!');
      return;
    }

    setIsSubmitting(true);

    // Simulate strategy creation (replace with actual Anchor transaction)
    try {
      console.log('Creating strategy:', data);

      // TODO: Build Anchor transaction
      // const tx = await program.methods.createStrategy(...)

      await new Promise((resolve) => setTimeout(resolve, 2000));

      alert('Strategy created successfully! Awaiting DAO approval.');
      router.push('/strategies');
    } catch (error) {
      console.error('Error creating strategy:', error);
      alert('Failed to create strategy. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Wallet Connection Required
          </h2>
          <p className="text-neutral-gray mb-6">
            Connect your wallet to create a strategy
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-br from-midnight-black to-midnight-black/50">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
            CREATE <span className="text-trust-blue">STRATEGY</span>
          </h1>
          <p className="text-neutral-gray">
            Design your arbitrage strategy and submit it to the DAO for approval
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Strategy Name */}
            <div className="bg-midnight-black/50 border border-border rounded-lg p-6">
              <label className="block text-sm font-bold text-white uppercase tracking-wider mb-3">
                Strategy Name
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="e.g., SOL/USDC Triple DEX Arbitrage"
                className="w-full px-4 py-3 bg-midnight-black border border-border rounded-lg text-white placeholder:text-neutral-gray focus:border-rebellious focus:outline-none transition-colors"
              />
              {errors.name && (
                <p className="mt-2 text-sm text-rebellious">{errors.name.message}</p>
              )}
            </div>

            {/* DEX Selection */}
            <div className="bg-midnight-black/50 border border-border rounded-lg p-6">
              <label className="block text-sm font-bold text-white uppercase tracking-wider mb-3">
                Select DEXes
              </label>
              <div className="grid grid-cols-2 gap-3">
                {DEX_OPTIONS.map((dex) => (
                  <label
                    key={dex}
                    className="flex items-center gap-3 p-4 bg-midnight-black border border-border rounded-lg cursor-pointer hover:border-trust-blue transition-colors"
                  >
                    <input
                      type="checkbox"
                      value={dex}
                      {...register('dexes')}
                      className="w-5 h-5 accent-trust-blue"
                    />
                    <span className="text-white font-mono">{dex}</span>
                  </label>
                ))}
              </div>
              {errors.dexes && (
                <p className="mt-2 text-sm text-rebellious">{errors.dexes.message}</p>
              )}
            </div>

            {/* Token Pairs */}
            <div className="bg-midnight-black/50 border border-border rounded-lg p-6">
              <label className="block text-sm font-bold text-white uppercase tracking-wider mb-3">
                Token Pairs
              </label>
              <input
                {...register('tokenPairs')}
                type="text"
                placeholder="e.g., SOL/USDC, SOL/USDT"
                className="w-full px-4 py-3 bg-midnight-black border border-border rounded-lg text-white placeholder:text-neutral-gray focus:border-rebellious focus:outline-none transition-colors font-mono"
              />
              <p className="mt-2 text-xs text-neutral-gray">
                Separate multiple pairs with commas. Format: TOKEN1/TOKEN2
              </p>
              {errors.tokenPairs && (
                <p className="mt-2 text-sm text-rebellious">
                  {errors.tokenPairs.message}
                </p>
              )}
            </div>

            {/* Parameters */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Profit Threshold */}
              <div className="bg-midnight-black/50 border border-border rounded-lg p-6">
                <label className="block text-sm font-bold text-white uppercase tracking-wider mb-3">
                  Min Profit Threshold (%)
                </label>
                <input
                  {...register('profitThreshold', { valueAsNumber: true })}
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10"
                  className="w-full px-4 py-3 bg-midnight-black border border-border rounded-lg text-white placeholder:text-neutral-gray focus:border-profit-green focus:outline-none transition-colors font-mono text-2xl font-bold"
                />
                {errors.profitThreshold && (
                  <p className="mt-2 text-sm text-rebellious">
                    {errors.profitThreshold.message}
                  </p>
                )}
              </div>

              {/* Max Slippage */}
              <div className="bg-midnight-black/50 border border-border rounded-lg p-6">
                <label className="block text-sm font-bold text-white uppercase tracking-wider mb-3">
                  Max Slippage (%)
                </label>
                <input
                  {...register('maxSlippage', { valueAsNumber: true })}
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5"
                  className="w-full px-4 py-3 bg-midnight-black border border-border rounded-lg text-white placeholder:text-neutral-gray focus:border-warning-orange focus:outline-none transition-colors font-mono text-2xl font-bold"
                />
                {errors.maxSlippage && (
                  <p className="mt-2 text-sm text-rebellious">
                    {errors.maxSlippage.message}
                  </p>
                )}
              </div>
            </div>

            {/* Preview Section */}
            {showPreview && (
              <div className="bg-gradient-to-br from-trust-blue/10 to-midnight-black border-2 border-trust-blue rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  📋 Strategy Preview
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-gray">Name:</span>
                    <span className="text-white font-semibold">{formValues.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-gray">DEXes:</span>
                    <span className="text-white font-mono">
                      {formValues.dexes.join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-gray">Token Pairs:</span>
                    <span className="text-white font-mono">
                      {formValues.tokenPairs}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-gray">Min Profit:</span>
                    <span className="text-profit-green font-mono font-bold">
                      {formValues.profitThreshold}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-gray">Max Slippage:</span>
                    <span className="text-warning-orange font-mono font-bold">
                      {formValues.maxSlippage}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex-1 py-3 px-4 border-2 border-trust-blue text-trust-blue font-bold rounded-lg hover:bg-trust-blue hover:text-white transition-all cursor-pointer"
              >
                {showPreview ? 'HIDE PREVIEW' : 'PREVIEW STRATEGY'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-rebellious text-white font-bold rounded-lg hover:bg-rebellious/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-rebellious/50 cursor-pointer"
              >
                {isSubmitting ? 'SUBMITTING...' : 'SUBMIT TO DAO'}
              </button>
            </div>

            {/* Info Note */}
            <div className="bg-midnight-black/30 border border-border rounded-lg p-4">
              <p className="text-sm text-neutral-gray">
                ℹ️ Your strategy will be submitted to the DAO for approval. Token
                holders will vote on whether to activate it. You'll earn{' '}
                <span className="text-profit-green font-semibold">40%</span> of all
                profits generated by your strategy.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
