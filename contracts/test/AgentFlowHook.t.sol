// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test, console} from "forge-std/Test.sol";
import {AgentFlowHook} from "../src/AgentFlowHook.sol";
import {BaseHook} from "@uniswap/v4-periphery/src/utils/BaseHook.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";

contract AgentFlowHookTest is Test {
    MockAgentFlowHook public hook;
    address public owner;
    address public agent;
    address public poolManager;

    uint256 constant MAX_SWAP_SIZE = 100 ether;
    uint256 constant DAILY_VOLUME_LIMIT = 1000 ether;

    function setUp() public {
        owner = makeAddr("owner");
        agent = makeAddr("agent");
        poolManager = makeAddr("poolManager");

        // Deploy mock hook directly (skips address validation)
        vm.prank(owner);
        hook = new MockAgentFlowHook(
            IPoolManager(poolManager),
            owner,
            MAX_SWAP_SIZE,
            DAILY_VOLUME_LIMIT
        );
    }

    function test_Authorization() public {
        vm.startPrank(owner);

        // Initially agent is not authorized
        assertFalse(hook.authorizedAgents(agent));

        // Authorize agent
        hook.setAgentAuthorization(agent, true);
        assertTrue(hook.authorizedAgents(agent));

        // Deauthorize agent
        hook.setAgentAuthorization(agent, false);
        assertFalse(hook.authorizedAgents(agent));

        vm.stopPrank();
    }

    function test_OnlyOwnerCanAuthorize() public {
        vm.startPrank(agent);

        vm.expectRevert("Only owner");
        hook.setAgentAuthorization(agent, true);

        vm.stopPrank();
    }

    function test_RiskLimits() public {
        vm.startPrank(owner);

        hook.setRiskLimits(200 ether, 2000 ether);

        assertEq(hook.maxSwapSize(), 200 ether);
        assertEq(hook.dailyVolumeLimit(), 2000 ether);

        vm.stopPrank();
    }

    function test_TransferOwnership() public {
        address newOwner = makeAddr("newOwner");

        vm.startPrank(owner);
        hook.transferOwnership(newOwner);
        assertEq(hook.owner(), newOwner);
        vm.stopPrank();

        // Old owner can no longer authorize
        vm.startPrank(owner);
        vm.expectRevert("Only owner");
        hook.setAgentAuthorization(agent, true);
        vm.stopPrank();

        // New owner can authorize
        vm.startPrank(newOwner);
        hook.setAgentAuthorization(agent, true);
        assertTrue(hook.authorizedAgents(agent));
        vm.stopPrank();
    }

    function test_GetHookPermissions() public view {
        Hooks.Permissions memory perms = hook.getHookPermissions();

        assertTrue(perms.beforeSwap);
        assertTrue(perms.afterSwap);
        assertFalse(perms.beforeInitialize);
        assertFalse(perms.afterInitialize);
        assertFalse(perms.beforeAddLiquidity);
        assertFalse(perms.afterAddLiquidity);
    }

    function test_RemainingDailyVolume() public {
        vm.startPrank(owner);
        hook.setAgentAuthorization(agent, true);
        vm.stopPrank();

        // Initially should have full allowance
        assertEq(hook.getRemainingDailyVolume(agent), DAILY_VOLUME_LIMIT);
    }
}

/// @notice Mock hook that skips address validation for testing
contract MockAgentFlowHook is AgentFlowHook {
    constructor(
        IPoolManager _poolManager,
        address _owner,
        uint256 _maxSwapSize,
        uint256 _dailyVolumeLimit
    ) AgentFlowHook(_poolManager, _owner, _maxSwapSize, _dailyVolumeLimit) {}

    function validateHookAddress(BaseHook) internal pure override {
        // Skip validation in tests
    }
}
