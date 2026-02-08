import type { AgentConfig, ChainId, Decision, ExecutionResult, PortfolioState, Strategy } from '../types';
import { CHAIN_IDS, TOKEN_ADDRESSES } from '../chains';

type ArbitrageConfig = AgentConfig['strategies']['arbitrage'];

interface PriceData {
  chainId: number;
  price: bigint;
  liquidity: bigint;
}

export class ArbitrageStrategy implements Strategy {
  name = 'arbitrage';
  enabled: boolean;

  constructor(private config: ArbitrageConfig) {
    this.enabled = config.enabled;
  }

  evaluate(state: PortfolioState): Decision | null {
    if (!this.enabled) {
      return null;
    }

    // Check for cross-chain arbitrage opportunities
    const opportunity = this.findArbitrageOpportunity(state);
    if (!opportunity) {
      return null;
    }

    const { fromChain, toChain, profitBps, amount } = opportunity;

    if (profitBps < this.config.minProfitBps) {
      return null;
    }

    const decision: Decision = {
      id: `arb-${Date.now()}`,
      strategy: this.name,
      action: 'bridge',
      fromChain,
      toChain,
      fromToken: TOKEN_ADDRESSES[fromChain].USDC,
      toToken: TOKEN_ADDRESSES[toChain].USDC,
      amount,
      reason: `Cross-chain arbitrage opportunity: ${profitBps}bps profit`,
      confidence: Math.min(profitBps / (this.config.minProfitBps * 2), 1),
      priority: 10, // High priority for time-sensitive opportunities
    };

    return decision;
  }

  private findArbitrageOpportunity(state: PortfolioState): {
    fromChain: ChainId;
    toChain: ChainId;
    profitBps: number;
    amount: bigint;
  } | null {
    // Simulated price check - in production would query DEXes
    const basePrices = this.getPrices(CHAIN_IDS.base);
    const arbitrumPrices = this.getPrices(CHAIN_IDS.arbitrum);

    if (!basePrices || !arbitrumPrices) {
      return null;
    }

    // Calculate price difference
    const priceDiffBps =
      Number(((basePrices.price - arbitrumPrices.price) * 10000n) / basePrices.price);

    if (Math.abs(priceDiffBps) < this.config.minProfitBps) {
      return null;
    }

    // Determine direction
    const fromChain = priceDiffBps > 0 ? CHAIN_IDS.arbitrum : CHAIN_IDS.base;
    const toChain = priceDiffBps > 0 ? CHAIN_IDS.base : CHAIN_IDS.arbitrum;

    // Calculate optimal trade size based on available balance
    const fromBalances = state.balances[fromChain];
    const usdcBalance = fromBalances?.find((b) => b.symbol === 'USDC')?.balance || 0n;
    const amount = usdcBalance > 0n ? usdcBalance / 10n : 100000000n; // 10% of balance or 100 USDC

    return {
      fromChain,
      toChain,
      profitBps: Math.abs(priceDiffBps),
      amount,
    };
  }

  private getPrices(chainId: number): PriceData | null {
    // Mock price data - in production would query on-chain
    const mockPrices: Record<number, PriceData> = {
      [CHAIN_IDS.base]: {
        chainId: CHAIN_IDS.base,
        price: 2500000000n, // $2500 WETH/USDC
        liquidity: 10000000000000n,
      },
      [CHAIN_IDS.arbitrum]: {
        chainId: CHAIN_IDS.arbitrum,
        price: 2498000000n, // $2498 WETH/USDC
        liquidity: 15000000000000n,
      },
    };
    return mockPrices[chainId] || null;
  }

  async execute(decision: Decision): Promise<ExecutionResult> {
    console.log(`[Arbitrage] Executing: ${decision.reason}`);
    return {
      success: true,
      executedAt: Date.now(),
    };
  }
}
