'use client';

import { WalletConnect } from '@/components/WalletConnect';
import { ChainBalances } from '@/components/ChainBalances';
import { SessionPanel } from '@/components/SessionPanel';
import { StrategyPanel } from '@/components/StrategyPanel';
import { BridgePanel } from '@/components/BridgePanel';
import { useAccount } from 'wagmi';

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">AgentFlow DeFi</h1>
            <p className="text-slate-400 mt-1">
              Autonomous AI-powered cross-chain DeFi agent
            </p>
          </div>
          <WalletConnect />
        </header>

        {isConnected ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Balances & Session */}
            <div className="space-y-6">
              <ChainBalances />
              <SessionPanel />
            </div>

            {/* Center Column - Strategy */}
            <div className="lg:col-span-2">
              <StrategyPanel />
            </div>

            {/* Full Width - Bridge */}
            <div className="lg:col-span-3">
              <BridgePanel />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-slate-800/50 rounded-2xl p-12 text-center max-w-md">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-slate-400 mb-6">
                Connect your wallet to access the AI-powered DeFi agent
                dashboard.
              </p>
              <WalletConnect />
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-slate-700">
          <div className="flex justify-between items-center text-sm text-slate-400">
            <p>Built for HackMoney 2026</p>
            <div className="flex gap-4">
              <span>Yellow Network</span>
              <span>LI.FI</span>
              <span>Uniswap v4</span>
              <span>ENS</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
