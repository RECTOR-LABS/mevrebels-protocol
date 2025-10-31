import type { Metadata } from "next";
import "./globals.css";
import { SolanaWalletProvider } from "@/components/wallet/WalletProvider";
import { ToastProvider } from "@/components/ui/toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingActionButton } from "@/components/FloatingActionButton";

export const metadata: Metadata = {
  title: "MEVrebels - Democratizing MEV Through Decentralized Arbitrage",
  description: "Reclaim MEV. Power to the People. First decentralized MEV marketplace on Solana with DAO governance, flash loan arbitrage, and community-created strategies. $2.8B market opportunity.",
  keywords: [
    "MEV",
    "Solana",
    "arbitrage",
    "DeFi",
    "DAO",
    "flash loans",
    "decentralized",
    "MEV marketplace",
    "crypto trading",
    "blockchain",
  ],
  authors: [{ name: "MEVrebels Protocol" }],
  creator: "MEVrebels Protocol",
  publisher: "MEVrebels Protocol",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/logo.svg', sizes: '48x48', type: 'image/svg+xml' },
    ],
    apple: '/logo.svg',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mevrebels.rectorspace.com",
    title: "MEVrebels - Democratizing $2.8B MEV Market on Solana",
    description: "First decentralized MEV marketplace. Create strategies, earn royalties, execute with flash loans. No validator required. Community-governed.",
    siteName: "MEVrebels",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MEVrebels - Reclaim MEV. Power to the People.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MEVrebels - Democratizing MEV on Solana",
    description: "First decentralized MEV marketplace with DAO governance and flash loan arbitrage. $2.8B market opportunity.",
    images: ["/og-image.png"],
    creator: "@mevrebels",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        <SolanaWalletProvider>
          <ToastProvider>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <FloatingActionButton />
            </div>
          </ToastProvider>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
