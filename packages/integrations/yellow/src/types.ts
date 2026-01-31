import type { Address, Hash } from 'viem';

export interface YellowConfig {
  rpcUrl: string;
  clearingHouseAddress: Address;
  chainId: number;
}

export interface SessionState {
  id: string;
  channelId: Hash;
  participant: Address;
  deposit: bigint;
  balance: bigint;
  nonce: bigint;
  status: 'opening' | 'active' | 'settling' | 'closed';
  createdAt: number;
  lastActivity: number;
}

export interface TradeParams {
  fromToken: Address;
  toToken: Address;
  amount: bigint;
  minOutput: bigint;
  deadline: number;
}

export interface TradeResult {
  success: boolean;
  nonce: bigint;
  inputAmount: bigint;
  outputAmount: bigint;
  newBalance: bigint;
  signature: Hash;
  timestamp: number;
}

export interface SettlementResult {
  success: boolean;
  txHash: Hash;
  finalBalance: bigint;
  settledAt: number;
}

export interface ChannelState {
  channelId: Hash;
  balances: [bigint, bigint];
  nonce: bigint;
  isFinal: boolean;
}
