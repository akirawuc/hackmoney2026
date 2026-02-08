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
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {BalanceDelta, toBalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";

/// @notice Mock hook that skips address validation for integration testing
contract IntegrationMockAgentFlowHook is AgentFlowHook {
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

contract AgentFlowHookIntegrationTest is Test {
    IntegrationMockAgentFlowHook public hook;
    address public owner;
    address public agent;
    address public poolManager;

    uint256 constant MAX_SWAP_SIZE = 100 ether;
    uint256 constant DAILY_VOLUME_LIMIT = 1000 ether;

    PoolKey internal poolKey;

    function setUp() public {
        owner = makeAddr("owner");
        agent = makeAddr("agent");
        poolManager = makeAddr("poolManager");

        vm.prank(owner);
        hook = new IntegrationMockAgentFlowHook(
            IPoolManager(poolManager),
            owner,
            MAX_SWAP_SIZE,
            DAILY_VOLUME_LIMIT
        );

        // Authorize the agent for tests that need it
        vm.prank(owner);
        hook.setAgentAuthorization(agent, true);

        // Build a dummy PoolKey
        poolKey = PoolKey({
            currency0: Currency.wrap(address(0)),
            currency1: Currency.wrap(address(1)),
            fee: 3000,
            tickSpacing: 60,
            hooks: IHooks(address(hook))
        });
    }

    // ---------------------------------------------------------------
    // Helper: build SwapParams
    // ---------------------------------------------------------------
    function _swapParams(bool zeroForOne, int256 amountSpecified) internal pure returns (SwapParams memory) {
        return SwapParams({
            zeroForOne: zeroForOne,
            amountSpecified: amountSpecified,
            sqrtPriceLimitX96: 0
        });
    }

    // ---------------------------------------------------------------
    // 1. beforeSwap reverts for unauthorized agent
    // ---------------------------------------------------------------
    function test_BeforeSwap_RevertsForUnauthorizedAgent() public {
        address unauthorizedAgent = makeAddr("unauthorizedAgent");

        SwapParams memory params = _swapParams(true, -1 ether);
        bytes memory hookData = abi.encode(unauthorizedAgent);

        vm.prank(poolManager);
        vm.expectRevert(
            abi.encodeWithSelector(AgentFlowHook.UnauthorizedAgent.selector, unauthorizedAgent)
        );
        hook.beforeSwap(address(this), poolKey, params, hookData);
    }

    // ---------------------------------------------------------------
    // 2. beforeSwap reverts when swap exceeds maxSwapSize
    // ---------------------------------------------------------------
    function test_BeforeSwap_RevertsWhenExceedsMaxSwapSize() public {
        // Amount that exceeds the 100 ether max swap size
        int256 oversizedAmount = -int256(MAX_SWAP_SIZE + 1);
        SwapParams memory params = _swapParams(true, oversizedAmount);
        bytes memory hookData = abi.encode(agent);

        vm.prank(poolManager);
        vm.expectRevert(
            abi.encodeWithSelector(
                AgentFlowHook.SwapExceedsRiskLimits.selector,
                oversizedAmount,
                MAX_SWAP_SIZE
            )
        );
        hook.beforeSwap(address(this), poolKey, params, hookData);
    }

    // ---------------------------------------------------------------
    // 3. beforeSwap reverts when daily volume limit exceeded
    // ---------------------------------------------------------------
    function test_BeforeSwap_RevertsWhenDailyVolumeLimitExceeded() public {
        SwapParams memory params = _swapParams(true, -int256(MAX_SWAP_SIZE));
        bytes memory hookData = abi.encode(agent);

        // Execute swaps up to the daily limit (1000 ether / 100 ether = 10 swaps)
        for (uint256 i = 0; i < 10; i++) {
            vm.prank(poolManager);
            hook.beforeSwap(address(this), poolKey, params, hookData);
        }

        // The 11th swap should push past the daily volume limit
        vm.prank(poolManager);
        vm.expectRevert(
            abi.encodeWithSelector(
                AgentFlowHook.DailyVolumeLimitExceeded.selector,
                DAILY_VOLUME_LIMIT + MAX_SWAP_SIZE,
                DAILY_VOLUME_LIMIT
            )
        );
        hook.beforeSwap(address(this), poolKey, params, hookData);
    }

    // ---------------------------------------------------------------
    // 4. Daily volume resets after 24 hours
    // ---------------------------------------------------------------
    function test_DailyVolumeResetsAfter24Hours() public {
        SwapParams memory params = _swapParams(true, -int256(MAX_SWAP_SIZE));
        bytes memory hookData = abi.encode(agent);

        // Use 90% of the daily volume (9 swaps x 100 ether = 900 ether)
        for (uint256 i = 0; i < 9; i++) {
            vm.prank(poolManager);
            hook.beforeSwap(address(this), poolKey, params, hookData);
        }

        // Confirm daily volume is tracked
        assertEq(hook.dailyVolume(agent), 900 ether);

        // Warp 24 hours into the future
        vm.warp(block.timestamp + 1 days);

        // Volume should have logically reset; remaining volume should be the full limit
        assertEq(hook.getRemainingDailyVolume(agent), DAILY_VOLUME_LIMIT);

        // Should be able to swap again since the volume resets in _beforeSwap
        vm.prank(poolManager);
        hook.beforeSwap(address(this), poolKey, params, hookData);

        // After the reset + new swap, daily volume should be 100 ether
        assertEq(hook.dailyVolume(agent), MAX_SWAP_SIZE);
    }

    // ---------------------------------------------------------------
    // 5. swapsPerBlock tracking increments correctly
    // ---------------------------------------------------------------
    function test_SwapsPerBlockIncrementsCorrectly() public {
        SwapParams memory params = _swapParams(true, -1 ether);
        bytes memory hookData = abi.encode(agent);

        uint256 currentBlock = block.number;

        // No swaps yet in this block
        assertEq(hook.getSwapsInBlock(currentBlock), 0);

        // Execute 3 swaps in the same block
        for (uint256 i = 0; i < 3; i++) {
            vm.prank(poolManager);
            hook.beforeSwap(address(this), poolKey, params, hookData);
        }

        assertEq(hook.getSwapsInBlock(currentBlock), 3);

        // Roll to a new block
        vm.roll(currentBlock + 1);

        // New block should have 0 swaps
        assertEq(hook.getSwapsInBlock(currentBlock + 1), 0);

        // Execute 1 swap in the new block
        vm.prank(poolManager);
        hook.beforeSwap(address(this), poolKey, params, hookData);

        assertEq(hook.getSwapsInBlock(currentBlock + 1), 1);

        // Original block count should be unchanged
        assertEq(hook.getSwapsInBlock(currentBlock), 3);
    }

    // ---------------------------------------------------------------
    // 6. afterSwap emits AgentSwapExecuted event
    // ---------------------------------------------------------------
    function test_AfterSwap_EmitsAgentSwapExecutedEvent() public {
        SwapParams memory params = _swapParams(true, -5 ether);
        bytes memory hookData = abi.encode(agent);
        BalanceDelta delta = toBalanceDelta(int128(-5 ether), int128(5 ether));

        bytes32 expectedPoolId = keccak256(abi.encode(poolKey));

        vm.expectEmit(true, true, false, true);
        emit AgentFlowHook.AgentSwapExecuted(
            agent,
            expectedPoolId,
            true,
            -5 ether,
            block.timestamp
        );

        vm.prank(poolManager);
        hook.afterSwap(address(this), poolKey, params, delta, hookData);
    }

    // ---------------------------------------------------------------
    // Bonus: beforeSwap works with positive amountSpecified (exactOut)
    // ---------------------------------------------------------------
    function test_BeforeSwap_WorksWithPositiveAmount() public {
        SwapParams memory params = _swapParams(false, int256(50 ether));
        bytes memory hookData = abi.encode(agent);

        vm.prank(poolManager);
        (bytes4 selector,,) = hook.beforeSwap(address(this), poolKey, params, hookData);

        assertEq(selector, hook.beforeSwap.selector);
        assertEq(hook.dailyVolume(agent), 50 ether);
    }

    // ---------------------------------------------------------------
    // Bonus: beforeSwap uses sender when hookData is empty
    // ---------------------------------------------------------------
    function test_BeforeSwap_UsesSenderWhenHookDataEmpty() public {
        // Authorize the sender address for this test
        address sender = makeAddr("sender");
        vm.prank(owner);
        hook.setAgentAuthorization(sender, true);

        SwapParams memory params = _swapParams(true, -1 ether);
        bytes memory emptyHookData = "";

        vm.prank(poolManager);
        (bytes4 selector,,) = hook.beforeSwap(sender, poolKey, params, emptyHookData);

        assertEq(selector, hook.beforeSwap.selector);
        assertEq(hook.dailyVolume(sender), 1 ether);
    }

    // ---------------------------------------------------------------
    // Bonus: afterSwap uses sender when hookData is empty
    // ---------------------------------------------------------------
    function test_AfterSwap_UsesSenderWhenHookDataEmpty() public {
        address sender = makeAddr("sender");
        SwapParams memory params = _swapParams(true, -2 ether);
        BalanceDelta delta = toBalanceDelta(int128(-2 ether), int128(2 ether));
        bytes memory emptyHookData = "";

        bytes32 expectedPoolId = keccak256(abi.encode(poolKey));

        vm.expectEmit(true, true, false, true);
        emit AgentFlowHook.AgentSwapExecuted(
            sender,
            expectedPoolId,
            true,
            -2 ether,
            block.timestamp
        );

        vm.prank(poolManager);
        hook.afterSwap(sender, poolKey, params, delta, emptyHookData);
    }
}
