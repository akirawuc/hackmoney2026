# Uniswap v4 Privacy Hooks

## Overview

AgentFlow uses Uniswap v4 hooks to provide MEV protection through trade batching. The `AgentBatchHook` contract queues trades from authorized agents and executes them in batches, obscuring individual trade intent.

## Problem: MEV Extraction

Without protection, agent trades are vulnerable to:

```
┌─────────────────────────────────────────────────────────────┐
│                    MEV Extraction                            │
│                                                              │
│  1. Agent submits trade to mempool                          │
│  2. Searcher sees trade, frontruns                          │
│  3. Agent trade executes at worse price                     │
│  4. Searcher backruns for profit                            │
│                                                              │
│  Agent: Loses value to slippage                             │
│  Searcher: Extracts $$$                                     │
└─────────────────────────────────────────────────────────────┘
```

## Solution: Trade Batching

```
┌─────────────────────────────────────────────────────────────┐
│                  AgentBatchHook                              │
│                                                              │
│  ┌─────────┐                                                │
│  │Trade 1  │──┐                                             │
│  └─────────┘  │     ┌──────────────┐     ┌─────────────┐   │
│  ┌─────────┐  ├────►│ Batch Queue  │────►│  Shuffled   │   │
│  │Trade 2  │──┤     │ (min 3)      │     │  Execution  │   │
│  └─────────┘  │     └──────────────┘     └─────────────┘   │
│  ┌─────────┐  │                                             │
│  │Trade 3  │──┘                                             │
│  └─────────┘                                                │
│                                                              │
│  Benefits:                                                   │
│  - Individual trade intent obscured                         │
│  - Timing randomization                                     │
│  - Volume aggregation                                       │
└─────────────────────────────────────────────────────────────┘
```

## Contract: AgentBatchHook

### Location
`contracts/src/hooks/AgentBatchHook.sol`

### Hook Permissions

```solidity
function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
    return Hooks.Permissions({
        beforeSwap: true,   // Queue trades
        afterSwap: true,    // Execute batches
        // All other permissions: false
    });
}
```

### Key Functions

#### Before Swap
```solidity
function beforeSwap(
    address sender,
    PoolKey calldata key,
    IPoolManager.SwapParams calldata params,
    bytes calldata hookData
) external override returns (bytes4, BeforeSwapDelta, uint24) {
    // Queue trade if from authorized agent
    if (batchConfig.enabled && authorizedAgents[sender]) {
        _queueTrade(sender, key, params);
    }
    return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
}
```

#### After Swap
```solidity
function afterSwap(
    address sender,
    PoolKey calldata key,
    IPoolManager.SwapParams calldata params,
    BalanceDelta delta,
    bytes calldata hookData
) external override returns (bytes4, int128) {
    // Execute batch if conditions met
    if (_shouldExecuteBatch()) {
        _executeBatch();
    }
    return (BaseHook.afterSwap.selector, 0);
}
```

## Batch Configuration

```solidity
struct BatchConfig {
    uint256 minTradesPerBatch;  // Minimum trades before execution
    uint256 maxTradesPerBatch;  // Maximum trades per batch
    uint256 batchTimeout;       // Max wait time
    bool enabled;               // Enable/disable batching
}
```

### Default Values

| Parameter | Value | Description |
|-----------|-------|-------------|
| minTradesPerBatch | 3 | Ensures privacy through aggregation |
| maxTradesPerBatch | 10 | Prevents queue buildup |
| batchTimeout | 30 seconds | Max wait for minimum trades |

## Batch Execution Logic

```
Should Execute Batch?
        │
        ├── Queue length >= maxTrades? ──► YES ──► Execute
        │
        ├── Queue length >= minTrades AND
        │   time >= startTime + timeout? ──► YES ──► Execute
        │
        └── Otherwise ──► NO ──► Continue queuing
```

## Agent Authorization

Only authorized addresses can use batch protection:

```solidity
// Admin function
function setAgentAuthorization(address agent, bool authorized) external {
    require(msg.sender == owner, "Not owner");
    authorizedAgents[agent] = authorized;
    emit AgentAuthorized(agent, authorized);
}
```

### Usage

```javascript
// Authorize an agent
await hook.setAgentAuthorization(agentAddress, true);

// Check authorization
const isAuthorized = await hook.isAgentAuthorized(agentAddress);
```

## Events

```solidity
event TradeQueued(
    address indexed agent,
    PoolId indexed poolId,
    bool zeroForOne,
    int256 amountSpecified,
    uint256 batchId
);

event BatchExecuted(
    uint256 indexed batchId,
    uint256 tradesExecuted,
    uint256 timestamp
);

event AgentAuthorized(address indexed agent, bool authorized);
```

## Deployment

### Script

```solidity
// Deploy with correct hook flags
uint160 flags = uint160(
    Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG
);

AgentBatchHook hook = new AgentBatchHook{salt: salt}(
    IPoolManager(poolManager)
);
```

### Commands

```bash
# Build
forge build

# Test
forge test

# Deploy to Base Sepolia
forge script script/DeployHook.s.sol:DeployHook \
  --rpc-url $BASE_SEPOLIA_RPC \
  --broadcast \
  --verify
```

## Testing

```bash
# Run all tests
forge test

# Run specific test
forge test --match-test test_InitialState

# Verbose output
forge test -vvv
```

### Test Coverage

| Test | Description |
|------|-------------|
| `test_InitialState` | Verify default configuration |
| `test_SetAgentAuthorization` | Agent authorization works |
| `test_SetBatchConfig` | Config updates work |
| `test_TransferOwnership` | Ownership transfer works |
| `test_MultipleAgents` | Multiple agents supported |

## Security Considerations

### Access Control
- Only owner can authorize agents
- Only owner can update configuration
- Owner can be transferred

### Batch Safety
- Min trades ensures privacy
- Max trades prevents DoS
- Timeout prevents indefinite waiting

### Upgrade Path
- Hook is immutable once deployed
- Deploy new version and migrate agents

## Integration

### Frontend

```typescript
// Check if user's agent is authorized
const isAuthorized = await publicClient.readContract({
  address: hookAddress,
  abi: AgentBatchHookAbi,
  functionName: 'isAgentAuthorized',
  args: [agentAddress],
});
```

### Agent Configuration

Enable hook in ENS config:

```json
{
  "strategies": {
    "arbitrage": {
      "enabled": true,
      "usePrivacyHook": true,
      "hookAddress": "0x..."
    }
  }
}
```

## Gas Costs

| Operation | Gas |
|-----------|-----|
| Queue trade | ~50k |
| Execute batch (3 trades) | ~200k |
| Set authorization | ~45k |

## References

- [Uniswap v4 Hooks](https://docs.uniswap.org/contracts/v4/concepts/hooks)
- [v4-core Repository](https://github.com/Uniswap/v4-core)
- [v4-periphery Repository](https://github.com/Uniswap/v4-periphery)
- [Hook Examples](https://github.com/Uniswap/v4-periphery/tree/main/src/base/hooks)
