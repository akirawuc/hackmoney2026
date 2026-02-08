'use client';

import { useAccount, useBalance } from 'wagmi';
import { baseSepolia, arbitrumSepolia } from 'wagmi/chains';
import { formatUnits } from 'viem';

const TOKENS = {
  [baseSepolia.id]: {
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const,
    WETH: '0x4200000000000000000000000000000000000006' as const,
  },
  [arbitrumSepolia.id]: {
    USDC: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' as const,
    WETH: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73' as const,
  },
};

function TokenBalance({
  chainId,
  token,
  symbol,
  decimals,
}: {
  chainId: number;
  token: `0x${string}`;
  symbol: string;
  decimals: number;
}) {
  const { address } = useAccount();
  const { data: balance, isLoading } = useBalance({
    address,
    token,
    chainId,
  });

  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-slate-300">{symbol}</span>
      <span className="text-white font-mono">
        {isLoading
          ? '...'
          : balance
            ? formatUnits(balance.value, decimals).slice(0, 10)
            : '0.00'}
      </span>
    </div>
  );
}

function ChainCard({
  chainId,
  chainName,
  icon,
}: {
  chainId: number;
  chainName: string;
  icon: string;
}) {
  const { address } = useAccount();
  const { data: ethBalance } = useBalance({ address, chainId });
  const tokens = TOKENS[chainId as keyof typeof TOKENS];

  return (
    <div className="bg-slate-800/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{icon}</span>
        <h3 className="text-lg font-semibold text-white">{chainName}</h3>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between items-center py-2">
          <span className="text-slate-300">ETH</span>
          <span className="text-white font-mono">
            {ethBalance ? formatUnits(ethBalance.value, 18).slice(0, 10) : '0.00'}
          </span>
        </div>
        {tokens && (
          <>
            <TokenBalance
              chainId={chainId}
              token={tokens.USDC}
              symbol="USDC"
              decimals={6}
            />
            <TokenBalance
              chainId={chainId}
              token={tokens.WETH}
              symbol="WETH"
              decimals={18}
            />
          </>
        )}
      </div>
    </div>
  );
}

export function ChainBalances() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Portfolio</h2>
      <div className="grid gap-4">
        <ChainCard chainId={baseSepolia.id} chainName="Base Sepolia" icon="🔵" />
        <ChainCard chainId={arbitrumSepolia.id} chainName="Arbitrum Sepolia" icon="🔷" />
      </div>
    </div>
  );
}
