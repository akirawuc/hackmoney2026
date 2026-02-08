export const AGENT_FLOW_HOOK_ABI = [
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'maxSwapSize',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'dailyVolumeLimit',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'authorizedAgents',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getRemainingDailyVolume',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [{ name: 'remaining', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'dailyVolume',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'poolManager',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'setAgentAuthorization',
    inputs: [
      { name: 'agent', type: 'address' },
      { name: 'authorized', type: 'bool' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setRiskLimits',
    inputs: [
      { name: '_maxSwapSize', type: 'uint256' },
      { name: '_dailyVolumeLimit', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'AgentAuthorizationChanged',
    inputs: [
      { name: 'agent', type: 'address', indexed: true },
      { name: 'authorized', type: 'bool', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AgentSwapExecuted',
    inputs: [
      { name: 'agent', type: 'address', indexed: true },
      { name: 'poolId', type: 'bytes32', indexed: true },
      { name: 'zeroForOne', type: 'bool', indexed: false },
      { name: 'amountSpecified', type: 'int256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RiskLimitsUpdated',
    inputs: [
      { name: 'maxSwapSize', type: 'uint256', indexed: false },
      { name: 'dailyVolumeLimit', type: 'uint256', indexed: false },
    ],
  },
] as const;

export const DEPLOYED_ADDRESSES = {
  84532: '0x6d8d177010eA33c8A83246A5546C5C6bab5e8e41' as const, // Base Sepolia
} as const;

export const CHAIN_NAMES: Record<number, string> = {
  84532: 'Base Sepolia',
};

export const BLOCK_EXPLORERS: Record<number, string> = {
  84532: 'https://sepolia.basescan.org',
};

export const agentFlowHookConfig = {
  address: DEPLOYED_ADDRESSES[84532],
  abi: AGENT_FLOW_HOOK_ABI,
} as const;
