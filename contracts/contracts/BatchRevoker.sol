// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title BatchRevoker
/// @author DotSafe Team
/// @notice Allows users to revoke multiple token approvals in a single transaction
/// @dev Non-custodial: msg.sender is always the approving party.
///      Built on OpenZeppelin's Ownable, Pausable, and ReentrancyGuard primitives
///      for production-grade security on Polkadot Hub.
contract BatchRevoker is Ownable, Pausable, ReentrancyGuard {
    /// @notice Maximum number of revocations per batch to prevent gas limit issues
    uint256 public constant MAX_BATCH_SIZE = 50;

    /// @notice Total number of successful revocations since deployment
    uint256 public totalRevocations;

    /// @notice Per-user revocation count for analytics
    mapping(address => uint256) public userRevocationCount;

    // ── Events ──────────────────────────────────────────────────────────────
    event BatchRevoked(address indexed wallet, uint256 count);
    event SingleRevokeFailed(address indexed token, address indexed spender, uint256 index);

    // ── Custom Errors (gas-efficient) ───────────────────────────────────────
    error LengthMismatch();
    error EmptyArrays();
    error BatchTooLarge(uint256 size, uint256 max);
    error RevokeFailed(address token, address spender);

    constructor() Ownable(msg.sender) {}

    /// @notice Batch-revoke ERC-20 approvals by setting allowance to 0
    /// @param tokens Array of ERC-20 token contract addresses
    /// @param spenders Array of spender addresses to revoke (same length as tokens)
    function batchRevokeERC20(
        address[] calldata tokens,
        address[] calldata spenders
    ) external whenNotPaused nonReentrant {
        if (tokens.length != spenders.length) revert LengthMismatch();
        if (tokens.length == 0) revert EmptyArrays();
        if (tokens.length > MAX_BATCH_SIZE) revert BatchTooLarge(tokens.length, MAX_BATCH_SIZE);

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

        totalRevocations += successCount;
        userRevocationCount[msg.sender] += successCount;
        emit BatchRevoked(msg.sender, successCount);
    }

    /// @notice Batch-revoke ERC-721/1155 operator approvals
    /// @param nftContracts Array of NFT contract addresses
    /// @param operators Array of operator addresses to revoke
    function batchRevokeNFT(
        address[] calldata nftContracts,
        address[] calldata operators
    ) external whenNotPaused nonReentrant {
        if (nftContracts.length != operators.length) revert LengthMismatch();
        if (nftContracts.length == 0) revert EmptyArrays();
        if (nftContracts.length > MAX_BATCH_SIZE) revert BatchTooLarge(nftContracts.length, MAX_BATCH_SIZE);

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

        totalRevocations += successCount;
        userRevocationCount[msg.sender] += successCount;
        emit BatchRevoked(msg.sender, successCount);
    }

    /// @notice Revoke a single ERC-20 approval (convenience method)
    /// @param token The ERC-20 token address
    /// @param spender The spender to revoke
    function revokeERC20(address token, address spender) external whenNotPaused nonReentrant {
        (bool success, ) = token.call(
            abi.encodeWithSignature(
                "approve(address,uint256)",
                spender,
                0
            )
        );
        if (!success) revert RevokeFailed(token, spender);

        totalRevocations += 1;
        userRevocationCount[msg.sender] += 1;
        emit BatchRevoked(msg.sender, 1);
    }

    // ── Admin Functions (OpenZeppelin Ownable) ──────────────────────────────

    /// @notice Emergency pause — halts all revocation operations
    /// @dev Only callable by contract owner. Uses OZ Pausable.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Resume operations after emergency pause
    function unpause() external onlyOwner {
        _unpause();
    }
}
