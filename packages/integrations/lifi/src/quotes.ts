import type { Address } from 'viem';
import type { BridgeParams, BridgeQuote } from './types';
import { CHAIN_IDS, TOKEN_ADDRESSES } from '@agentflow/core';

const LIFI_API_URL = 'https://li.quest/v1';

export async function getQuote(params: BridgeParams): Promise<BridgeQuote> {
  // For hackathon demo, use mock quotes
  // In production, would call LI.FI API
  const quote = await fetchLiFiQuote(params);
  return quote;
}

export async function getBridgeQuote(
  fromChainId: number,
  toChainId: number,
  fromToken: Address,
  toToken: Address,
  amount: bigint,
  fromAddress: Address
): Promise<BridgeQuote> {
  return getQuote({
    fromChainId,
    toChainId,
    fromToken,
    toToken,
    fromAmount: amount,
    fromAddress,
    slippage: 0.5,
  });
}

async function fetchLiFiQuote(params: BridgeParams): Promise<BridgeQuote> {
  try {
    // In production, would make actual API call:
    // const response = await fetch(`${LIFI_API_URL}/quote?...`);
    // return response.json();

    // For hackathon, return simulated quote
    return simulateQuote(params);
  } catch (error) {
    throw new Error(`Failed to fetch LI.FI quote: ${(error as Error).message}`);
  }
}

function simulateQuote(params: BridgeParams): BridgeQuote {
  // Simulate bridge quote
  const bridgeFee = (params.fromAmount * 5n) / 10000n; // 0.05% fee
  const toAmount = params.fromAmount - bridgeFee;
  const toAmountMin = (toAmount * 995n) / 1000n; // 0.5% slippage

  return {
    id: `quote-${Date.now()}`,
    fromChainId: params.fromChainId,
    toChainId: params.toChainId,
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromAmount: params.fromAmount,
    toAmount,
    toAmountMin,
    estimatedGas: 150000n,
    estimatedTime: 120, // 2 minutes
    bridgeName: 'stargate',
    steps: [
      {
        type: 'approve',
        chainId: params.fromChainId,
        token: params.fromToken,
        amount: params.fromAmount,
        protocol: 'lifi',
      },
      {
        type: 'bridge',
        chainId: params.fromChainId,
        token: params.fromToken,
        amount: params.fromAmount,
        protocol: 'stargate',
      },
    ],
  };
}

export function estimateBridgeTime(
  fromChainId: number,
  toChainId: number
): number {
  // Bridge time estimates in seconds
  const estimates: Record<string, number> = {
    '84532-421614': 120, // Base Sepolia -> Arbitrum Sepolia
    '421614-84532': 120, // Arbitrum Sepolia -> Base Sepolia
    '84532-1': 900, // Base Sepolia -> Ethereum
    '421614-1': 900, // Arbitrum Sepolia -> Ethereum
  };

  const key = `${fromChainId}-${toChainId}`;
  return estimates[key] || 300; // Default 5 minutes
}
