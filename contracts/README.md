# AgentFlowHook

Uniswap v4 hook enabling autonomous AI agents to execute trades with built-in authorization and risk controls.

## Overview

AgentFlowHook is a Uniswap v4 hook contract that allows AI agents to execute swaps autonomously while maintaining owner-controlled security guardrails:

- **Agent Authorization** - Owner can authorize/revoke trading permissions for specific agent addresses
- **Max Swap Size** - Configurable limit on individual swap amounts
- **Daily Volume Limit** - Per-agent daily trading volume caps
- **Batch Tracking** - Privacy-preserving batch identifiers for grouped transactions

## Contract Architecture

| Contract | Description |
|----------|-------------|
| `src/AgentFlowHook.sol` | Main hook contract with authorization and risk controls |
| `src/AgentFlowHookDeployable.sol` | Testnet-deployable version (skips address validation) |
| `script/DeploySimple.s.sol` | Simple deployment script for testnets |
| `script/DeployAgentFlowHook.s.sol` | Production deployment script with CREATE2 salt mining |
| `script/HookMiner.sol` | Utility for mining hook addresses with required flags |

## Deployed Addresses

| Chain | Contract | Address | Explorer |
|-------|----------|---------|----------|
| Base Sepolia | AgentFlowHook | `0x6d8d177010eA33c8A83246A5546C5C6bab5e8e41` | [Basescan](https://sepolia.basescan.org/address/0x6d8d177010eA33c8A83246A5546C5C6bab5e8e41) |

## Uniswap v4 PoolManager Addresses

| Chain | Chain ID | Address |
|-------|----------|---------|
| Base Sepolia | 84532 | `0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408` |
| Arbitrum Sepolia | 421614 | `0xFB3e0C6F74eB1a21CC1Da29aeC80D2Dfe6C9a317` |
| Sepolia | 11155111 | `0xE03A1074c86CFeDd5C142C4F04F1a1536e203543` |

## Setup

```bash
forge install        # Install dependencies
forge build          # Compile contracts
forge test           # Run tests (15 tests)
forge fmt            # Format code
```

## Deployment

1. Create a `.env` file with required environment variables:

```bash
DEPLOYER_PRIVATE_KEY=your_private_key
POOL_MANAGER_ADDRESS=0x05E73354cFDd6745C338b50BcFDfA3Aa6fA03408
MAX_SWAP_SIZE=100000000000000000000      # 100 ETH in wei
DAILY_VOLUME_LIMIT=1000000000000000000000 # 1000 ETH in wei
```

2. Deploy to your target network:

```bash
# Simple deployment (testnet, skips hook address validation)
forge script script/DeploySimple.s.sol:DeploySimple --rpc-url base_sepolia --broadcast

# Production deployment (requires CREATE2 salt mining for correct hook address flags)
forge script script/DeployAgentFlowHook.s.sol:DeployAgentFlowHook --rpc-url base_sepolia --broadcast
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEPLOYER_PRIVATE_KEY` | Wallet private key for deployment | Required |
| `POOL_MANAGER_ADDRESS` | Uniswap v4 PoolManager address | Required |
| `MAX_SWAP_SIZE` | Maximum single swap size in wei | 100 ETH |
| `DAILY_VOLUME_LIMIT` | Daily volume limit per agent in wei | 1000 ETH |

## Key Functions

### Owner Functions

```solidity
// Authorize or revoke an agent's trading permissions
setAgentAuthorization(address agent, bool authorized)

// Update risk control limits
setRiskLimits(uint256 maxSwapSize, uint256 dailyVolumeLimit)
```

### View Functions

```solidity
// Check remaining daily volume for an agent
getRemainingDailyVolume(address agent) returns (uint256)

// Check if an agent is authorized
authorizedAgents(address agent) returns (bool)
```

## Testing

```bash
forge test -vvv
```

The test suite covers:
- Agent authorization flows
- Swap size limit enforcement
- Daily volume tracking and limits
- Daily volume reset after 24 hours
- Batch tracking (swapsPerBlock) functionality
- Owner access controls
- `beforeSwap` revert conditions (unauthorized, oversized, volume exceeded)
- `afterSwap` event emission
- Hook data decoding (agent from hookData vs sender fallback)
