import { createPublicClient, http, type Address, type WalletClient } from 'viem';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';
import { AgentConfigSchema, type ENSAgentConfig, getDefaultConfig, serializeConfig } from './schema';

const ENS_TEXT_KEY = 'agentflow.strategy';

export class ENSConfigLoader {
  private client;

  constructor(rpcUrl?: string) {
    this.client = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl || 'https://eth.llamarpc.com'),
    });
  }

  async loadConfig(ensName: string): Promise<ENSAgentConfig> {
    try {
      const normalizedName = normalize(ensName);

      // Get text record from ENS
      const text = await this.client.getEnsText({
        name: normalizedName,
        key: ENS_TEXT_KEY,
      });

      if (!text) {
        console.log(`No config found for ${ensName}, using defaults`);
        return getDefaultConfig();
      }

      // Parse and validate the config
      const data = JSON.parse(text);
      return AgentConfigSchema.parse(data);
    } catch (error) {
      console.error(`Failed to load config from ${ensName}:`, error);
      return getDefaultConfig();
    }
  }

  async resolveAddress(ensName: string): Promise<Address | null> {
    try {
      const normalizedName = normalize(ensName);
      const address = await this.client.getEnsAddress({
        name: normalizedName,
      });
      return address;
    } catch {
      return null;
    }
  }

  async getName(address: Address): Promise<string | null> {
    try {
      const name = await this.client.getEnsName({
        address,
      });
      return name;
    } catch {
      return null;
    }
  }
}

export async function loadAgentConfig(ensName: string): Promise<ENSAgentConfig> {
  const loader = new ENSConfigLoader();
  return loader.loadConfig(ensName);
}

export async function saveAgentConfig(
  walletClient: WalletClient,
  ensName: string,
  config: ENSAgentConfig
): Promise<`0x${string}`> {
  // In production, would set the text record on ENS
  // This requires the wallet to own or control the ENS name

  const text = serializeConfig(config);

  // For hackathon demo, just log the action
  console.log(`Would save config to ${ensName}:`, text);

  // Return mock transaction hash
  return `0x${'c'.repeat(64)}`;
}

// Helper to check if an ENS name has AgentFlow config
export async function hasAgentConfig(ensName: string): Promise<boolean> {
  const loader = new ENSConfigLoader();
  try {
    const normalizedName = normalize(ensName);
    const text = await loader['client'].getEnsText({
      name: normalizedName,
      key: ENS_TEXT_KEY,
    });
    return !!text;
  } catch {
    return false;
  }
}
