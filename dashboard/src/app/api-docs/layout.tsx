import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Documentation | MEVrebels - Developer Guide',
  description: 'Complete API reference for MEVrebels protocol: REST endpoints, WebSocket streams, authentication, and code examples in cURL, JavaScript, and Python.',
  keywords: [
    'MEVrebels API',
    'Solana API',
    'MEV API',
    'REST API',
    'WebSocket API',
    'blockchain API',
    'arbitrage API',
    'DeFi API',
    'developer documentation',
  ],
  openGraph: {
    title: 'MEVrebels API Documentation - Complete Developer Guide',
    description: 'REST + WebSocket API for strategies, executions, proposals, and analytics. Real-time MEV data on Solana.',
    url: 'https://mevrebels.rectorspace.com/api-docs',
    siteName: 'MEVrebels',
    images: [
      {
        url: '/og-api-docs.png',
        width: 1200,
        height: 630,
        alt: 'MEVrebels API Documentation',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MEVrebels API Documentation',
    description: 'Complete API reference with REST endpoints, WebSocket streams, and code examples.',
    images: ['/og-api-docs.png'],
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

export default function ApiDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
