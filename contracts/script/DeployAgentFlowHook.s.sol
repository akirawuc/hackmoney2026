// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {AgentFlowHook} from "../src/AgentFlowHook.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {HookMiner} from "./HookMiner.sol";

contract DeployAgentFlowHook is Script {
    // Uniswap v4 PoolManager addresses (update as needed)
    // Base Sepolia: TBD (v4 may not be deployed yet on testnets)
    // For testing, we'll need to deploy our own PoolManager or use a mock

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Configuration
        address poolManager = vm.envAddress("POOL_MANAGER_ADDRESS");
        uint256 maxSwapSize = vm.envOr("MAX_SWAP_SIZE", uint256(100 ether));
        uint256 dailyVolumeLimit = vm.envOr("DAILY_VOLUME_LIMIT", uint256(1000 ether));

        console.log("Deploying AgentFlowHook...");
        console.log("Deployer:", deployer);
        console.log("Pool Manager:", poolManager);
        console.log("Max Swap Size:", maxSwapSize);
        console.log("Daily Volume Limit:", dailyVolumeLimit);

        // Calculate the hook address with correct flags
        uint160 flags = uint160(Hooks.BEFORE_SWAP_FLAG | Hooks.AFTER_SWAP_FLAG);

        // Mine a salt that produces an address with the correct flags
        bytes memory creationCode = type(AgentFlowHook).creationCode;
        bytes memory constructorArgs = abi.encode(
            IPoolManager(poolManager),
            deployer,
            maxSwapSize,
            dailyVolumeLimit
        );

        (address hookAddress, bytes32 salt) = HookMiner.find(
            deployer,
            flags,
            creationCode,
            constructorArgs
        );

        console.log("Computed hook address:", hookAddress);
        console.log("Salt:", vm.toString(salt));

        vm.startBroadcast(deployerPrivateKey);

        // Deploy using CREATE2 with the mined salt
        AgentFlowHook hook = new AgentFlowHook{salt: salt}(
            IPoolManager(poolManager),
            deployer,
            maxSwapSize,
            dailyVolumeLimit
        );

        console.log("AgentFlowHook deployed at:", address(hook));

        // Verify the address matches
        require(address(hook) == hookAddress, "Hook address mismatch");

        vm.stopBroadcast();

        console.log("Deployment complete!");
    }
}
