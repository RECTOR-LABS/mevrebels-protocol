import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pitch Deck | MEVrebels - Democratizing MEV on Solana',
  description: 'MEVrebels investor pitch deck: First decentralized MEV marketplace on Solana with $2.8B market opportunity. 4 deployed programs, production backend, 83% test coverage.',
  keywords: [
    'MEV',
    'Solana',
    'arbitrage',
    'DeFi',
    'DAO',
    'flash loans',
    'decentralized',
    'pitch deck',
    'investor presentation',
    'blockchain',
  ],
  openGraph: {
    title: 'MEVrebels Pitch Deck - Democratizing $2.8B MEV Market',
    description: 'First decentralized MEV marketplace on Solana. 23 days from idea to production with 4 deployed programs and real backend infrastructure.',
    url: 'https://mevrebels.rectorspace.com/pitch-deck',
    siteName: 'MEVrebels',
    images: [
      {
        url: '/og-pitch-deck.png',
        width: 1200,
        height: 630,
        alt: 'MEVrebels Pitch Deck - Democratizing MEV',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MEVrebels Pitch Deck - Democratizing $2.8B MEV Market',
    description: 'First decentralized MEV marketplace on Solana with DAO governance and flash loan arbitrage.',
    images: ['/og-pitch-deck.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function PitchDeckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
