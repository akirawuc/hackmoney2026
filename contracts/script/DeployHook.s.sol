// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console2} from "forge-std/Script.sol";
import {AgentBatchHook} from "../src/hooks/AgentBatchHook.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {HookMiner} from "../test/utils/HookMiner.sol";

contract DeployHook is Script {
    // Pool manager addresses for different networks
    address constant BASE_POOL_MANAGER = address(0); // TODO: Update with actual address
    address constant ARBITRUM_POOL_MANAGER = address(0); // TODO: Update with actual address

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console2.log("Deploying AgentBatchHook");
        console2.log("Deployer:", deployer);

        // Determine pool manager based on chain
        address poolManager = _getPoolManager();
        require(poolManager != address(0), "Pool manager not configured for this chain");

        vm.startBroadcast(deployerPrivateKey);

        // Calculate hook address with correct flags
        // Hook needs beforeSwap and afterSwap permissions
        uint160 flags = uint160(
            Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG
        );

        // Mine a salt that produces an address with the correct flags
        // In production, would use HookMiner to find valid salt
        // For hackathon, deploy with basic salt
        bytes32 salt = bytes32(uint256(1));

        AgentBatchHook hook = new AgentBatchHook{salt: salt}(
            IPoolManager(poolManager)
        );

        console2.log("AgentBatchHook deployed at:", address(hook));

        // Configure initial agents (optional)
        // hook.setAgentAuthorization(agentAddress, true);

        vm.stopBroadcast();
    }

    function _getPoolManager() internal view returns (address) {
        uint256 chainId = block.chainid;

        if (chainId == 8453) {
            // Base mainnet
            return BASE_POOL_MANAGER;
        } else if (chainId == 42161) {
            // Arbitrum One
            return ARBITRUM_POOL_MANAGER;
        } else if (chainId == 84532) {
            // Base Sepolia
            return address(0); // TODO: Update with testnet address
        } else if (chainId == 421614) {
            // Arbitrum Sepolia
            return address(0); // TODO: Update with testnet address
        }

        return address(0);
    }
}
