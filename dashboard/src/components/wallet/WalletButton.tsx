'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { FC } from 'react';

export const WalletButton: FC = () => {
  const { publicKey } = useWallet();

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
