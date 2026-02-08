// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Script, console} from "forge-std/Script.sol";
import {AgentFlowHookDeployable} from "../src/AgentFlowHookDeployable.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";

/// @notice Simple deployment script for hackathon demo
/// @dev Deploys AgentFlowHookDeployable without CREATE2 salt mining
contract DeploySimple is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        address poolManager = vm.envAddress("POOL_MANAGER_ADDRESS");
        uint256 maxSwapSize = vm.envOr("MAX_SWAP_SIZE", uint256(100 ether));
        uint256 dailyVolumeLimit = vm.envOr("DAILY_VOLUME_LIMIT", uint256(1000 ether));

        console.log("Deploying AgentFlowHookDeployable...");
        console.log("Deployer:", deployer);
        console.log("Pool Manager:", poolManager);

        vm.startBroadcast(deployerPrivateKey);

        AgentFlowHookDeployable hook = new AgentFlowHookDeployable(
            IPoolManager(poolManager),
            deployer,
            maxSwapSize,
            dailyVolumeLimit
        );

        console.log("AgentFlowHook deployed at:", address(hook));

        // Authorize the deployer as an agent
        hook.setAgentAuthorization(deployer, true);
        console.log("Deployer authorized as agent");

        vm.stopBroadcast();
    }
}
