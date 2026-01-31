import type { Hash, WalletClient } from 'viem';
import { YellowClient } from './client';
import type { YellowConfig, SessionState, TradeParams, TradeResult, SettlementResult } from './types';

export class YellowSessionManager {
  private client: YellowClient;
  private session: SessionState | null = null;

  constructor(config: YellowConfig) {
    this.client = new YellowClient(config);
  }

  setWallet(walletClient: WalletClient): void {
    this.client.setWallet(walletClient);
  }

  async createSession(deposit: bigint): Promise<SessionState> {
    if (this.session?.status === 'active') {
      throw new Error('Session already active. Settle first.');
    }

    // Open state channel with deposit
    const txHash = await this.client.openChannel(deposit);

    // Create session state
    this.session = {
      id: `session-${Date.now()}`,
      channelId: txHash,
      participant: '0x0000000000000000000000000000000000000000',
      deposit,
      balance: deposit,
      nonce: 0n,
      status: 'opening',
      createdAt: Date.now(),
      lastActivity: Date.now(),
    };

    // Wait for channel to be confirmed (simplified)
    await this.waitForConfirmation(txHash);

    this.session.status = 'active';
    return this.session;
  }

  async executeTrade(params: TradeParams): Promise<TradeResult> {
    if (!this.session || this.session.status !== 'active') {
      throw new Error('No active session');
    }

    // Execute gasless trade via state channel
    const result = await this.client.signTrade(params, this.session.nonce);

    if (result.success) {
      // Update local session state
      this.session.balance = result.newBalance;
      this.session.nonce = result.nonce;
      this.session.lastActivity = Date.now();
    }

    return result;
  }

  async settleSession(): Promise<SettlementResult> {
    if (!this.session) {
      throw new Error('No session to settle');
    }

    this.session.status = 'settling';

    // Get final channel state
    const channelState = await this.client.getChannelState(this.session.channelId);
    channelState.isFinal = true;

    // Submit settlement on-chain
    const txHash = await this.client.settleChannel(
      this.session.channelId,
      channelState
    );

    const result: SettlementResult = {
      success: true,
      txHash,
      finalBalance: this.session.balance,
      settledAt: Date.now(),
    };

    this.session.status = 'closed';
    return result;
  }

  getSession(): SessionState | null {
    return this.session;
  }

  isActive(): boolean {
    return this.session?.status === 'active';
  }

  getBalance(): bigint {
    return this.session?.balance ?? 0n;
  }

  getTradeCount(): bigint {
    return this.session?.nonce ?? 0n;
  }

  private async waitForConfirmation(txHash: Hash): Promise<void> {
    // In production, would wait for actual block confirmations
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
