'use client';

import { useState, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { AgentEngine } from '@agentflow/core';
import type { AgentConfig, PortfolioState, Decision } from '@agentflow/core';

interface StrategyUI {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  lastRun?: string;
  lastDecision?: string;
}

const DEFAULT_STRATEGIES: StrategyUI[] = [
  {
    id: 'rebalance',
    name: 'Portfolio Rebalancer',
    description: 'Maintains target allocation across chains and tokens',
    enabled: true,
  },
  {
    id: 'arbitrage',
    name: 'Cross-Chain Arbitrage',
    description: 'Captures price differences between Base and Arbitrum',
    enabled: true,
  },
  {
    id: 'yield',
    name: 'Yield Optimizer',
    description: 'Deploys idle assets to yield protocols',
    enabled: false,
  },
];

function buildConfig(strategies: StrategyUI[]): AgentConfig {
  const isEnabled = (id: string) => strategies.find((s) => s.id === id)?.enabled ?? false;
  return {
    strategies: {
      rebalance: {
        enabled: isEnabled('rebalance'),
        targetAllocations: {
          '84532:USDC': 40,
          '84532:WETH': 30,
          '421614:USDC': 20,
          '421614:WETH': 10,
        },
        rebalanceThreshold: 5,
      },
      arbitrage: {
        enabled: isEnabled('arbitrage'),
        minProfitBps: 10,
        maxSlippageBps: 50,
      },
      yield: {
        enabled: isEnabled('yield'),
        minApy: 3,
        protocols: ['aave', 'compound'],
      },
    },
    riskLimits: {
      maxTradeSize: BigInt('1000000000'),
      maxDailyVolume: BigInt('10000000000'),
      maxSlippage: 1,
    },
    yellowSession: {
      autoDeposit: true,
      depositAmount: BigInt('500000000'),
      settlementThreshold: BigInt('100000000'),
    },
  };
}

function buildPortfolioState(address: string): PortfolioState {
  return {
    address: address as `0x${string}`,
    balances: {
      84532: [
        {
          token: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
          symbol: 'USDC',
          decimals: 6,
          balance: BigInt('500000000'),
          valueUsd: 500,
        },
        {
          token: '0x4200000000000000000000000000000000000006',
          symbol: 'WETH',
          decimals: 18,
          balance: BigInt('150000000000000000'),
          valueUsd: 375,
        },
      ],
      421614: [
        {
          token: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
          symbol: 'USDC',
          decimals: 6,
          balance: BigInt('250000000'),
          valueUsd: 250,
        },
        {
          token: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73',
          symbol: 'WETH',
          decimals: 18,
          balance: BigInt('50000000000000000'),
          valueUsd: 125,
        },
      ],
    },
    totalValueUsd: 1250,
    lastUpdated: Date.now(),
  };
}

function formatDecision(d: Decision): string {
  const action = d.action.charAt(0).toUpperCase() + d.action.slice(1);
  return `${action}: ${d.reason} (confidence: ${(d.confidence * 100).toFixed(0)}%)`;
}

export function StrategyPanel({
  onStrategyRun,
}: {
  onStrategyRun?: (decisions: Decision[]) => void;
} = {}) {
  const { address } = useAccount();
  const [strategies, setStrategies] = useState(DEFAULT_STRATEGIES);
  const [isRunning, setIsRunning] = useState(false);
  const engineRef = useRef<AgentEngine | null>(null);

  const getEngine = useCallback(
    (strats: StrategyUI[]) => {
      const config = buildConfig(strats);
      return new AgentEngine(config);
    },
    []
  );

  const toggleStrategy = (id: string) => {
    setStrategies((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleRunOnce = async () => {
    setIsRunning(true);
    try {
      const engine = getEngine(strategies);
      engineRef.current = engine;

      const state = buildPortfolioState(
        address || '0x0000000000000000000000000000000000000000'
      );
      const decisions = await engine.evaluateStrategies(state);

      setStrategies((prev) =>
        prev.map((s) => {
          if (!s.enabled) return s;
          const decision = decisions.find((d) => d.strategy.toLowerCase().includes(s.id));
          return {
            ...s,
            lastRun: 'Just now',
            lastDecision: decision
              ? formatDecision(decision)
              : 'Evaluated - no action needed',
          };
        })
      );

      onStrategyRun?.(decisions);
    } catch (err) {
      console.error('Strategy evaluation failed:', err);
      setStrategies((prev) =>
        prev.map((s) =>
          s.enabled ? { ...s, lastRun: 'Just now', lastDecision: 'Error during evaluation' } : s
        )
      );
    } finally {
      setIsRunning(false);
    }
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
                <p className="text-slate-400 text-sm mt-1">{strategy.description}</p>
                {strategy.lastRun && (
                  <div className="mt-3 flex gap-4 text-xs">
                    <span className="text-slate-500">Last run: {strategy.lastRun}</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-400">{strategy.lastDecision}</span>
                  </div>
                )}
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
