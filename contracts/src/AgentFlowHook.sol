// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "@uniswap/v4-periphery/src/utils/BaseHook.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";

/// @title AgentFlowHook
/// @notice Uniswap v4 hook for autonomous AI agent trading with authorization and risk controls
/// @dev Implements beforeSwap for authorization checks and afterSwap for batch tracking
contract AgentFlowHook is BaseHook {
    /// @notice Emitted when an agent is authorized or deauthorized
    event AgentAuthorizationChanged(address indexed agent, bool authorized);

    /// @notice Emitted when risk limits are updated
    event RiskLimitsUpdated(uint256 maxSwapSize, uint256 dailyVolumeLimit);

    /// @notice Emitted when a swap is executed through the hook
    event AgentSwapExecuted(
        address indexed agent,
        bytes32 indexed poolId,
        bool zeroForOne,
        int256 amountSpecified,
        uint256 timestamp
    );

    /// @notice Thrown when an unauthorized agent tries to swap
    error UnauthorizedAgent(address agent);

    /// @notice Thrown when swap exceeds risk limits
    error SwapExceedsRiskLimits(int256 amount, uint256 limit);

    /// @notice Thrown when daily volume limit is exceeded
    error DailyVolumeLimitExceeded(uint256 currentVolume, uint256 limit);

    /// @notice Owner of the hook (can authorize agents)
    address public owner;

    /// @notice Mapping of authorized agents
    mapping(address => bool) public authorizedAgents;

    /// @notice Maximum single swap size (in token units)
    uint256 public maxSwapSize;

    /// @notice Daily volume limit per agent
    uint256 public dailyVolumeLimit;

    /// @notice Daily volume tracking per agent (resets daily)
    mapping(address => uint256) public dailyVolume;

    /// @notice Last volume reset timestamp per agent
    mapping(address => uint256) public lastVolumeReset;

    /// @notice Batch tracking for privacy (swap counts per block)
    mapping(uint256 => uint256) public swapsPerBlock;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(
        IPoolManager _poolManager,
        address _owner,
        uint256 _maxSwapSize,
        uint256 _dailyVolumeLimit
    ) BaseHook(_poolManager) {
        owner = _owner;
        maxSwapSize = _maxSwapSize;
        dailyVolumeLimit = _dailyVolumeLimit;
    }

    /// @notice Returns the hook permissions (beforeSwap and afterSwap)
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

    /// @notice Authorize or deauthorize an agent
    /// @param agent The agent address
    /// @param authorized Whether the agent is authorized
    function setAgentAuthorization(address agent, bool authorized) external onlyOwner {
        authorizedAgents[agent] = authorized;
        emit AgentAuthorizationChanged(agent, authorized);
    }

    /// @notice Update risk limits
    /// @param _maxSwapSize New maximum swap size
    /// @param _dailyVolumeLimit New daily volume limit
    function setRiskLimits(uint256 _maxSwapSize, uint256 _dailyVolumeLimit) external onlyOwner {
        maxSwapSize = _maxSwapSize;
        dailyVolumeLimit = _dailyVolumeLimit;
        emit RiskLimitsUpdated(_maxSwapSize, _dailyVolumeLimit);
    }

    /// @notice Transfer ownership
    /// @param newOwner The new owner address
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        owner = newOwner;
    }

    /// @notice Hook called before a swap - enforces authorization and risk limits
    function _beforeSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata params,
        bytes calldata hookData
    ) internal override returns (bytes4, BeforeSwapDelta, uint24) {
        // Decode agent address from hookData (if provided) or use sender
        address agent = hookData.length >= 20 ? abi.decode(hookData, (address)) : sender;

        // Check agent authorization
        if (!authorizedAgents[agent]) {
            revert UnauthorizedAgent(agent);
        }

        // Get absolute swap amount
        uint256 absAmount = params.amountSpecified < 0
            ? uint256(-params.amountSpecified)
            : uint256(params.amountSpecified);

        // Check single swap size limit
        if (absAmount > maxSwapSize) {
            revert SwapExceedsRiskLimits(params.amountSpecified, maxSwapSize);
        }

        // Reset daily volume if new day
        if (block.timestamp - lastVolumeReset[agent] >= 1 days) {
            dailyVolume[agent] = 0;
            lastVolumeReset[agent] = block.timestamp;
        }

        // Check daily volume limit
        if (dailyVolume[agent] + absAmount > dailyVolumeLimit) {
            revert DailyVolumeLimitExceeded(dailyVolume[agent] + absAmount, dailyVolumeLimit);
        }

        // Update daily volume
        dailyVolume[agent] += absAmount;

        // Increment swap count for this block (for batch privacy tracking)
        swapsPerBlock[block.number]++;

        return (this.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    /// @notice Hook called after a swap - logs execution for analytics
    function _afterSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) internal override returns (bytes4, int128) {
        // Decode agent address from hookData (if provided) or use sender
        address agent = hookData.length >= 20 ? abi.decode(hookData, (address)) : sender;

        // Emit swap execution event for tracking
        emit AgentSwapExecuted(
            agent,
            keccak256(abi.encode(key)),
            params.zeroForOne,
            params.amountSpecified,
            block.timestamp
        );

        return (this.afterSwap.selector, 0);
    }

    /// @notice Get the number of swaps in a specific block (for batch analytics)
    /// @param blockNumber The block number to query
    /// @return count Number of swaps in that block
    function getSwapsInBlock(uint256 blockNumber) external view returns (uint256 count) {
        return swapsPerBlock[blockNumber];
    }

    /// @notice Get agent's remaining daily volume allowance
    /// @param agent The agent address
    /// @return remaining Remaining volume allowance
    function getRemainingDailyVolume(address agent) external view returns (uint256 remaining) {
        if (block.timestamp - lastVolumeReset[agent] >= 1 days) {
            return dailyVolumeLimit;
        }
        return dailyVolumeLimit > dailyVolume[agent] ? dailyVolumeLimit - dailyVolume[agent] : 0;
    }
}
