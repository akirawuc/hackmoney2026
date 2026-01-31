import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Hash,
  type PublicClient,
  type WalletClient,
} from 'viem';
import type { YellowConfig, ChannelState, TradeParams, TradeResult } from './types';

export class YellowClient {
  private publicClient: PublicClient;
  private walletClient?: WalletClient;

  constructor(private config: YellowConfig) {
    this.publicClient = createPublicClient({
      transport: http(config.rpcUrl),
    });
  }

  setWallet(walletClient: WalletClient): void {
    this.walletClient = walletClient;
  }

  async openChannel(deposit: bigint): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    // In production, this would interact with the Yellow clearing house
    // For hackathon, we simulate the channel opening
    const txHash = await this.simulateChannelOpen(deposit);
    return txHash;
  }

  async getChannelState(channelId: Hash): Promise<ChannelState> {
    // Query on-chain channel state
    // For hackathon demo, return mock state
    return {
      channelId,
      balances: [1000000000n, 0n], // 1000 USDC deposited
      nonce: 0n,
      isFinal: false,
    };
  }

  async signTrade(params: TradeParams, nonce: bigint): Promise<TradeResult> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    // Create state channel trade message
    const message = this.encodeTradeMessage(params, nonce);

    // Sign off-chain (gasless)
    const signature = await this.walletClient.signMessage({
      message: { raw: message },
      account: this.walletClient.account!,
    });

    // Calculate output (simplified - in production would use DEX prices)
    const outputAmount = this.calculateOutput(params);

    return {
      success: true,
      nonce: nonce + 1n,
      inputAmount: params.amount,
      outputAmount,
      newBalance: outputAmount,
      signature: signature as Hash,
      timestamp: Date.now(),
    };
  }

  async settleChannel(channelId: Hash, finalState: ChannelState): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    // Submit final state on-chain
    const txHash = await this.simulateSettlement(channelId, finalState);
    return txHash;
  }

  private encodeTradeMessage(params: TradeParams, nonce: bigint): `0x${string}` {
    // Encode trade parameters for signing
    // In production, this would follow Yellow Network's message format
    const encoder = new TextEncoder();
    const data = encoder.encode(
      JSON.stringify({
        fromToken: params.fromToken,
        toToken: params.toToken,
        amount: params.amount.toString(),
        minOutput: params.minOutput.toString(),
        deadline: params.deadline,
        nonce: nonce.toString(),
      })
    );
    return `0x${Buffer.from(data).toString('hex')}` as `0x${string}`;
  }

  private calculateOutput(params: TradeParams): bigint {
    // Simplified price calculation
    // In production, would query actual DEX prices
    return (params.amount * 99n) / 100n; // 1% slippage for demo
  }

  private async simulateChannelOpen(deposit: bigint): Promise<Hash> {
    // Simulate transaction hash
    const mockTxHash = `0x${Date.now().toString(16).padStart(64, '0')}` as Hash;
    return mockTxHash;
  }

  private async simulateSettlement(
    channelId: Hash,
    finalState: ChannelState
  ): Promise<Hash> {
    const mockTxHash = `0x${(Date.now() + 1).toString(16).padStart(64, '0')}` as Hash;
    return mockTxHash;
  }
}
