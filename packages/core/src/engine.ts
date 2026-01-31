import type { AgentConfig, Decision, ExecutionResult, PortfolioState, Strategy } from './types';
import { RebalanceStrategy } from './strategies/rebalance';
import { ArbitrageStrategy } from './strategies/arbitrage';
import { YieldStrategy } from './strategies/yield';

export interface EngineEvents {
  onDecision?: (decision: Decision) => void;
  onExecution?: (decision: Decision, result: ExecutionResult) => void;
  onError?: (error: Error, decision?: Decision) => void;
}

export class AgentEngine {
  private strategies: Strategy[] = [];
  private running = false;
  private intervalId?: NodeJS.Timeout;

  constructor(
    private config: AgentConfig,
    private events: EngineEvents = {}
  ) {
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    if (this.config.strategies.rebalance.enabled) {
      this.strategies.push(new RebalanceStrategy(this.config.strategies.rebalance));
    }
    if (this.config.strategies.arbitrage.enabled) {
      this.strategies.push(new ArbitrageStrategy(this.config.strategies.arbitrage));
    }
    if (this.config.strategies.yield.enabled) {
      this.strategies.push(new YieldStrategy(this.config.strategies.yield));
    }
  }

  async evaluateStrategies(state: PortfolioState): Promise<Decision[]> {
    const decisions: Decision[] = [];

    for (const strategy of this.strategies) {
      try {
        const decision = strategy.evaluate(state);
        if (decision) {
          decisions.push(decision);
          this.events.onDecision?.(decision);
        }
      } catch (error) {
        this.events.onError?.(error as Error);
      }
    }

    // Sort by priority (higher first)
    return decisions.sort((a, b) => b.priority - a.priority);
  }

  async executeDecision(decision: Decision): Promise<ExecutionResult> {
    const strategy = this.strategies.find((s) => s.name === decision.strategy);
    if (!strategy) {
      const result: ExecutionResult = {
        success: false,
        error: `Strategy ${decision.strategy} not found`,
        executedAt: Date.now(),
      };
      return result;
    }

    try {
      const result = await strategy.execute(decision);
      this.events.onExecution?.(decision, result);
      return result;
    } catch (error) {
      const result: ExecutionResult = {
        success: false,
        error: (error as Error).message,
        executedAt: Date.now(),
      };
      this.events.onError?.(error as Error, decision);
      return result;
    }
  }

  async runOnce(state: PortfolioState): Promise<ExecutionResult[]> {
    const decisions = await this.evaluateStrategies(state);
    const results: ExecutionResult[] = [];

    for (const decision of decisions) {
      // Check risk limits before execution
      if (decision.amount > this.config.riskLimits.maxTradeSize) {
        this.events.onError?.(
          new Error(`Trade size ${decision.amount} exceeds limit ${this.config.riskLimits.maxTradeSize}`),
          decision
        );
        continue;
      }

      const result = await this.executeDecision(decision);
      results.push(result);

      // Stop on first failure for safety
      if (!result.success) {
        break;
      }
    }

    return results;
  }

  start(getState: () => Promise<PortfolioState>, intervalMs = 30000): void {
    if (this.running) return;
    this.running = true;

    this.intervalId = setInterval(async () => {
      if (!this.running) return;
      try {
        const state = await getState();
        await this.runOnce(state);
      } catch (error) {
        this.events.onError?.(error as Error);
      }
    }, intervalMs);
  }

  stop(): void {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  getStrategies(): Strategy[] {
    return [...this.strategies];
  }
}
