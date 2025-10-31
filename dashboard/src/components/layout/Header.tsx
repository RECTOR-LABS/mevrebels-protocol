'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletButton } from '../wallet/WalletButton';

export function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-midnight-black/95 backdrop-blur-xl supports-[backdrop-filter]:bg-midnight-black/90 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo with enhanced design */}
          <Link href="/" className="group flex items-center space-x-3 cursor-pointer">
            <div className="relative">
              {/* Logo Icon */}
              <div className="w-10 h-10 bg-gradient-to-br from-rebellious to-rebellious-red rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-xl font-black">M</span>
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-rebellious/30 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black leading-none">
                <span className="text-rebellious">MEV</span>
                <span className="text-white">rebels</span>
              </span>
              <span className="text-[10px] text-neutral-gray font-mono uppercase tracking-wider">
                Reclaim MEV
              </span>
            </div>
          </Link>

          {/* Navigation with enhanced styling */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/strategies"
              className={`
                relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300
                ${isActive('/strategies')
                  ? 'text-white bg-rebellious/20 border border-rebellious/50'
                  : 'text-foreground/60 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <span className="relative z-10">Strategies</span>
              {isActive('/strategies') && (
                <div className="absolute inset-0 bg-gradient-to-r from-rebellious/10 to-rebellious-red/10 rounded-lg" />
              )}
            </Link>
            <Link
              href="/governance"
              className={`
                relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300
                ${isActive('/governance')
                  ? 'text-white bg-rebellious/20 border border-rebellious/50'
                  : 'text-foreground/60 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <span className="relative z-10">Governance</span>
              {isActive('/governance') && (
                <div className="absolute inset-0 bg-gradient-to-r from-rebellious/10 to-rebellious-red/10 rounded-lg" />
              )}
            </Link>
            <Link
              href="/analytics"
              className={`
                relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300
                ${isActive('/analytics')
                  ? 'text-white bg-rebellious/20 border border-rebellious/50'
                  : 'text-foreground/60 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <span className="relative z-10">Analytics</span>
              {isActive('/analytics') && (
                <div className="absolute inset-0 bg-gradient-to-r from-rebellious/10 to-rebellious-red/10 rounded-lg" />
              )}
            </Link>

            {/* Divider */}
            <div className="w-px h-6 bg-border mx-2" />

            {/* Secondary Navigation */}
            <Link
              href="/pitch-deck"
              className={`
                px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300
                ${isActive('/pitch-deck')
                  ? 'text-white bg-trust-blue/20 border border-trust-blue/50'
                  : 'text-foreground/60 hover:text-trust-blue hover:bg-trust-blue/5'
                }
              `}
            >
              Pitch Deck
            </Link>
            <Link
              href="/api-docs"
              className={`
                px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300
                ${isActive('/api-docs')
                  ? 'text-white bg-trust-blue/20 border border-trust-blue/50'
                  : 'text-foreground/60 hover:text-trust-blue hover:bg-trust-blue/5'
                }
              `}
            >
              API Docs
            </Link>
          </nav>

          {/* Right Section: Status + Wallet */}
          <div className="flex items-center space-x-4">
            {/* API Status Indicator */}
            <a
              href="https://api.mevrebels.rectorspace.com/health"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-profit-green/10 border border-profit-green/30 rounded-lg hover:border-profit-green/50 transition-colors group"
            >
              <div className="relative">
                <div className="w-2 h-2 bg-profit-green rounded-full animate-pulse" />
                <div className="absolute inset-0 bg-profit-green rounded-full blur-sm" />
              </div>
              <span className="text-xs font-mono text-profit-green group-hover:text-white transition-colors">
                API Live
              </span>
            </a>

            {/* Wallet Button */}
            <WalletButton />
          </div>
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-rebellious/50 to-transparent" />
    </header>
  );
}
