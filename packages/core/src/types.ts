import { type Address, type Hash } from 'viem';

export type ChainId = 8453 | 42161; // Base | Arbitrum

export interface TokenBalance {
  token: Address;
  symbol: string;
  decimals: number;
  balance: bigint;
  valueUsd: number;
}

export interface PortfolioState {
  address: Address;
  balances: Record<ChainId, TokenBalance[]>;
  totalValueUsd: number;
  lastUpdated: number;
}

export interface Decision {
  id: string;
  strategy: string;
  action: 'swap' | 'bridge' | 'rebalance' | 'hold';
  fromChain: ChainId;
  toChain: ChainId;
  fromToken: Address;
  toToken: Address;
  amount: bigint;
  reason: string;
  confidence: number;
  priority: number;
}

export interface ExecutionResult {
  success: boolean;
  txHash?: Hash;
  error?: string;
  gasUsed?: bigint;
  executedAt: number;
}

export interface Strategy {
  name: string;
  enabled: boolean;
  evaluate(state: PortfolioState): Decision | null;
  execute(decision: Decision): Promise<ExecutionResult>;
}

export interface AgentConfig {
  strategies: {
    rebalance: {
      enabled: boolean;
      targetAllocations: Record<string, number>;
      rebalanceThreshold: number;
    };
    arbitrage: {
      enabled: boolean;
      minProfitBps: number;
      maxSlippageBps: number;
    };
    yield: {
      enabled: boolean;
      minApy: number;
      protocols: string[];
    };
  };
  riskLimits: {
    maxTradeSize: bigint;
    maxDailyVolume: bigint;
    maxSlippage: number;
  };
  yellowSession: {
    autoDeposit: boolean;
    depositAmount: bigint;
    settlementThreshold: bigint;
  };
}

export interface Session {
  id: string;
  channelId: Hash;
  deposit: bigint;
  balance: bigint;
  status: 'opening' | 'active' | 'settling' | 'closed';
  createdAt: number;
}

export interface Trade {
  fromToken: Address;
  toToken: Address;
  amount: bigint;
  minOutput: bigint;
}

export interface TradeResult {
  success: boolean;
  inputAmount: bigint;
  outputAmount: bigint;
  executedPrice: bigint;
  timestamp: number;
}
