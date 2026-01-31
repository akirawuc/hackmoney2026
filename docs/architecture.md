# AgentFlow DeFi Architecture

## Overview

AgentFlow is an autonomous AI-powered cross-chain DeFi agent platform that enables gasless high-frequency trading through Yellow Network state channels, cross-chain bridging via LI.FI, and MEV protection through Uniswap v4 hooks.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Wallet   │  │ Session  │  │ Strategy │  │ Bridge           │ │
│  │ Connect  │  │ Panel    │  │ Panel    │  │ Panel            │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Core Engine (@agentflow/core)               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Agent Engine                           │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │   │
│  │  │ Rebalance  │  │ Arbitrage  │  │ Yield Optimizer    │  │   │
│  │  │ Strategy   │  │ Strategy   │  │ Strategy           │  │   │
│  │  └────────────┘  └────────────┘  └────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                      ┌───────┴───────┐                          │
│                      │   Executor    │                          │
│                      └───────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│ Yellow       │    │ LI.FI        │    │ ENS              │
│ Session      │    │ Router       │    │ Config           │
│ Manager      │    │              │    │ Loader           │
└──────────────┘    └──────────────┘    └──────────────────┘
        │                   │                     │
        ▼                   ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│ State        │    │ Cross-Chain  │    │ ENS              │
│ Channels     │    │ Bridges      │    │ Text Records     │
│ (Gasless)    │    │ (Base↔Arb)   │    │ (Mainnet)        │
└──────────────┘    └──────────────┘    └──────────────────┘
```

## Core Components

### 1. Agent Engine (`packages/core/src/engine.ts`)

The central orchestration layer that:
- Manages strategy lifecycle
- Evaluates market conditions
- Makes trading decisions
- Enforces risk limits

### 2. Strategy System

Three built-in strategies:

| Strategy | Purpose | Priority |
|----------|---------|----------|
| Arbitrage | Cross-chain price differences | High (10) |
| Rebalance | Portfolio allocation | Medium (5) |
| Yield | Deploy idle assets | Low (3) |

### 3. Executor (`packages/core/src/executor.ts`)

Routes execution to the appropriate destination:
- **Yellow Session**: For same-chain gasless trades
- **LI.FI Router**: For cross-chain operations
- **Direct**: Fallback to on-chain execution

## Integration Points

### Yellow Network (`packages/integrations/yellow`)

State channel system for gasless trading:

```
┌──────────────┐    Off-chain     ┌──────────────┐
│   Agent      │◄────Trades────►│   Counter    │
│   Wallet     │                  │   Party      │
└──────┬───────┘                  └──────────────┘
       │
       │ On-chain (only for open/settle)
       ▼
┌──────────────────────────────────────────────────┐
│              Yellow Clearing House                │
└──────────────────────────────────────────────────┘
```

### LI.FI (`packages/integrations/lifi`)

Cross-chain bridging aggregator:

```
Base ──► LI.FI ──► Arbitrum
           │
           ├── Stargate
           ├── Across
           ├── Hop
           └── Circle CCTP
```

### ENS (`packages/integrations/ens`)

Decentralized configuration storage:

```
agentflow.strategy (ENS Text Record)
    │
    └── JSON Configuration
        ├── strategies
        ├── riskLimits
        └── yellowSession
```

### Uniswap v4 Hook (`contracts/src/hooks/AgentBatchHook.sol`)

MEV protection through trade batching:

```
Trade 1 ──┐
Trade 2 ──┼──► Batch Queue ──► Shuffled Execution
Trade 3 ──┘
```

## Data Flow

### Trading Flow

```
1. ENS Config Load
   └── Load agent configuration from ENS text record

2. Strategy Evaluation
   └── Engine evaluates all strategies against portfolio state

3. Decision Making
   └── Highest priority decision selected

4. Execution Routing
   ├── Same-chain → Yellow Session (gasless)
   └── Cross-chain → LI.FI Router

5. Settlement (Yellow only)
   └── Periodic on-chain settlement of state channel
```

### Configuration Flow

```
1. User creates config in UI
2. Config validated against schema
3. Config serialized to JSON
4. Stored in ENS text record
5. Agent loads config on startup
```

## Security Considerations

### Risk Limits

- **maxTradeSize**: Maximum single trade size
- **maxDailyVolume**: Daily trading volume cap
- **maxSlippage**: Maximum acceptable slippage

### MEV Protection

The Uniswap v4 hook provides:
- Trade intent obscuration through batching
- Timing randomization
- Volume aggregation

### State Channel Security

Yellow sessions provide:
- Signed state transitions
- On-chain dispute resolution
- Forced settlement capability

## Deployment Architecture

```
┌─────────────────────────────────────────────┐
│                 Vercel                       │
│  ┌────────────────────────────────────────┐ │
│  │          Next.js Frontend              │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│                  Base                        │
│  ┌────────────────────────────────────────┐ │
│  │       AgentBatchHook (Uniswap v4)      │ │
│  │       Yellow Clearing House            │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│                Arbitrum                      │
│  ┌────────────────────────────────────────┐ │
│  │       AgentBatchHook (Uniswap v4)      │ │
│  │       Yellow Clearing House            │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│               Ethereum                       │
│  ┌────────────────────────────────────────┐ │
│  │         ENS Registry                    │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```
