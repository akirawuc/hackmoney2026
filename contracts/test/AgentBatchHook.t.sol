// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {AgentBatchHook} from "../src/hooks/AgentBatchHook.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {IHooks} from "v4-core/src/interfaces/IHooks.sol";

contract AgentBatchHookTest is Test {
    AgentBatchHook public hook;
    address public owner;
    address public agent1;
    address public agent2;

    function setUp() public {
        owner = address(this);
        agent1 = makeAddr("agent1");
        agent2 = makeAddr("agent2");

        // Deploy with mock pool manager
        // In production tests, would use actual v4 test helpers
        hook = new AgentBatchHook(IPoolManager(address(0)));
    }

    function test_InitialState() public view {
        assertEq(hook.owner(), owner);
        assertEq(hook.currentBatchId(), 0);
        assertEq(hook.getQueueLength(), 0);

        AgentBatchHook.BatchConfig memory config = hook.getBatchConfig();
        assertEq(config.minTradesPerBatch, 3);
        assertEq(config.maxTradesPerBatch, 10);
        assertEq(config.batchTimeout, 30 seconds);
        assertTrue(config.enabled);
    }

    function test_SetAgentAuthorization() public {
        assertFalse(hook.isAgentAuthorized(agent1));

        hook.setAgentAuthorization(agent1, true);
        assertTrue(hook.isAgentAuthorized(agent1));

        hook.setAgentAuthorization(agent1, false);
        assertFalse(hook.isAgentAuthorized(agent1));
    }

    function test_SetAgentAuthorization_RevertIfNotOwner() public {
        vm.prank(agent1);
        vm.expectRevert("Not owner");
        hook.setAgentAuthorization(agent2, true);
    }

    function test_SetBatchConfig() public {
        hook.setBatchConfig(5, 20, 60 seconds, false);

        AgentBatchHook.BatchConfig memory config = hook.getBatchConfig();
        assertEq(config.minTradesPerBatch, 5);
        assertEq(config.maxTradesPerBatch, 20);
        assertEq(config.batchTimeout, 60 seconds);
        assertFalse(config.enabled);
    }

    function test_SetBatchConfig_RevertIfInvalidConfig() public {
        vm.expectRevert("Invalid config");
        hook.setBatchConfig(0, 10, 30 seconds, true);

        vm.expectRevert("Invalid config");
        hook.setBatchConfig(10, 5, 30 seconds, true);
    }

    function test_TransferOwnership() public {
        hook.transferOwnership(agent1);
        assertEq(hook.owner(), agent1);
    }

    function test_TransferOwnership_RevertIfNotOwner() public {
        vm.prank(agent1);
        vm.expectRevert("Not owner");
        hook.transferOwnership(agent2);
    }

    function test_TransferOwnership_RevertIfZeroAddress() public {
        vm.expectRevert("Invalid owner");
        hook.transferOwnership(address(0));
    }

    function test_HookPermissions() public view {
        // Verify hook permissions are set correctly
        // In production, would verify against Hooks library
        // For now, just ensure function doesn't revert
        hook.getHookPermissions();
    }

    function test_MultipleAgents() public {
        hook.setAgentAuthorization(agent1, true);
        hook.setAgentAuthorization(agent2, true);

        assertTrue(hook.isAgentAuthorized(agent1));
        assertTrue(hook.isAgentAuthorized(agent2));

        hook.setAgentAuthorization(agent1, false);
        assertFalse(hook.isAgentAuthorized(agent1));
        assertTrue(hook.isAgentAuthorized(agent2));
    }
}
