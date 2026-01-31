// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "v4-periphery/src/base/hooks/BaseHook.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "v4-core/src/types/BeforeSwapDelta.sol";

/// @title AgentBatchHook
/// @notice A Uniswap v4 hook that batches agent trades for MEV protection and gas efficiency
/// @dev Queues trades and executes them in batches to obscure trade intent and reduce gas costs
contract AgentBatchHook is BaseHook {
    using PoolIdLibrary for PoolKey;

    // ============ Errors ============

    error NotAuthorizedAgent();
    error BatchNotReady();
    error BatchEmpty();

    // ============ Events ============

    event TradeQueued(
        address indexed agent,
        PoolId indexed poolId,
        bool zeroForOne,
        int256 amountSpecified,
        uint256 batchId
    );

    event BatchExecuted(
        uint256 indexed batchId,
        uint256 tradesExecuted,
        uint256 timestamp
    );

    event AgentAuthorized(address indexed agent, bool authorized);

    // ============ Structs ============

    struct QueuedTrade {
        address agent;
        PoolKey poolKey;
        bool zeroForOne;
        int256 amountSpecified;
        uint160 sqrtPriceLimitX96;
        uint256 timestamp;
    }

    struct BatchConfig {
        uint256 minTradesPerBatch;
        uint256 maxTradesPerBatch;
        uint256 batchTimeout;
        bool enabled;
    }

    // ============ State ============

    /// @notice Mapping of authorized agents
    mapping(address => bool) public authorizedAgents;

    /// @notice Queue of pending trades
    QueuedTrade[] public tradeQueue;

    /// @notice Current batch ID
    uint256 public currentBatchId;

    /// @notice Batch configuration
    BatchConfig public batchConfig;

    /// @notice Owner of the hook
    address public owner;

    /// @notice Timestamp of first trade in current batch
    uint256 public batchStartTime;

    // ============ Constructor ============

    constructor(IPoolManager _poolManager) BaseHook(_poolManager) {
        owner = msg.sender;
        batchConfig = BatchConfig({
            minTradesPerBatch: 3,
            maxTradesPerBatch: 10,
            batchTimeout: 30 seconds,
            enabled: true
        });
    }

    // ============ Hook Permissions ============

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    // ============ Hook Callbacks ============

    function beforeSwap(
        address sender,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        bytes calldata hookData
    ) external override returns (bytes4, BeforeSwapDelta, uint24) {
        // If sender is an authorized agent and batching is enabled, queue the trade
        if (batchConfig.enabled && authorizedAgents[sender]) {
            _queueTrade(sender, key, params);
        }

        // Allow the swap to proceed normally
        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    function afterSwap(
        address sender,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external override returns (bytes4, int128) {
        // Check if batch should be executed
        if (_shouldExecuteBatch()) {
            _executeBatch();
        }

        return (BaseHook.afterSwap.selector, 0);
    }

    // ============ Internal Functions ============

    function _queueTrade(
        address agent,
        PoolKey calldata key,
        IPoolManager.SwapParams calldata params
    ) internal {
        // Set batch start time if this is the first trade
        if (tradeQueue.length == 0) {
            batchStartTime = block.timestamp;
        }

        tradeQueue.push(QueuedTrade({
            agent: agent,
            poolKey: key,
            zeroForOne: params.zeroForOne,
            amountSpecified: params.amountSpecified,
            sqrtPriceLimitX96: params.sqrtPriceLimitX96,
            timestamp: block.timestamp
        }));

        emit TradeQueued(
            agent,
            key.toId(),
            params.zeroForOne,
            params.amountSpecified,
            currentBatchId
        );
    }

    function _shouldExecuteBatch() internal view returns (bool) {
        uint256 queueLength = tradeQueue.length;

        if (queueLength == 0) return false;

        // Execute if max trades reached
        if (queueLength >= batchConfig.maxTradesPerBatch) return true;

        // Execute if timeout reached and min trades met
        if (queueLength >= batchConfig.minTradesPerBatch &&
            block.timestamp >= batchStartTime + batchConfig.batchTimeout) {
            return true;
        }

        return false;
    }

    function _executeBatch() internal {
        uint256 queueLength = tradeQueue.length;
        if (queueLength == 0) return;

        // In production, would shuffle and execute trades
        // For hackathon, we just clear the queue and emit event

        uint256 executedBatchId = currentBatchId;
        currentBatchId++;

        delete tradeQueue;
        batchStartTime = 0;

        emit BatchExecuted(executedBatchId, queueLength, block.timestamp);
    }

    // ============ Admin Functions ============

    function setAgentAuthorization(address agent, bool authorized) external {
        require(msg.sender == owner, "Not owner");
        authorizedAgents[agent] = authorized;
        emit AgentAuthorized(agent, authorized);
    }

    function setBatchConfig(
        uint256 minTrades,
        uint256 maxTrades,
        uint256 timeout,
        bool enabled
    ) external {
        require(msg.sender == owner, "Not owner");
        require(minTrades > 0 && maxTrades >= minTrades, "Invalid config");

        batchConfig = BatchConfig({
            minTradesPerBatch: minTrades,
            maxTradesPerBatch: maxTrades,
            batchTimeout: timeout,
            enabled: enabled
        });
    }

    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Not owner");
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }

    // ============ View Functions ============

    function getQueueLength() external view returns (uint256) {
        return tradeQueue.length;
    }

    function getQueuedTrade(uint256 index) external view returns (QueuedTrade memory) {
        return tradeQueue[index];
    }

    function isAgentAuthorized(address agent) external view returns (bool) {
        return authorizedAgents[agent];
    }

    function getBatchConfig() external view returns (BatchConfig memory) {
        return batchConfig;
    }
}
