import { type Chain } from 'viem';
import { baseSepolia, arbitrumSepolia } from 'viem/chains';

export const SUPPORTED_CHAINS = {
  base: {
    ...baseSepolia,
    rpcUrls: {
      default: {
        http: ['https://sepolia.base.org'],
      },
    },
  },
  arbitrum: {
    ...arbitrumSepolia,
    rpcUrls: {
      default: {
        http: ['https://sepolia-rollup.arbitrum.io/rpc'],
      },
    },
  },
} as const satisfies Record<string, Chain>;

export const CHAIN_IDS = {
  base: 84532,
  arbitrum: 421614,
} as const;

export const TOKEN_ADDRESSES = {
  [CHAIN_IDS.base]: {
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const,
    WETH: '0x4200000000000000000000000000000000000006' as const,
  },
  [CHAIN_IDS.arbitrum]: {
    USDC: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' as const,
    WETH: '0x980B62Da83eFf3D4576C647993b0c1D7faf17c73' as const,
  },
} as const;

export function getChainById(chainId: number): Chain | undefined {
  return Object.values(SUPPORTED_CHAINS).find((c) => c.id === chainId);
}

export function getTokenAddress(
  chainId: number,
  symbol: 'USDC' | 'WETH'
): `0x${string}` | undefined {
  const tokens = TOKEN_ADDRESSES[chainId as keyof typeof TOKEN_ADDRESSES];
  return tokens?.[symbol];
}
