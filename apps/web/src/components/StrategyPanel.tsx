'use client';

import { useState } from 'react';

interface Strategy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  lastRun?: string;
  lastDecision?: string;
}

const DEFAULT_STRATEGIES: Strategy[] = [
  {
    id: 'rebalance',
    name: 'Portfolio Rebalancer',
    description: 'Maintains target allocation across chains and tokens',
    enabled: true,
    lastRun: '2 min ago',
    lastDecision: 'Portfolio within target - no action needed',
  },
  {
    id: 'arbitrage',
    name: 'Cross-Chain Arbitrage',
    description: 'Captures price differences between Base and Arbitrum',
    enabled: true,
    lastRun: '30 sec ago',
    lastDecision: 'No profitable opportunity (min: 10bps)',
  },
  {
    id: 'yield',
    name: 'Yield Optimizer',
    description: 'Deploys idle assets to yield protocols',
    enabled: false,
    lastRun: 'Never',
    lastDecision: 'Strategy disabled',
  },
];

export function StrategyPanel() {
  const [strategies, setStrategies] = useState(DEFAULT_STRATEGIES);
  const [isRunning, setIsRunning] = useState(false);

  const toggleStrategy = (id: string) => {
    setStrategies((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleRunOnce = async () => {
    setIsRunning(true);
    // Simulate strategy run
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setStrategies((prev) =>
      prev.map((s) =>
        s.enabled
          ? { ...s, lastRun: 'Just now', lastDecision: 'Evaluated - no action' }
          : s
      )
    );
    setIsRunning(false);
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Agent Strategies</h2>
        <button
          onClick={handleRunOnce}
          disabled={isRunning}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors"
        >
          {isRunning ? 'Running...' : 'Run Once'}
        </button>
      </div>

      <div className="space-y-4">
        {strategies.map((strategy) => (
          <div
            key={strategy.id}
            className={`p-4 rounded-lg border transition-colors ${
              strategy.enabled
                ? 'bg-slate-700/50 border-primary-500/30'
                : 'bg-slate-800/30 border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-white font-medium">{strategy.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      strategy.enabled
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-slate-600/50 text-slate-400'
                    }`}
                  >
                    {strategy.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-1">
                  {strategy.description}
                </p>
                <div className="mt-3 flex gap-4 text-xs">
                  <span className="text-slate-500">
                    Last run: {strategy.lastRun}
                  </span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">{strategy.lastDecision}</span>
                </div>
              </div>
              <button
                onClick={() => toggleStrategy(strategy.id)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  strategy.enabled ? 'bg-primary-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    strategy.enabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-slate-900/50 rounded-lg">
        <h4 className="text-slate-300 font-medium mb-2">Risk Limits</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Max Trade</p>
            <p className="text-white font-mono">1,000 USDC</p>
          </div>
          <div>
            <p className="text-slate-500">Daily Volume</p>
            <p className="text-white font-mono">10,000 USDC</p>
          </div>
          <div>
            <p className="text-slate-500">Max Slippage</p>
            <p className="text-white font-mono">1.0%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
