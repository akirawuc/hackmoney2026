'use client';

import { useState, useCallback } from 'react';

type ActivityType = 'strategy_eval' | 'trade' | 'bridge' | 'session' | 'authorization';

interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  status: 'success' | 'pending' | 'error' | 'info';
  timestamp: number;
  txHash?: string;
}

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  strategy_eval: '\u2699\uFE0F',
  trade: '\uD83D\uDCC8',
  bridge: '\uD83C\uDF09',
  session: '\uD83D\uDD10',
  authorization: '\uD83D\uDD11',
};

const STATUS_STYLES: Record<string, string> = {
  success: 'bg-green-500/20 text-green-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  error: 'bg-red-500/20 text-red-400',
  info: 'bg-blue-500/20 text-blue-400',
};

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: '1',
    type: 'authorization',
    description: 'Agent authorized on AgentFlowHook (Base Sepolia)',
    status: 'success',
    timestamp: Date.now() - 300000,
    txHash: '0x6d8d177010eA33c8A83246A5546C5C6bab5e8e41',
  },
  {
    id: '2',
    type: 'session',
    description: 'Yellow Network session initialized',
    status: 'success',
    timestamp: Date.now() - 240000,
  },
  {
    id: '3',
    type: 'strategy_eval',
    description: 'Portfolio Rebalancer: Portfolio within target allocation',
    status: 'info',
    timestamp: Date.now() - 120000,
  },
  {
    id: '4',
    type: 'strategy_eval',
    description: 'Cross-Chain Arbitrage: No profitable opportunity (spread < 10bps)',
    status: 'info',
    timestamp: Date.now() - 60000,
  },
  {
    id: '5',
    type: 'bridge',
    description: 'LI.FI quote fetched: Base USDC -> Arbitrum USDC via Stargate',
    status: 'pending',
    timestamp: Date.now() - 30000,
  },
];

function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

export function useActivityLog() {
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);

  const addActivity = useCallback(
    (type: ActivityType, description: string, status: Activity['status'], txHash?: string) => {
      setActivities((prev) => [
        {
          id: String(Date.now()),
          type,
          description,
          status,
          timestamp: Date.now(),
          txHash,
        },
        ...prev,
      ]);
    },
    []
  );

  return { activities, addActivity };
}

export function ActivityLog({
  activities,
}: {
  activities: Activity[];
}) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Activity Log</h2>
        <span className="text-slate-500 text-xs">{activities.length} entries</span>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg"
          >
            <span className="text-lg mt-0.5">{ACTIVITY_ICONS[activity.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm truncate">{activity.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-500 text-xs">
                  {formatTimestamp(activity.timestamp)}
                </span>
                {activity.txHash && (
                  <a
                    href={`https://sepolia.basescan.org/tx/${activity.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 text-xs hover:underline"
                  >
                    tx
                  </a>
                )}
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-xs whitespace-nowrap ${STATUS_STYLES[activity.status]}`}
            >
              {activity.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
