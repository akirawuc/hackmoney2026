# ENS Config Storage

## Overview

AgentFlow uses ENS (Ethereum Name Service) text records to store agent configuration on-chain. This provides decentralized, censorship-resistant configuration storage that can be verified by anyone.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ENS Integration                          │
│                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌─────────────┐ │
│  │   Agent      │────►│  ENS         │────►│  Text       │ │
│  │   Config     │     │  Resolver    │     │  Record     │ │
│  │   Loader     │     │              │     │             │ │
│  └──────────────┘     └──────────────┘     └─────────────┘ │
│                                                    │        │
│                                                    ▼        │
│                              agentflow.strategy            │
│                              {                              │
│                                "strategies": {...},        │
│                                "riskLimits": {...}         │
│                              }                              │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### ENSConfigLoader

Load agent configuration from ENS:

```typescript
import { ENSConfigLoader, loadAgentConfig } from '@agentflow/ens';

// Using class
const loader = new ENSConfigLoader();
const config = await loader.loadConfig('myagent.eth');

// Using helper function
const config = await loadAgentConfig('myagent.eth');
```

### Config Schema

Zod schema for validation:

```typescript
import { AgentConfigSchema, validateConfig } from '@agentflow/ens';

const config = validateConfig({
  strategies: {
    rebalance: { enabled: true, ... },
    arbitrage: { enabled: true, ... },
    yield: { enabled: false, ... },
  },
  riskLimits: { ... },
  yellowSession: { ... },
});
```

## Configuration Structure

### Full Schema

```typescript
interface ENSAgentConfig {
  version: string;
  name?: string;
  strategies: {
    rebalance: {
      enabled: boolean;
      targetAllocations: Record<string, number>;
      rebalanceThreshold: number;
    };
    arbitrage: {
      enabled: boolean;
      minProfitBps: number;
      maxSlippageBps: number;
    };
    yield: {
      enabled: boolean;
      minApy: number;
      protocols: string[];
    };
  };
  riskLimits: {
    maxTradeSize: bigint;
    maxDailyVolume: bigint;
    maxSlippage: number;
  };
  yellowSession: {
    autoDeposit: boolean;
    depositAmount: bigint;
    settlementThreshold: bigint;
  };
}
```

### Example JSON

```json
{
  "version": "1.0",
  "name": "My DeFi Agent",
  "strategies": {
    "rebalance": {
      "enabled": true,
      "targetAllocations": {
        "8453:USDC": 40,
        "8453:WETH": 30,
        "42161:USDC": 20,
        "42161:WETH": 10
      },
      "rebalanceThreshold": 5
    },
    "arbitrage": {
      "enabled": true,
      "minProfitBps": 10,
      "maxSlippageBps": 50
    },
    "yield": {
      "enabled": false,
      "minApy": 3,
      "protocols": ["aave", "compound"]
    }
  },
  "riskLimits": {
    "maxTradeSize": "1000000000",
    "maxDailyVolume": "10000000000",
    "maxSlippage": 1
  },
  "yellowSession": {
    "autoDeposit": true,
    "depositAmount": "500000000",
    "settlementThreshold": "100000000"
  }
}
```

## ENS Text Record

### Key
`agentflow.strategy`

### Setting via ethers.js

```javascript
const resolver = await provider.getResolver('myagent.eth');
const tx = await resolver.setText('agentflow.strategy', JSON.stringify(config));
await tx.wait();
```

### Setting via ENS App

1. Go to https://app.ens.domains
2. Navigate to your name
3. Click "Add/Edit Record"
4. Add text record with key `agentflow.strategy`
5. Paste JSON configuration
6. Confirm transaction

## Default Configuration

If no ENS config is found, defaults are used:

```typescript
const defaults = {
  version: '1.0',
  strategies: {
    rebalance: {
      enabled: true,
      targetAllocations: {
        '8453:USDC': 40,
        '8453:WETH': 30,
        '42161:USDC': 20,
        '42161:WETH': 10,
      },
      rebalanceThreshold: 5,
    },
    arbitrage: {
      enabled: true,
      minProfitBps: 10,
      maxSlippageBps: 50,
    },
    yield: {
      enabled: false,
      minApy: 3,
      protocols: ['aave', 'compound'],
    },
  },
  riskLimits: {
    maxTradeSize: 1000000000n,     // 1000 USDC
    maxDailyVolume: 10000000000n,  // 10000 USDC
    maxSlippage: 1,                 // 1%
  },
  yellowSession: {
    autoDeposit: true,
    depositAmount: 500000000n,      // 500 USDC
    settlementThreshold: 100000000n, // 100 USDC
  },
};
```

## Validation

### Schema Validation

```typescript
import { validateConfig } from '@agentflow/ens';

try {
  const config = validateConfig(jsonData);
  // Config is valid and typed
} catch (error) {
  // Validation failed
  console.error(error.issues);
}
```

### Common Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `rebalanceThreshold must be <= 50` | Threshold too high | Use value between 1-50 |
| `maxSlippageBps must be <= 500` | Slippage too high | Use value between 1-500 |
| `Invalid allocation` | Allocation > 100% | Ensure sum is ≤ 100 |

## Address Resolution

Also supports ENS name → address resolution:

```typescript
const loader = new ENSConfigLoader();

// Resolve address
const address = await loader.resolveAddress('vitalik.eth');
// 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

// Reverse lookup
const name = await loader.getName(address);
// vitalik.eth
```

## Saving Configuration

```typescript
import { saveAgentConfig } from '@agentflow/ens';

// Requires wallet that owns/controls the ENS name
const txHash = await saveAgentConfig(
  walletClient,
  'myagent.eth',
  config
);
```

## Caching

The loader implements basic caching:

```typescript
const loader = new ENSConfigLoader();

// First call - fetches from chain
const config1 = await loader.loadConfig('myagent.eth');

// Second call - may use cache (implementation detail)
const config2 = await loader.loadConfig('myagent.eth');
```

## Error Handling

```typescript
try {
  const config = await loadAgentConfig('myagent.eth');
} catch (error) {
  if (error.message.includes('resolver')) {
    // ENS name doesn't exist
  } else if (error.message.includes('parse')) {
    // Invalid JSON in text record
  } else if (error.message.includes('validation')) {
    // JSON doesn't match schema
  }
}
```

## Cost

| Operation | Gas | Cost (@ 10 gwei) |
|-----------|-----|------------------|
| Set text record | ~50k | ~$0.10 |
| Read text record | 0 | Free |

## Benefits

1. **Decentralized**: No central server dependency
2. **Verifiable**: Anyone can verify config
3. **Persistent**: Stored on Ethereum mainnet
4. **Portable**: Config tied to ENS name, not address
5. **Composable**: Other apps can read agent config

## References

- [ENS Documentation](https://docs.ens.domains/)
- [ENS Text Records](https://docs.ens.domains/contract-api-reference/publicresolver#text-records)
- [ethers.js ENS](https://docs.ethers.org/v6/api/providers/ens-resolver/)
