'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { FC, useState, useEffect } from 'react';

export const WalletButton: FC = () => {
  const { publicKey } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="wallet-button-wrapper">
        <button className="btn-rebellious opacity-0 px-4 py-2">
          Select Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-button-wrapper">
      <WalletMultiButton className="btn-rebellious hover:glow-red transition-all" />
      {publicKey && (
        <span className="text-xs text-neutral-gray font-mono ml-2">
          {publicKey.toString().slice(0, 4)}...
          {publicKey.toString().slice(-4)}
        </span>
      )}
    </div>
  );
};
