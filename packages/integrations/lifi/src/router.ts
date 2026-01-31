import type { Address, Hash, WalletClient } from 'viem';
import { getQuote } from './quotes';
import type { BridgeParams, BridgeQuote, BridgeResult } from './types';

export class LiFiRouter {
  private walletClient?: WalletClient;

  constructor() {
    // Initialize LI.FI SDK configuration
    this.initializeSdk();
  }

  private initializeSdk(): void {
    // In production, would configure LI.FI SDK:
    // createConfig({ integrator: 'AgentFlow' });
  }

  setWallet(walletClient: WalletClient): void {
    this.walletClient = walletClient;
  }

  async getQuote(params: BridgeParams): Promise<BridgeQuote> {
    return getQuote(params);
  }

  async executeBridge(quote: BridgeQuote): Promise<BridgeResult> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      // Step 1: Approve token if needed
      if (quote.steps.some((s) => s.type === 'approve')) {
        await this.approveToken(quote);
      }

      // Step 2: Execute bridge transaction
      const txHash = await this.executeBridgeTransaction(quote);

      return {
        success: true,
        txHash,
        fromAmount: quote.fromAmount,
        toAmount: quote.toAmountMin, // Actual amount received may vary
        executedAt: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        fromAmount: quote.fromAmount,
        error: (error as Error).message,
        executedAt: Date.now(),
      };
    }
  }

  async bridgeUSDC(
    fromChainId: number,
    toChainId: number,
    amount: bigint,
    fromAddress: Address
  ): Promise<BridgeResult> {
    // Get USDC addresses for both chains
    const fromToken = this.getUSDCAddress(fromChainId);
    const toToken = this.getUSDCAddress(toChainId);

    if (!fromToken || !toToken) {
      return {
        success: false,
        fromAmount: amount,
        error: 'USDC not supported on one or both chains',
        executedAt: Date.now(),
      };
    }

    const quote = await this.getQuote({
      fromChainId,
      toChainId,
      fromToken,
      toToken,
      fromAmount: amount,
      fromAddress,
    });

    return this.executeBridge(quote);
  }

  private async approveToken(quote: BridgeQuote): Promise<Hash> {
    if (!this.walletClient?.account) {
      throw new Error('Wallet not connected');
    }

    // In production, would send approval transaction
    // const hash = await this.walletClient.writeContract({...});

    // For hackathon, simulate approval
    const mockHash = `0x${'a'.repeat(64)}` as Hash;
    return mockHash;
  }

  private async executeBridgeTransaction(quote: BridgeQuote): Promise<Hash> {
    if (!this.walletClient?.account) {
      throw new Error('Wallet not connected');
    }

    // In production, would use LI.FI SDK to execute:
    // const result = await executeRoute(quote);
    // return result.transactionHash;

    // For hackathon, simulate bridge
    const mockHash = `0x${'b'.repeat(64)}` as Hash;
    return mockHash;
  }

  private getUSDCAddress(chainId: number): Address | null {
    const addresses: Record<number, Address> = {
      8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
      42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum
    };
    return addresses[chainId] || null;
  }

  async getStatus(txHash: Hash): Promise<'pending' | 'completed' | 'failed'> {
    // In production, would poll LI.FI status API
    // For hackathon, return completed
    return 'completed';
  }
}
