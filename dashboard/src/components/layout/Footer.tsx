'use client';

export function Footer() {
  return (
    <footer className="border-t border-border py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with <span className="text-rebellious">♥</span> by the MEVrebels community.{' '}
            <span className="font-medium">Reclaim MEV. Power to the People.</span>
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <a
            href="https://github.com/RECTOR-LABS/mevrebels-protocol"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-rebellious transition-colors cursor-pointer"
          >
            GitHub
          </a>
          <a
            href="/docs"
            className="text-muted-foreground hover:text-rebellious transition-colors cursor-pointer"
          >
            Docs
          </a>
        </div>
      </div>
    </footer>
  );
}
