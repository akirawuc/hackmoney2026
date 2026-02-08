'use client';

import { useState } from 'react';
import { formatUnits, parseUnits } from 'viem';
import { baseSepolia, arbitrumSepolia } from 'wagmi/chains';

interface BridgeQuote {
  fromAmount: bigint;
  toAmount: bigint;
  fee: bigint;
  estimatedTime: number;
  bridge: string;
}

const CHAINS = [
  { id: baseSepolia.id, name: 'Base Sepolia', icon: '🔵' },
  { id: arbitrumSepolia.id, name: 'Arb Sepolia', icon: '🔷' },
];

export function BridgePanel() {
  const [fromChain, setFromChain] = useState(CHAINS[0]);
  const [toChain, setToChain] = useState(CHAINS[1]);
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<BridgeQuote | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isBridging, setIsBridging] = useState(false);

  const handleSwapChains = () => {
    setFromChain(toChain);
    setToChain(fromChain);
    setQuote(null);
  };

  const handleGetQuote = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setIsQuoting(true);
    try {
      // Simulate quote fetch
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const fromAmount = parseUnits(amount, 6);
      const fee = (fromAmount * 5n) / 10000n; // 0.05%
      setQuote({
        fromAmount,
        toAmount: fromAmount - fee,
        fee,
        estimatedTime: 120,
        bridge: 'Stargate',
      });
    } finally {
      setIsQuoting(false);
    }
  };

  const handleBridge = async () => {
    if (!quote) return;

    setIsBridging(true);
    try {
      // Simulate bridge execution
      await new Promise((resolve) => setTimeout(resolve, 3000));
      setAmount('');
      setQuote(null);
    } finally {
      setIsBridging(false);
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6">
        Cross-Chain Bridge
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Bridge Form */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {/* From Chain */}
            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-2">From</label>
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-700 rounded-lg">
                <span className="text-xl">{fromChain.icon}</span>
                <span className="text-white">{fromChain.name}</span>
              </div>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwapChains}
              className="mt-6 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </button>

            {/* To Chain */}
            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-2">To</label>
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-700 rounded-lg">
                <span className="text-xl">{toChain.icon}</span>
                <span className="text-white">{toChain.name}</span>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Amount (USDC)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setQuote(null);
              }}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-slate-700 rounded-lg text-white text-lg font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleGetQuote}
              disabled={isQuoting || !amount}
              className="flex-1 px-6 py-3 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-colors"
            >
              {isQuoting ? 'Getting Quote...' : 'Get Quote'}
            </button>
            <button
              onClick={handleBridge}
              disabled={isBridging || !quote}
              className="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-colors"
            >
              {isBridging ? 'Bridging...' : 'Bridge'}
            </button>
          </div>
        </div>

        {/* Quote Details */}
        <div className="bg-slate-900/50 rounded-lg p-4">
          <h3 className="text-slate-300 font-medium mb-4">Quote Details</h3>
          {quote ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">You Send</span>
                <span className="text-white font-mono">
                  {formatUnits(quote.fromAmount, 6)} USDC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">You Receive</span>
                <span className="text-green-400 font-mono">
                  {formatUnits(quote.toAmount, 6)} USDC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bridge Fee</span>
                <span className="text-slate-300 font-mono">
                  {formatUnits(quote.fee, 6)} USDC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated Time</span>
                <span className="text-slate-300">~{quote.estimatedTime}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bridge</span>
                <span className="text-slate-300">{quote.bridge}</span>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-700">
                <p className="text-xs text-slate-500">
                  Powered by LI.FI - aggregating the best bridge routes
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-slate-500">
              Enter an amount and get a quote
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
