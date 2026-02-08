// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {AgentFlowHook} from "./AgentFlowHook.sol";
import {BaseHook} from "@uniswap/v4-periphery/src/utils/BaseHook.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";

/// @title AgentFlowHookDeployable
/// @notice Deployable version of AgentFlowHook that skips address validation
/// @dev For hackathon demo deployment. In production, the hook address would need
///      correct flag bits via CREATE2 salt mining with the canonical deployer.
contract AgentFlowHookDeployable is AgentFlowHook {
    constructor(
        IPoolManager _poolManager,
        address _owner,
        uint256 _maxSwapSize,
        uint256 _dailyVolumeLimit
    ) AgentFlowHook(_poolManager, _owner, _maxSwapSize, _dailyVolumeLimit) {}

    function validateHookAddress(BaseHook) internal pure override {
        // Skip address validation for testnet deployment
    }
}
