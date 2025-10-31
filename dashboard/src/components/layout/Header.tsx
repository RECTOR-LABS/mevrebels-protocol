'use client';

import Link from 'next/link';
import { WalletButton } from '../wallet/WalletButton';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href="/" className="mr-6 flex items-center space-x-2 cursor-pointer">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold">
              <span className="text-rebellious">MEV</span>
              <span className="text-white">rebels</span>
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-6 text-sm font-medium flex-1">
          <Link
            href="/strategies"
            className="transition-colors hover:text-rebellious text-foreground/60 cursor-pointer"
          >
            Strategies
          </Link>
          <Link
            href="/governance"
            className="transition-colors hover:text-rebellious text-foreground/60 cursor-pointer"
          >
            Governance
          </Link>
          <Link
            href="/analytics"
            className="transition-colors hover:text-rebellious text-foreground/60 cursor-pointer"
          >
            Analytics
          </Link>
        </nav>

        {/* Wallet Button */}
        <div className="flex items-center space-x-4">
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
