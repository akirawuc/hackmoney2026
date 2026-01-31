import { type Chain } from 'viem';
import { base, arbitrum } from 'viem/chains';

export const SUPPORTED_CHAINS = {
  base: {
    ...base,
    rpcUrls: {
      default: {
        http: ['https://mainnet.base.org'],
      },
    },
  },
  arbitrum: {
    ...arbitrum,
    rpcUrls: {
      default: {
        http: ['https://arb1.arbitrum.io/rpc'],
      },
    },
  },
} as const satisfies Record<string, Chain>;

export const CHAIN_IDS = {
  base: 8453,
  arbitrum: 42161,
} as const;

export const TOKEN_ADDRESSES = {
  [CHAIN_IDS.base]: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const,
    WETH: '0x4200000000000000000000000000000000000006' as const,
  },
  [CHAIN_IDS.arbitrum]: {
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as const,
    WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as const,
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
