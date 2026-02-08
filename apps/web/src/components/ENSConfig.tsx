'use client';

import { useState } from 'react';
import { ENSConfigLoader } from '@agentflow/ens';

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

export function ENSConfig() {
  const [ensName, setEnsName] = useState('');
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [configJson, setConfigJson] = useState<string | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);

  const handleLoad = async () => {
    if (!ensName.trim()) return;
    setLoadState('loading');

    try {
      const loader = new ENSConfigLoader();
      const [config, address] = await Promise.all([
        loader.loadConfig(ensName),
        loader.resolveAddress(ensName),
      ]);

      const display = JSON.stringify(
        {
          ...config,
          riskLimits: {
            ...config.riskLimits,
            maxTradeSize: config.riskLimits.maxTradeSize.toString(),
            maxDailyVolume: config.riskLimits.maxDailyVolume.toString(),
          },
          yellowSession: {
            ...config.yellowSession,
            depositAmount: config.yellowSession.depositAmount.toString(),
            settlementThreshold: config.yellowSession.settlementThreshold.toString(),
          },
        },
        null,
        2
      );

      setConfigJson(display);
      setResolvedAddress(address);
      setLoadState('loaded');
    } catch {
      setLoadState('error');
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">ENS Config</h2>

      <div className="flex gap-2">
        <input
          type="text"
          value={ensName}
          onChange={(e) => setEnsName(e.target.value)}
          placeholder="agent.eth"
          className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-primary-500"
          onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
        />
        <button
          onClick={handleLoad}
          disabled={loadState === 'loading' || !ensName.trim()}
          className="px-3 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loadState === 'loading' ? '...' : 'Load'}
        </button>
      </div>

      {resolvedAddress && (
        <p className="text-slate-400 text-xs mt-2 font-mono">
          {resolvedAddress.slice(0, 6)}...{resolvedAddress.slice(-4)}
        </p>
      )}

      {loadState === 'loaded' && configJson && (
        <div className="mt-3">
          <p className="text-slate-400 text-xs mb-1">
            {resolvedAddress ? 'Loaded from ENS' : 'Using default configuration'}
          </p>
          <pre className="bg-slate-900/50 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto max-h-40 overflow-y-auto">
            {configJson}
          </pre>
        </div>
      )}

      {loadState === 'error' && (
        <p className="text-red-400 text-xs mt-2">Failed to load config. Using defaults.</p>
      )}
    </div>
  );
}
