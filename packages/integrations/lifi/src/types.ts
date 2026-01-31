import type { Address, Hash } from 'viem';

export interface BridgeParams {
  fromChainId: number;
  toChainId: number;
  fromToken: Address;
  toToken: Address;
  fromAmount: bigint;
  fromAddress: Address;
  toAddress?: Address;
  slippage?: number;
}

export interface BridgeQuote {
  id: string;
  fromChainId: number;
  toChainId: number;
  fromToken: Address;
  toToken: Address;
  fromAmount: bigint;
  toAmount: bigint;
  toAmountMin: bigint;
  estimatedGas: bigint;
  estimatedTime: number;
  bridgeName: string;
  steps: BridgeStep[];
}

export interface BridgeStep {
  type: 'swap' | 'bridge' | 'approve';
  chainId: number;
  token: Address;
  amount: bigint;
  protocol: string;
}

export interface BridgeResult {
  success: boolean;
  txHash?: Hash;
  fromAmount: bigint;
  toAmount?: bigint;
  error?: string;
  executedAt: number;
}

export interface TokenInfo {
  address: Address;
  symbol: string;
  decimals: number;
  chainId: number;
  priceUsd: number;
}
