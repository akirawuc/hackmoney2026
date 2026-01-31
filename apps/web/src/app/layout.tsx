import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Inter } from 'next/font/google';
import './globals.css';

const Providers = dynamic(() => import('@/components/Providers').then(m => m.Providers), {
  ssr: false,
});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AgentFlow DeFi',
  description: 'Autonomous AI-powered cross-chain DeFi agent platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
