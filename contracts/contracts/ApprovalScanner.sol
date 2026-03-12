// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/// @title ApprovalScanner
/// @notice On-chain helper for reading live ERC-20/721/1155 approval state
/// @dev Primary indexing happens off-chain via getLogs. This contract provides
///      verification and aggregate helpers for the DotSafe UI.
contract ApprovalScanner {
    /// @notice Check current ERC-20 allowance for a specific (owner, spender) pair
    /// @param token The ERC-20 token contract address
    /// @param owner The wallet that granted the approval
    /// @param spender The contract/address approved to spend
    /// @return The current allowance amount
    function checkAllowance(
        address token,
        address owner,
        address spender
    ) external view returns (uint256) {
        (bool success, bytes memory data) = token.staticcall(
            abi.encodeWithSignature(
                "allowance(address,address)",
                owner,
                spender
            )
        );
        if (!success || data.length < 32) return 0;
        return abi.decode(data, (uint256));
    }

    /// @notice Check if an NFT operator is approved for all tokens
    /// @param nftContract The ERC-721 or ERC-1155 contract address
    /// @param owner The wallet that granted the approval
    /// @param operator The approved operator
    /// @return Whether the operator is approved for all
    function checkApprovalForAll(
        address nftContract,
        address owner,
        address operator
    ) external view returns (bool) {
        (bool success, bytes memory data) = nftContract.staticcall(
            abi.encodeWithSignature(
                "isApprovedForAll(address,address)",
                owner,
                operator
            )
        );
        if (!success || data.length < 32) return false;
        return abi.decode(data, (bool));
    }

    /// @notice Batch-check multiple ERC-20 allowances in a single call
    /// @param tokens Array of token addresses
    /// @param spenders Array of spender addresses (same length as tokens)
    /// @param wallet The owner wallet
    /// @return allowances Array of current allowance values
    function batchCheckAllowances(
        address[] calldata tokens,
        address[] calldata spenders,
        address wallet
    ) external view returns (uint256[] memory allowances) {
        require(tokens.length == spenders.length, "Length mismatch");
        allowances = new uint256[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            (bool success, bytes memory data) = tokens[i].staticcall(
                abi.encodeWithSignature(
                    "allowance(address,address)",
                    wallet,
                    spenders[i]
                )
            );
            if (success && data.length >= 32) {
                allowances[i] = abi.decode(data, (uint256));
            }
        }
    }

    /// @notice Calculate total token value at risk across multiple approvals
    /// @param tokens Array of token addresses
    /// @param spenders Array of spender addresses
    /// @param wallet The owner wallet
    /// @return totalAtRisk Sum of all live allowances (raw amounts)
    function getAtRiskValue(
        address[] calldata tokens,
        address[] calldata spenders,
        address wallet
    ) external view returns (uint256 totalAtRisk) {
        require(tokens.length == spenders.length, "Length mismatch");
        for (uint256 i = 0; i < tokens.length; i++) {
            (bool success, bytes memory data) = tokens[i].staticcall(
                abi.encodeWithSignature(
                    "allowance(address,address)",
                    wallet,
                    spenders[i]
                )
            );
            if (success && data.length >= 32) {
                uint256 allowance = abi.decode(data, (uint256));
                // Cap at a reasonable max to avoid overflow with unlimited approvals
                if (allowance < type(uint128).max) {
                    totalAtRisk += allowance;
                } else {
                    totalAtRisk += type(uint128).max;
                }
            }
        }
    }
}
