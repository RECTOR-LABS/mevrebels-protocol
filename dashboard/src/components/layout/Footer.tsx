'use client';

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-midnight-black/50">
      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold">
                <span className="text-rebellious">MEV</span>
                <span className="text-white">rebels</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Democratizing MEV through decentralized arbitrage. Reclaim MEV. Power to the People.
            </p>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/RECTOR-LABS/mevrebels-protocol"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-rebellious transition-colors"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href="https://twitter.com/rz1989sol"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-rebellious transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/strategies" className="text-sm text-muted-foreground hover:text-rebellious transition-colors">
                  Strategies
                </Link>
              </li>
              <li>
                <Link href="/strategies/create" className="text-sm text-muted-foreground hover:text-rebellious transition-colors">
                  Create Strategy
                </Link>
              </li>
              <li>
                <Link href="/governance" className="text-sm text-muted-foreground hover:text-rebellious transition-colors">
                  Governance
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="text-sm text-muted-foreground hover:text-rebellious transition-colors">
                  Analytics
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/pitch-deck" className="text-sm text-muted-foreground hover:text-rebellious transition-colors">
                  Pitch Deck
                </Link>
              </li>
              <li>
                <Link href="/api-docs" className="text-sm text-muted-foreground hover:text-rebellious transition-colors">
                  API Docs
                </Link>
              </li>
              <li>
                <a
                  href="https://api.mevrebels.rectorspace.com/health"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-rebellious transition-colors"
                >
                  API Status
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/RECTOR-LABS/mevrebels-protocol"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-rebellious transition-colors"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Community Column */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">Community</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://docs.rectorspace.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-rebellious transition-colors"
                >
                  RECTOR LABS
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/rz1989sol"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-rebellious transition-colors"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://earn.superteam.fun"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-rebellious transition-colors"
                >
                  Superteam Earn
                </a>
              </li>
              <li>
                <a
                  href="https://solana.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-rebellious transition-colors"
                >
                  Solana Ecosystem
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground text-center md:text-left">
              © {currentYear} MEVrebels Protocol. Built by{' '}
              <a
                href="https://github.com/rz1989s"
                target="_blank"
                rel="noopener noreferrer"
                className="text-rebellious hover:underline"
              >
                RECTOR
              </a>
              {' '}at{' '}
              <a
                href="https://docs.rectorspace.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-rebellious hover:underline"
              >
                RECTOR LABS
              </a>
              . All rights reserved.
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap justify-center">
              <span className="font-mono text-xs px-3 py-1 bg-profit-green/20 border border-profit-green/50 rounded text-profit-green">
                ✓ Auto-Deploy Live
              </span>
              <span className="font-mono text-xs px-3 py-1 bg-trust-blue/20 border border-trust-blue/50 rounded text-trust-blue">
                {process.env.NEXT_PUBLIC_GIT_BRANCH || 'main'}
              </span>
              <span className="font-mono text-xs px-3 py-1 bg-warning-orange/20 border border-warning-orange/50 rounded text-warning-orange">
                {process.env.NEXT_PUBLIC_GIT_COMMIT_HASH?.substring(0, 7) || 'unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
