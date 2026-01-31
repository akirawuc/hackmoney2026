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
| `src/HookMiner.sol` | Utility for mining hook addresses with required flags |
| `script/DeployAgentFlowHook.s.sol` | Foundry deployment script |

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
forge test           # Run tests (6 tests)
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
forge script script/DeployAgentFlowHook.s.sol --rpc-url base_sepolia --broadcast
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
- Batch tracking functionality
- Owner access controls
