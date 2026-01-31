import type { AgentConfig, Decision, ExecutionResult, PortfolioState, Strategy } from '../types';
import { CHAIN_IDS, TOKEN_ADDRESSES } from '../chains';

type RebalanceConfig = AgentConfig['strategies']['rebalance'];

export class RebalanceStrategy implements Strategy {
  name = 'rebalance';
  enabled: boolean;

  constructor(private config: RebalanceConfig) {
    this.enabled = config.enabled;
  }

  evaluate(state: PortfolioState): Decision | null {
    if (!this.enabled || state.totalValueUsd === 0) {
      return null;
    }

    // Calculate current allocations
    const allocations: Record<string, number> = {};
    for (const [chainId, balances] of Object.entries(state.balances)) {
      for (const balance of balances) {
        const key = `${chainId}:${balance.symbol}`;
        allocations[key] = (balance.valueUsd / state.totalValueUsd) * 100;
      }
    }

    // Find the largest deviation from target
    let maxDeviation = 0;
    let deviatingAsset: string | null = null;
    let targetAllocation = 0;
    let currentAllocation = 0;

    for (const [asset, target] of Object.entries(this.config.targetAllocations)) {
      const current = allocations[asset] || 0;
      const deviation = Math.abs(current - target);
      if (deviation > maxDeviation) {
        maxDeviation = deviation;
        deviatingAsset = asset;
        targetAllocation = target;
        currentAllocation = current;
      }
    }

    // Check if rebalance is needed
    if (maxDeviation < this.config.rebalanceThreshold || !deviatingAsset) {
      return null;
    }

    // Determine rebalance direction
    const [chainIdStr, symbol] = deviatingAsset.split(':');
    const chainId = parseInt(chainIdStr) as 8453 | 42161;
    const needsMore = currentAllocation < targetAllocation;

    // Simple rebalance: sell overweight asset for underweight asset
    const decision: Decision = {
      id: `rebalance-${Date.now()}`,
      strategy: this.name,
      action: 'rebalance',
      fromChain: chainId,
      toChain: chainId,
      fromToken: needsMore
        ? TOKEN_ADDRESSES[chainId].USDC
        : TOKEN_ADDRESSES[chainId].WETH,
      toToken: needsMore
        ? TOKEN_ADDRESSES[chainId].WETH
        : TOKEN_ADDRESSES[chainId].USDC,
      amount: this.calculateRebalanceAmount(state, maxDeviation),
      reason: `${deviatingAsset} allocation is ${currentAllocation.toFixed(1)}%, target is ${targetAllocation}%`,
      confidence: Math.min(maxDeviation / this.config.rebalanceThreshold, 1),
      priority: 5,
    };

    return decision;
  }

  private calculateRebalanceAmount(state: PortfolioState, deviation: number): bigint {
    // Calculate amount needed to rebalance (simplified)
    const valueToMove = (state.totalValueUsd * deviation) / 100;
    // Convert to USDC units (6 decimals)
    return BigInt(Math.floor(valueToMove * 1e6));
  }

  async execute(decision: Decision): Promise<ExecutionResult> {
    // Execution is handled by the Executor which routes to Yellow or on-chain
    console.log(`[Rebalance] Executing: ${decision.reason}`);
    return {
      success: true,
      executedAt: Date.now(),
    };
  }
}
