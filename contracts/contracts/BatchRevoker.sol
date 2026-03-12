// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title BatchRevoker
/// @notice Allows users to revoke multiple token approvals in a single transaction
/// @dev msg.sender is always the approving party — no custody risk.
///      Each revoke call is made on behalf of the transaction signer.
contract BatchRevoker {
    event BatchRevoked(address indexed wallet, uint256 count);
    event SingleRevokeFailed(address indexed token, address indexed spender, uint256 index);

    /// @notice Batch-revoke ERC-20 approvals by setting allowance to 0
    /// @param tokens Array of ERC-20 token contract addresses
    /// @param spenders Array of spender addresses to revoke (same length as tokens)
    function batchRevokeERC20(
        address[] calldata tokens,
        address[] calldata spenders
    ) external {
        require(tokens.length == spenders.length, "Length mismatch");
        require(tokens.length > 0, "Empty arrays");

        uint256 successCount = 0;
        for (uint256 i = 0; i < tokens.length; i++) {
            (bool success, ) = tokens[i].call(
                abi.encodeWithSignature(
                    "approve(address,uint256)",
                    spenders[i],
                    0
                )
            );
            if (success) {
                successCount++;
            } else {
                emit SingleRevokeFailed(tokens[i], spenders[i], i);
            }
        }

        emit BatchRevoked(msg.sender, successCount);
    }

    /// @notice Batch-revoke ERC-721/1155 operator approvals
    /// @param nftContracts Array of NFT contract addresses
    /// @param operators Array of operator addresses to revoke
    function batchRevokeNFT(
        address[] calldata nftContracts,
        address[] calldata operators
    ) external {
        require(nftContracts.length == operators.length, "Length mismatch");
        require(nftContracts.length > 0, "Empty arrays");

        uint256 successCount = 0;
        for (uint256 i = 0; i < nftContracts.length; i++) {
            (bool success, ) = nftContracts[i].call(
                abi.encodeWithSignature(
                    "setApprovalForAll(address,bool)",
                    operators[i],
                    false
                )
            );
            if (success) {
                successCount++;
            } else {
                emit SingleRevokeFailed(nftContracts[i], operators[i], i);
            }
        }

        emit BatchRevoked(msg.sender, successCount);
    }

    /// @notice Revoke a single ERC-20 approval (convenience method)
    /// @param token The ERC-20 token address
    /// @param spender The spender to revoke
    function revokeERC20(address token, address spender) external {
        (bool success, ) = token.call(
            abi.encodeWithSignature(
                "approve(address,uint256)",
                spender,
                0
            )
        );
        require(success, "Revoke failed");
        emit BatchRevoked(msg.sender, 1);
    }
}
