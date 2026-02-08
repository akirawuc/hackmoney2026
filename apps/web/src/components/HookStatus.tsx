'use client';

import { useAccount, useReadContract } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { formatEther } from 'viem';
import {
  AGENT_FLOW_HOOK_ABI,
  DEPLOYED_ADDRESSES,
  BLOCK_EXPLORERS,
} from '@/contracts/AgentFlowHook';

const hookAddress = DEPLOYED_ADDRESSES[84532];

export function HookStatus() {
  const { address } = useAccount();

  const { data: owner } = useReadContract({
    address: hookAddress,
    abi: AGENT_FLOW_HOOK_ABI,
    functionName: 'owner',
    chainId: baseSepolia.id,
  });

  const { data: maxSwapSize } = useReadContract({
    address: hookAddress,
    abi: AGENT_FLOW_HOOK_ABI,
    functionName: 'maxSwapSize',
    chainId: baseSepolia.id,
  });

  const { data: dailyVolumeLimit } = useReadContract({
    address: hookAddress,
    abi: AGENT_FLOW_HOOK_ABI,
    functionName: 'dailyVolumeLimit',
    chainId: baseSepolia.id,
  });

  const { data: isAuthorized } = useReadContract({
    address: hookAddress,
    abi: AGENT_FLOW_HOOK_ABI,
    functionName: 'authorizedAgents',
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
    query: { enabled: !!address },
  });

  const { data: remainingVolume } = useReadContract({
    address: hookAddress,
    abi: AGENT_FLOW_HOOK_ABI,
    functionName: 'getRemainingDailyVolume',
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
    query: { enabled: !!address },
  });

  const explorerUrl = `${BLOCK_EXPLORERS[84532]}/address/${hookAddress}`;

  return (
    <div className="bg-slate-800/50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Hook Status</h2>
        <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
          Base Sepolia
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Contract</span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-400 text-sm font-mono hover:underline"
          >
            {hookAddress.slice(0, 6)}...{hookAddress.slice(-4)}
          </a>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Owner</span>
          <span className="text-white text-sm font-mono">
            {owner ? `${(owner as string).slice(0, 6)}...${(owner as string).slice(-4)}` : '...'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Max Swap Size</span>
          <span className="text-white text-sm font-mono">
            {maxSwapSize ? `${formatEther(maxSwapSize as bigint)} ETH` : '...'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 text-sm">Daily Volume Limit</span>
          <span className="text-white text-sm font-mono">
            {dailyVolumeLimit
              ? `${formatEther(dailyVolumeLimit as bigint)} ETH`
              : '...'}
          </span>
        </div>

        {address && (
          <>
            <div className="border-t border-slate-700 pt-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Your Agent Status</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    isAuthorized
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {isAuthorized ? 'Authorized' : 'Not Authorized'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Remaining Daily Volume</span>
              <span className="text-white text-sm font-mono">
                {remainingVolume !== undefined
                  ? `${formatEther(remainingVolume as bigint)} ETH`
                  : '...'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
