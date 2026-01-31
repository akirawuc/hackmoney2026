// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title HookMiner
/// @notice Library for mining hook addresses with specific permission flags
library HookMiner {
    /// @notice Find a salt that produces a hook address with the specified flags
    /// @param deployer The address that will deploy the hook
    /// @param flags The required permission flags (lowest 14 bits of address)
    /// @param creationCode The creation code of the hook contract
    /// @param constructorArgs The ABI-encoded constructor arguments
    /// @return hookAddress The computed hook address
    /// @return salt The salt to use for CREATE2
    function find(
        address deployer,
        uint160 flags,
        bytes memory creationCode,
        bytes memory constructorArgs
    ) internal pure returns (address hookAddress, bytes32 salt) {
        bytes memory initCode = abi.encodePacked(creationCode, constructorArgs);
        bytes32 initCodeHash = keccak256(initCode);

        uint256 saltCounter = 0;
        while (true) {
            salt = bytes32(saltCounter);
            hookAddress = computeAddress(deployer, salt, initCodeHash);

            // Check if the lowest 14 bits match the required flags
            if (uint160(hookAddress) & 0x3FFF == flags) {
                return (hookAddress, salt);
            }

            saltCounter++;

            // Safety limit to prevent infinite loops
            require(saltCounter < 1_000_000, "HookMiner: could not find valid salt");
        }
    }

    /// @notice Compute the CREATE2 address
    function computeAddress(
        address deployer,
        bytes32 salt,
        bytes32 initCodeHash
    ) internal pure returns (address) {
        return address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(bytes1(0xff), deployer, salt, initCodeHash)
                    )
                )
            )
        );
    }
}
