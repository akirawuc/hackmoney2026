import type { Decision, ExecutionResult, Session } from './types';

export interface ExecutorDependencies {
  yellowSession?: Session;
  executeTrade: (decision: Decision) => Promise<ExecutionResult>;
  executeBridge: (decision: Decision) => Promise<ExecutionResult>;
}

export class Executor {
  constructor(private deps: ExecutorDependencies) {}

  async execute(decision: Decision): Promise<ExecutionResult> {
    const isCrossChain = decision.fromChain !== decision.toChain;

    if (isCrossChain) {
      return this.executeCrossChain(decision);
    }

    return this.executeSameChain(decision);
  }

  private async executeSameChain(decision: Decision): Promise<ExecutionResult> {
    // If Yellow session is active, route through it for gasless trading
    if (this.deps.yellowSession?.status === 'active') {
      return this.deps.executeTrade(decision);
    }

    // Fallback to on-chain execution
    return this.deps.executeTrade(decision);
  }

  private async executeCrossChain(decision: Decision): Promise<ExecutionResult> {
    // Cross-chain operations go through LI.FI
    return this.deps.executeBridge(decision);
  }

  setYellowSession(session: Session | undefined): void {
    this.deps.yellowSession = session;
  }
}
