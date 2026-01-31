import type { AgentConfig, Decision, ExecutionResult, PortfolioState, Strategy } from '../types';
import { CHAIN_IDS, TOKEN_ADDRESSES } from '../chains';

type YieldConfig = AgentConfig['strategies']['yield'];

interface YieldOpportunity {
  protocol: string;
  chainId: 8453 | 42161;
  token: `0x${string}`;
  apy: number;
  tvl: bigint;
}

export class YieldStrategy implements Strategy {
  name = 'yield';
  enabled: boolean;

  constructor(private config: YieldConfig) {
    this.enabled = config.enabled;
  }

  evaluate(state: PortfolioState): Decision | null {
    if (!this.enabled) {
      return null;
    }

    // Find best yield opportunities
    const opportunities = this.findYieldOpportunities();
    const best = opportunities
      .filter((o) => this.config.protocols.includes(o.protocol))
      .filter((o) => o.apy >= this.config.minApy)
      .sort((a, b) => b.apy - a.apy)[0];

    if (!best) {
      return null;
    }

    // Check if we have idle assets to deploy
    const idleBalance = this.findIdleBalance(state, best.chainId);
    if (!idleBalance || idleBalance.balance < 100000000n) {
      // Min 100 USDC
      return null;
    }

    const decision: Decision = {
      id: `yield-${Date.now()}`,
      strategy: this.name,
      action: 'swap', // Deposit into yield protocol
      fromChain: best.chainId,
      toChain: best.chainId,
      fromToken: idleBalance.token,
      toToken: best.token,
      amount: idleBalance.balance / 2n, // Deploy 50% of idle balance
      reason: `Deploy to ${best.protocol} for ${best.apy.toFixed(2)}% APY`,
      confidence: Math.min(best.apy / (this.config.minApy * 2), 1),
      priority: 3, // Lower priority than arbitrage
    };

    return decision;
  }

  private findYieldOpportunities(): YieldOpportunity[] {
    // Mock yield data - in production would query DeFi protocols
    return [
      {
        protocol: 'aave',
        chainId: CHAIN_IDS.base,
        token: TOKEN_ADDRESSES[CHAIN_IDS.base].USDC,
        apy: 5.2,
        tvl: 500000000000000n,
      },
      {
        protocol: 'compound',
        chainId: CHAIN_IDS.arbitrum,
        token: TOKEN_ADDRESSES[CHAIN_IDS.arbitrum].USDC,
        apy: 4.8,
        tvl: 300000000000000n,
      },
      {
        protocol: 'aave',
        chainId: CHAIN_IDS.arbitrum,
        token: TOKEN_ADDRESSES[CHAIN_IDS.arbitrum].WETH,
        apy: 2.1,
        tvl: 800000000000000n,
      },
    ];
  }

  private findIdleBalance(
    state: PortfolioState,
    chainId: 8453 | 42161
  ): { token: `0x${string}`; balance: bigint } | null {
    const balances = state.balances[chainId];
    if (!balances) return null;

    // Find USDC balance as it's typically used for yield
    const usdc = balances.find((b) => b.symbol === 'USDC');
    if (usdc && usdc.balance > 0n) {
      return { token: usdc.token, balance: usdc.balance };
    }

    return null;
  }

  async execute(decision: Decision): Promise<ExecutionResult> {
    console.log(`[Yield] Executing: ${decision.reason}`);
    return {
      success: true,
      executedAt: Date.now(),
    };
  }
}
