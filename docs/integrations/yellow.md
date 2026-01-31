# Yellow Network Integration

## Overview

Yellow Network provides state channel infrastructure for gasless, high-frequency trading. AgentFlow uses Yellow as the primary trading engine for same-chain operations.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Yellow Network                            │
│                                                              │
│  ┌──────────────┐       ┌──────────────┐                    │
│  │   Agent      │       │  Clearing    │                    │
│  │   Session    │◄─────►│  House       │                    │
│  └──────────────┘       └──────────────┘                    │
│         │                      │                             │
│         │ Off-chain            │ On-chain                    │
│         │ (Signed States)      │ (Open/Settle)               │
│         ▼                      ▼                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                State Channel                          │   │
│  │  Balance A: 1000 USDC  │  Balance B: 0 USDC          │   │
│  │  Nonce: 5              │  Status: Active              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### YellowSessionManager

Manages the lifecycle of trading sessions:

```typescript
import { YellowSessionManager } from '@agentflow/yellow';

const manager = new YellowSessionManager({
  rpcUrl: 'https://mainnet.base.org',
  clearingHouseAddress: '0x...',
  chainId: 8453,
});

// Connect wallet
manager.setWallet(walletClient);

// Create session with deposit
const session = await manager.createSession(parseUnits('500', 6));

// Execute trades (gasless!)
await manager.executeTrade({
  fromToken: USDC,
  toToken: WETH,
  amount: parseUnits('100', 6),
  minOutput: parseUnits('0.04', 18),
  deadline: Date.now() + 300000,
});

// Settle session (single on-chain tx)
const result = await manager.settleSession();
```

### YellowClient

Low-level client for state channel operations:

```typescript
import { YellowClient } from '@agentflow/yellow';

const client = new YellowClient(config);
client.setWallet(walletClient);

// Open channel
const channelId = await client.openChannel(deposit);

// Get channel state
const state = await client.getChannelState(channelId);

// Sign trade (off-chain)
const result = await client.signTrade(params, nonce);

// Settle channel
const txHash = await client.settleChannel(channelId, finalState);
```

## Session Lifecycle

```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌────────┐
│ Opening │────►│ Active  │────►│ Settling │────►│ Closed │
└─────────┘     └─────────┘     └──────────┘     └────────┘
     │               │                │
     │               │                │
     ▼               ▼                ▼
  Deposit         Trades           Withdraw
  On-chain       Off-chain         On-chain
```

### 1. Opening

```typescript
// User deposits USDC into state channel
const session = await manager.createSession(
  parseUnits('500', 6) // 500 USDC
);
// Status: 'opening' -> 'active'
```

### 2. Active Trading

```typescript
// All trades are gasless signed messages
for (const trade of trades) {
  await manager.executeTrade(trade);
  // No gas cost!
}
```

### 3. Settlement

```typescript
// Single transaction settles all trades
const result = await manager.settleSession();
// Status: 'settling' -> 'closed'
```

## Gas Savings

| Operation | Traditional | Yellow |
|-----------|-------------|--------|
| Open Session | ~150k gas | ~150k gas |
| Trade | ~100k gas | 0 gas |
| Trade | ~100k gas | 0 gas |
| Trade | ~100k gas | 0 gas |
| ... | ... | ... |
| Settle | N/A | ~100k gas |
| **Total (10 trades)** | ~1.15M gas | ~250k gas |

**Savings: ~78% gas reduction**

## Configuration

Agent configuration for Yellow sessions:

```json
{
  "yellowSession": {
    "autoDeposit": true,
    "depositAmount": "500000000",
    "settlementThreshold": "100000000"
  }
}
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `autoDeposit` | boolean | Automatically open session on agent start |
| `depositAmount` | string | Default deposit amount (6 decimals) |
| `settlementThreshold` | string | Auto-settle when balance reaches this |

## Error Handling

```typescript
try {
  await manager.executeTrade(params);
} catch (error) {
  if (error.message === 'No active session') {
    // Need to create session first
    await manager.createSession(deposit);
  } else if (error.message === 'Insufficient balance') {
    // Need to settle and redeposit
    await manager.settleSession();
    await manager.createSession(newDeposit);
  }
}
```

## Security

### State Verification

Every state update is signed by both parties:

```typescript
const message = encodeTradeMessage(params, nonce);
const signature = await wallet.signMessage({ message });
// Signature can be verified on-chain if disputed
```

### Dispute Resolution

If counterparty is unresponsive:

1. Submit latest signed state on-chain
2. Wait for challenge period
3. Withdraw funds

## Integration with Agent

```typescript
// In executor.ts
if (this.deps.yellowSession?.status === 'active') {
  // Route through Yellow for gasless execution
  return this.deps.executeTrade(decision);
}
```

## References

- [Yellow Network Documentation](https://docs.yellow.org/)
- [ERC-7824 Nitrolite SDK](https://github.com/erc7824/nitrolite)
- [State Channels Paper](https://statechannels.org/)
