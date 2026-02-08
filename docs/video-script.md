# AgentFlow DeFi - HackMoney 2026 Submission Video Script

**Total Duration:** ~4-5 minutes
**Format:** Screen recording with voiceover narration
**Resolution:** 1920x1080 recommended

---

## SCENE 1: Hook / Problem Statement (0:00 - 0:30)

### ON SCREEN
- Title slide: **"AgentFlow DeFi"** with tagline *"Autonomous AI-Powered Cross-Chain DeFi Agent"*
- Animated text or simple graphics showing pain points:
  - "Manual trading = Missed opportunities"
  - "Gas fees eat into profits"
  - "MEV bots front-run your trades"
  - "Managing positions across chains is painful"

### NARRATION
> "If you've ever tried to manage DeFi positions across multiple chains, you know the pain. You're constantly switching networks, paying gas fees on every swap, watching MEV bots front-run your trades, and missing arbitrage windows because you can't move fast enough.
>
> What if an AI agent could handle all of this for you - gaslessly, across chains, with built-in MEV protection? That's AgentFlow."

---

## SCENE 2: What is AgentFlow? (0:30 - 1:10)

### ON SCREEN
- Architecture diagram from `docs/architecture.md` - the full system diagram showing Frontend -> Core Engine -> Integrations -> Chains
- Highlight each layer as you mention it
- Show the sponsor logos: Yellow Network, Uniswap, LI.FI, ENS

### NARRATION
> "AgentFlow is an autonomous DeFi agent platform built for HackMoney 2026. Users connect their wallet, configure their strategies, and let the agent engine take over.
>
> The platform runs three intelligent strategies: portfolio rebalancing, cross-chain arbitrage, and yield optimization. Same-chain trades execute gaslessly through Yellow Network state channels. Cross-chain operations route through LI.FI's bridge aggregator. A custom Uniswap v4 hook enforces on-chain risk controls and provides MEV protection. And all strategy configuration lives on-chain in ENS text records - fully decentralized and portable.
>
> Let me show you how it works."

---

## SCENE 3: Live Demo - Dashboard Overview (1:10 - 1:45)

### ON SCREEN
- Open the AgentFlow web app in browser (localhost:3000 or deployed URL)
- Show the landing page with "Connect Your Wallet" prompt
- Click "Connect Wallet" using RainbowKit modal
- Once connected, show the full dashboard with all panels visible:
  - **Left column**: Portfolio (Base + Arbitrum chain balances) and Yellow Session panel
  - **Center column**: Agent Strategies panel with 3 strategies
  - **Bottom**: Cross-Chain Bridge panel

### NARRATION
> "Here's the AgentFlow dashboard. After connecting my wallet, I get a real-time multi-chain view of my portfolio across Base and Arbitrum - showing ETH, USDC, and WETH balances on each chain.
>
> On the left, we have the Yellow Network session panel. In the center, the agent strategy configuration. And at the bottom, the cross-chain bridge powered by LI.FI."

---

## SCENE 4: Yellow Network - Gasless Trading (1:45 - 2:30)

### ON SCREEN
- Focus on the **Yellow Session** panel
- Type "500" in the deposit amount field
- Click "Open Session" - show the loading state ("Opening...")
- Show the active session with:
  - Status badge: **"active"** (green)
  - Deposited: 500 USDC
  - Balance: 500 USDC
  - Trades: 0
  - Gas Saved: ~$0.00
- (Optional: if you can simulate trades, show the trades counter incrementing and gas savings accumulating)
- Show a diagram or overlay explaining the state channel flow:
  ```
  1 on-chain tx (open) -> 100+ off-chain trades -> 1 on-chain tx (settle)
  ```

### NARRATION
> "Let's start with Yellow Network integration. I'll open a state channel session by depositing 500 USDC. This is the only on-chain transaction needed.
>
> Once the session is active, the agent can execute hundreds of trades completely off-chain - zero gas cost per trade. Each trade is just a signed message between counterparties. When we're done, we settle once on-chain.
>
> For a typical session of 100 trades, that's roughly 78% gas savings compared to executing each swap individually on-chain. This is what makes high-frequency DeFi strategies viable."

---

## SCENE 5: Strategy Engine (2:30 - 3:15)

### ON SCREEN
- Focus on the **Agent Strategies** panel
- Show the three strategy cards:
  1. **Portfolio Rebalancer** - Active (green), "Maintains target allocation across chains and tokens"
  2. **Cross-Chain Arbitrage** - Active (green), "Captures price differences between Base and Arbitrum"
  3. **Yield Optimizer** - Disabled (gray)
- Toggle the Yield Optimizer ON using the switch
- Click **"Run Once"** button - show the "Running..." loading state
- After completion, show updated "Last run: Just now" timestamps
- Scroll down to show the **Risk Limits** section:
  - Max Trade: 1,000 USDC
  - Daily Volume: 10,000 USDC
  - Max Slippage: 1.0%

### NARRATION
> "The core of AgentFlow is the strategy engine. We have three pluggable strategies, each with independent evaluation and priority levels.
>
> The Portfolio Rebalancer monitors allocation drift - if my Base USDC drops below target, it triggers a rebalance. Cross-Chain Arbitrage watches for price spreads between Base and Arbitrum, executing only when profit exceeds 10 basis points. And the Yield Optimizer deploys idle assets to protocols like Aave and Compound when APY is above 3%.
>
> I can enable or disable strategies with a toggle. Let me run the engine once - it evaluates all active strategies, prioritizes decisions, and validates them against risk limits: max 1,000 USDC per trade, 10,000 daily volume cap, and 1% max slippage. These limits are enforced both off-chain in the engine and on-chain in our Uniswap v4 hook."

---

## SCENE 6: Cross-Chain Bridging with LI.FI (3:15 - 3:50)

### ON SCREEN
- Focus on the **Cross-Chain Bridge** panel
- Show the chain selectors: Base -> Arbitrum
- Click the swap arrow to flip to Arbitrum -> Base, then back
- Type "1000" in the amount field
- Click **"Get Quote"** - show loading state
- Display the quote details:
  - You Send: 1,000.00 USDC
  - You Receive: ~999.50 USDC
  - Bridge Fee: ~0.50 USDC
  - Estimated Time: ~120s
  - Bridge: Stargate
  - Footer: "Powered by LI.FI - aggregating the best bridge routes"
- (Do NOT click Bridge - just show the quote)

### NARRATION
> "When the arbitrage strategy detects a cross-chain opportunity, it uses LI.FI for execution. LI.FI aggregates routes across Stargate, Across, Hop, and Circle CCTP to find the cheapest and fastest bridge.
>
> Here I'm quoting a 1,000 USDC bridge from Base to Arbitrum. LI.FI finds a Stargate route with only 0.05% fee and about 2 minutes estimated time. The agent automatically selects the best route and executes when profitable spreads appear."

---

## SCENE 7: Uniswap v4 Hook - MEV Protection (3:50 - 4:20)

### ON SCREEN
- Switch to VS Code or code editor showing `contracts/src/AgentFlowHook.sol`
- Highlight key sections:
  1. The `_beforeSwap` function (lines 122-164) - show authorization check, swap size limit, daily volume check
  2. The `_afterSwap` function (lines 167-187) - show event emission
  3. The `swapsPerBlock` mapping (line 59) - batch privacy tracking
- Show a diagram overlay:
  ```
  beforeSwap:
    1. Check agent authorization
    2. Enforce max swap size
    3. Check daily volume limit
    4. Track batch count

  afterSwap:
    1. Emit AgentSwapExecuted event
    2. Record analytics
  ```

### NARRATION
> "On-chain, our custom Uniswap v4 hook adds critical safety rails. The `beforeSwap` hook checks three things: Is this agent authorized to trade? Does the swap exceed the max size? Would it breach the daily volume limit?
>
> The hook also tracks swaps per block. By batching multiple agent trades into the same block, we obscure individual trade intent - making it much harder for MEV bots to front-run. The `afterSwap` hook logs everything for analytics without affecting execution.
>
> All limits reset automatically every 24 hours. The owner can authorize new agents and adjust risk parameters at any time."

---

## SCENE 8: ENS Decentralized Configuration (4:20 - 4:40)

### ON SCREEN
- Show the ENS config schema in code editor: `packages/integrations/ens/src/config.ts` and `schema.ts`
- Display an example ENS text record JSON (can use a simple graphic):
  ```json
  {
    "version": "1.0",
    "strategies": {
      "rebalance": { "enabled": true, "threshold": 5 },
      "arbitrage": { "enabled": true, "minProfitBps": 10 },
      "yield": { "enabled": false, "minApy": 3 }
    },
    "riskLimits": {
      "maxTradeSize": "1000 USDC",
      "maxDailyVolume": "10000 USDC"
    }
  }
  ```
- Show an ENS name lookup: `myagent.eth -> agentflow.strategy -> JSON config`

### NARRATION
> "Finally, ENS integration. Instead of storing configuration in a database, AgentFlow stores it in ENS text records. Your agent config lives at `agentflow.strategy` under your ENS name - fully on-chain, human-readable, and portable.
>
> Load your config from any interface by just knowing the ENS name. It's validated with Zod schemas on load, with automatic fallback to safe defaults. Decentralized config for a decentralized agent."

---

## SCENE 9: Tech Stack & Architecture Recap (4:40 - 5:00)

### ON SCREEN
- Full architecture diagram with all components labeled
- Tech stack summary:
  ```
  Frontend:  Next.js 14 | React 18 | Tailwind | wagmi + RainbowKit
  Engine:    TypeScript | Strategy Pattern | Zod Validation
  Contracts: Solidity ^0.8.26 | Foundry | Uniswap v4 Hooks
  Infra:     pnpm Monorepo | Base | Arbitrum | Ethereum (ENS)
  ```
- Sponsor integration summary:
  ```
  Yellow Network  -> Gasless state channel trading
  Uniswap v4      -> Hook-based MEV protection & risk controls
  LI.FI           -> Cross-chain bridge aggregation
  ENS             -> Decentralized strategy configuration
  ```

### NARRATION
> "To recap the tech stack: Next.js 14 frontend with wagmi and RainbowKit. TypeScript core engine with pluggable strategies. Solidity smart contracts using Uniswap v4's hook framework, compiled with Foundry. All organized as a pnpm monorepo.
>
> We integrate four sponsor technologies: Yellow Network for gasless trading, Uniswap v4 for on-chain risk controls, LI.FI for cross-chain bridging, and ENS for decentralized configuration."

---

## SCENE 10: Closing (5:00 - 5:15)

### ON SCREEN
- Return to dashboard showing all panels
- Fade to closing slide:
  - **AgentFlow DeFi**
  - "Autonomous AI-Powered Cross-Chain DeFi Agent"
  - "HackMoney 2026"
  - GitHub link / team name

### NARRATION
> "AgentFlow makes DeFi automation accessible, gasless, and MEV-resistant. Thanks for watching - we're AgentFlow, built for HackMoney 2026."

---

## PRODUCTION NOTES

### Recording Tips
1. **Clean browser**: Use a fresh browser profile with no extensions/bookmarks visible
2. **Dark mode**: The app uses a dark slate theme - ensure OS is in dark mode too
3. **Font size**: Zoom browser to 110-125% so text is readable in the recording
4. **Mouse movements**: Move deliberately and slowly so viewers can follow
5. **Pause on each panel**: Hold for 2-3 seconds before narrating about it

### Screen Recording Setup
- **Tool**: OBS Studio, Loom, or QuickTime (macOS)
- **Resolution**: 1920x1080 @ 30fps minimum
- **Audio**: Use a decent microphone, record in a quiet room
- **Cursor**: Enable cursor highlight if your tool supports it

### Code Sections to Have Open in Tabs
1. `contracts/src/AgentFlowHook.sol` - for the Uniswap v4 hook walkthrough
2. `packages/core/src/engine.ts` - for the strategy engine (optional, if time permits)
3. `packages/integrations/ens/src/config.ts` - for ENS config demo

### Pre-Recording Checklist
- [ ] App running locally (`pnpm dev` from `apps/web`)
- [ ] Wallet extension installed (MetaMask or similar) with test account
- [ ] VS Code open with contract and engine files
- [ ] Browser zoom set for readability
- [ ] Screen recording software configured
- [ ] Microphone tested
- [ ] Practice the narration once for timing

### If Short on Time (3-Minute Cut)
Remove Scenes 8 (ENS) and 9 (Tech Recap). Compress Scene 7 (Hook) to just show the `beforeSwap` function briefly. This gets you to ~3 minutes while keeping the core demo flow.

### If Extra Time Available (6+ Minutes)
- Add a Scene showing the `engine.ts` code walkthrough
- Add a Scene showing Foundry tests running (`forge test`)
- Add a Scene showing the LI.FI router code and how quotes are fetched
- Show the monorepo structure in VS Code file explorer
