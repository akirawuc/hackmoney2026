# LI.FI Integration

## Overview

LI.FI is a cross-chain bridge and DEX aggregator that finds optimal routes for moving assets between chains. AgentFlow uses LI.FI for all cross-chain operations.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      LI.FI Router                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   Route Aggregator                    │   │
│  │                                                       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │   │
│  │  │Stargate │ │ Across  │ │   Hop   │ │  CCTP   │    │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │   │
│  │                                                       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐                │   │
│  │  │Synapse  │ │Connext  │ │  More.. │                │   │
│  │  └─────────┘ └─────────┘ └─────────┘                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### LiFiRouter

Main interface for cross-chain operations:

```typescript
import { LiFiRouter } from '@agentflow/lifi';

const router = new LiFiRouter();
router.setWallet(walletClient);

// Get quote
const quote = await router.getQuote({
  fromChainId: 8453,  // Base
  toChainId: 42161,   // Arbitrum
  fromToken: USDC_BASE,
  toToken: USDC_ARB,
  fromAmount: parseUnits('1000', 6),
  fromAddress: userAddress,
});

// Execute bridge
const result = await router.executeBridge(quote);
```

### Quick Bridge

Convenience method for USDC bridging:

```typescript
const result = await router.bridgeUSDC(
  8453,   // from Base
  42161,  // to Arbitrum
  parseUnits('500', 6),
  userAddress
);
```

## Quote Structure

```typescript
interface BridgeQuote {
  id: string;
  fromChainId: number;
  toChainId: number;
  fromToken: Address;
  toToken: Address;
  fromAmount: bigint;
  toAmount: bigint;
  toAmountMin: bigint;      // After slippage
  estimatedGas: bigint;
  estimatedTime: number;    // Seconds
  bridgeName: string;       // e.g., 'stargate'
  steps: BridgeStep[];
}
```

## Supported Routes

### Chains

| Chain | Chain ID | Status |
|-------|----------|--------|
| Base | 8453 | Supported |
| Arbitrum | 42161 | Supported |
| Ethereum | 1 | Supported |
| Optimism | 10 | Planned |
| Polygon | 137 | Planned |

### Tokens

| Token | Base | Arbitrum |
|-------|------|----------|
| USDC | 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 | 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 |
| WETH | 0x4200000000000000000000000000000000000006 | 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1 |

## Bridge Selection

LI.FI automatically selects the best bridge based on:

1. **Cost** - Total fees (gas + bridge fee)
2. **Speed** - Estimated completion time
3. **Liquidity** - Available liquidity on route
4. **Reliability** - Historical success rate

### Manual Bridge Preference

```typescript
// Force specific bridge
const quote = await router.getQuote({
  ...params,
  bridges: ['stargate'], // Only use Stargate
});
```

## Execution Flow

```
┌─────────┐     ┌─────────────┐     ┌──────────┐     ┌─────────┐
│ Quote   │────►│ Approve     │────►│ Execute  │────►│ Wait    │
│ Request │     │ Token       │     │ Bridge   │     │ Confirm │
└─────────┘     └─────────────┘     └──────────┘     └─────────┘
                      │                   │                │
                      ▼                   ▼                ▼
                  ERC20.approve      Bridge.send      Poll Status
```

### Code Flow

```typescript
async executeBridge(quote: BridgeQuote): Promise<BridgeResult> {
  // Step 1: Approve token if needed
  if (quote.steps.some(s => s.type === 'approve')) {
    await this.approveToken(quote);
  }

  // Step 2: Execute bridge transaction
  const txHash = await this.executeBridgeTransaction(quote);

  // Step 3: Return result (polling happens async)
  return {
    success: true,
    txHash,
    fromAmount: quote.fromAmount,
    toAmount: quote.toAmountMin,
    executedAt: Date.now(),
  };
}
```

## Time Estimates

| Route | Bridge | Est. Time |
|-------|--------|-----------|
| Base → Arbitrum | Stargate | ~2 min |
| Base → Arbitrum | Across | ~1 min |
| Base → Ethereum | Stargate | ~15 min |
| Arbitrum → Base | CCTP | ~15 min |

## Fees

Typical fee structure:
- **Bridge Fee**: 0.05% - 0.1%
- **Gas (source)**: ~$0.01 - $0.10
- **Gas (dest)**: Included in bridge fee

## Error Handling

```typescript
const result = await router.executeBridge(quote);

if (!result.success) {
  switch (result.error) {
    case 'INSUFFICIENT_BALANCE':
      // User doesn't have enough tokens
      break;
    case 'APPROVAL_FAILED':
      // Token approval transaction failed
      break;
    case 'BRIDGE_FAILED':
      // Bridge transaction reverted
      break;
    case 'TIMEOUT':
      // Bridge took too long
      break;
  }
}
```

## Status Polling

```typescript
// Check bridge status
const status = await router.getStatus(txHash);

switch (status) {
  case 'pending':
    // Still processing
    break;
  case 'completed':
    // Funds received on destination
    break;
  case 'failed':
    // Bridge failed (may need manual recovery)
    break;
}
```

## Integration with Agent

The arbitrage strategy uses LI.FI for cross-chain opportunities:

```typescript
// In ArbitrageStrategy
if (decision.action === 'bridge') {
  const quote = await lifiRouter.getQuote({
    fromChainId: decision.fromChain,
    toChainId: decision.toChain,
    fromToken: decision.fromToken,
    toToken: decision.toToken,
    fromAmount: decision.amount,
    fromAddress: portfolioAddress,
  });

  // Only proceed if profitable after fees
  const netProfit = decision.amount - quote.fromAmount;
  if (netProfit > minProfitThreshold) {
    await lifiRouter.executeBridge(quote);
  }
}
```

## Rate Limiting

LI.FI API rate limits:
- **Quotes**: 10 req/sec
- **Status**: 5 req/sec

AgentFlow implements caching to stay within limits.

## References

- [LI.FI Documentation](https://docs.li.fi/)
- [LI.FI SDK](https://www.npmjs.com/package/@lifi/sdk)
- [Supported Chains](https://docs.li.fi/list-of-chains)
