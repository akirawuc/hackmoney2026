import { z } from 'zod';

export const StrategyConfigSchema = z.object({
  rebalance: z.object({
    enabled: z.boolean().default(true),
    targetAllocations: z.record(z.string(), z.number()).default({
      '84532:USDC': 40,
      '84532:WETH': 30,
      '421614:USDC': 20,
      '421614:WETH': 10,
    }),
    rebalanceThreshold: z.number().min(1).max(50).default(5),
  }),
  arbitrage: z.object({
    enabled: z.boolean().default(true),
    minProfitBps: z.number().min(1).max(1000).default(10),
    maxSlippageBps: z.number().min(1).max(500).default(50),
  }),
  yield: z.object({
    enabled: z.boolean().default(false),
    minApy: z.number().min(0).max(100).default(3),
    protocols: z.array(z.string()).default(['aave', 'compound']),
  }),
});

export const RiskLimitsSchema = z.object({
  maxTradeSize: z.string().transform((v) => BigInt(v)).default('1000000000'), // 1000 USDC
  maxDailyVolume: z.string().transform((v) => BigInt(v)).default('10000000000'), // 10000 USDC
  maxSlippage: z.number().min(0.1).max(5).default(1),
});

export const YellowSessionConfigSchema = z.object({
  autoDeposit: z.boolean().default(true),
  depositAmount: z.string().transform((v) => BigInt(v)).default('500000000'), // 500 USDC
  settlementThreshold: z.string().transform((v) => BigInt(v)).default('100000000'), // 100 USDC
});

export const AgentConfigSchema = z.object({
  version: z.string().default('1.0'),
  name: z.string().optional(),
  strategies: StrategyConfigSchema,
  riskLimits: RiskLimitsSchema,
  yellowSession: YellowSessionConfigSchema,
});

export type ENSAgentConfig = z.infer<typeof AgentConfigSchema>;

export function validateConfig(data: unknown): ENSAgentConfig {
  return AgentConfigSchema.parse(data);
}

export function getDefaultConfig(): ENSAgentConfig {
  return AgentConfigSchema.parse({});
}

export function serializeConfig(config: ENSAgentConfig): string {
  // Convert BigInt to strings for JSON serialization
  const serializable = {
    ...config,
    riskLimits: {
      ...config.riskLimits,
      maxTradeSize: config.riskLimits.maxTradeSize.toString(),
      maxDailyVolume: config.riskLimits.maxDailyVolume.toString(),
    },
    yellowSession: {
      ...config.yellowSession,
      depositAmount: config.yellowSession.depositAmount.toString(),
      settlementThreshold: config.yellowSession.settlementThreshold.toString(),
    },
  };
  return JSON.stringify(serializable, null, 2);
}
