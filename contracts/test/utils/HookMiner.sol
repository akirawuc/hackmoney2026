// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title HookMiner
/// @notice Utility for mining hook addresses with specific flag requirements
library HookMiner {
    /// @notice Find a salt that produces a hook address with the specified flags
    /// @param deployer The address that will deploy the hook
    /// @param flags The required hook flags
    /// @param creationCode The creation code of the hook contract
    /// @param constructorArgs The encoded constructor arguments
    /// @return hookAddress The computed hook address
    /// @return salt The salt that produces the hook address
    function find(
        address deployer,
        uint160 flags,
        bytes memory creationCode,
        bytes memory constructorArgs
    ) internal pure returns (address hookAddress, bytes32 salt) {
        bytes memory initCode = abi.encodePacked(creationCode, constructorArgs);
        bytes32 initCodeHash = keccak256(initCode);

        for (uint256 i = 0; i < type(uint256).max; i++) {
            salt = bytes32(i);
            hookAddress = computeAddress(deployer, salt, initCodeHash);

            if (uint160(hookAddress) & flags == flags) {
                return (hookAddress, salt);
            }
        }

        revert("HookMiner: could not find salt");
    }

    /// @notice Compute the CREATE2 address for a contract
    /// @param deployer The address that will deploy the contract
    /// @param salt The salt used in CREATE2
    /// @param initCodeHash The keccak256 hash of the init code
    /// @return The computed address
    function computeAddress(
        address deployer,
        bytes32 salt,
        bytes32 initCodeHash
    ) internal pure returns (address) {
        return address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff),
                            deployer,
                            salt,
                            initCodeHash
                        )
                    )
                )
            )
        );
    }
}
