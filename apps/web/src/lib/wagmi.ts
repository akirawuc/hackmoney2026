import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, arbitrum, baseSepolia, arbitrumSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'AgentFlow DeFi',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID || 'demo-project-id',
  chains: [base, arbitrum, baseSepolia, arbitrumSepolia],
  ssr: true,
});
