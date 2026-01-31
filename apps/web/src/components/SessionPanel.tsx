'use client';

import { useState } from 'react';
import { formatUnits, parseUnits } from 'viem';

interface SessionState {
  id: string;
  status: 'opening' | 'active' | 'settling' | 'closed';
  deposit: bigint;
  balance: bigint;
  trades: number;
}

export function SessionPanel() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [depositAmount, setDepositAmount] = useState('100');
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenSession = async () => {
    setIsLoading(true);
    try {
      // Simulate session opening
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const deposit = parseUnits(depositAmount, 6);
      setSession({
        id: `session-${Date.now()}`,
        status: 'active',
        deposit,
        balance: deposit,
        trades: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettleSession = async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      setSession({ ...session, status: 'settling' });
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSession({ ...session, status: 'closed' });
      setTimeout(() => setSession(null), 1000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Yellow Session</h2>
        {session && (
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              session.status === 'active'
                ? 'bg-green-500/20 text-green-400'
                : session.status === 'settling'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-slate-500/20 text-slate-400'
            }`}
          >
            {session.status}
          </span>
        )}
      </div>

      {!session ? (
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">
            Open a Yellow Network session for gasless high-frequency trading.
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="USDC amount"
              className="flex-1 px-4 py-2 bg-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleOpenSession}
              disabled={isLoading}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              {isLoading ? 'Opening...' : 'Open Session'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-slate-400 text-sm">Deposited</p>
              <p className="text-white font-mono text-lg">
                {formatUnits(session.deposit, 6)} USDC
              </p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-slate-400 text-sm">Balance</p>
              <p className="text-white font-mono text-lg">
                {formatUnits(session.balance, 6)} USDC
              </p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-slate-400 text-sm">Trades</p>
              <p className="text-white font-mono text-lg">{session.trades}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-slate-400 text-sm">Gas Saved</p>
              <p className="text-green-400 font-mono text-lg">
                ~${(session.trades * 0.5).toFixed(2)}
              </p>
            </div>
          </div>

          {session.status === 'active' && (
            <button
              onClick={handleSettleSession}
              disabled={isLoading}
              className="w-full px-6 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
            >
              {isLoading ? 'Settling...' : 'Settle Session'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
