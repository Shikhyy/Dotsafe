// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/// @title ApprovalPolicy
/// @author DotSafe Team
/// @notice On-chain policy engine for managing token approval risk on Polkadot Hub.
///         Users register their wallets and define per-token spending limits, spender
///         whitelists/blacklists, and time-bounded approval windows. DApps can query
///         these policies before requesting approvals, and off-chain watchers can
///         enforce them proactively.
/// @dev Deep, non-trivial usage of OpenZeppelin primitives:
///      - AccessControl: multi-role admin (POLICY_ADMIN, BLACKLIST_MANAGER)
///      - Pausable: emergency circuit-breaker for policy registration
///      - EnumerableSet: gas-efficient set operations for whitelist/blacklist
contract ApprovalPolicy is AccessControl, Pausable {
    using EnumerableSet for EnumerableSet.AddressSet;

    // ── Roles ───────────────────────────────────────────────────────────────
    bytes32 public constant POLICY_ADMIN_ROLE = keccak256("POLICY_ADMIN_ROLE");
    bytes32 public constant BLACKLIST_MANAGER_ROLE = keccak256("BLACKLIST_MANAGER_ROLE");

    // ── Structs ─────────────────────────────────────────────────────────────

    /// @notice Per-token approval policy configured by a wallet owner
    struct TokenPolicy {
        uint256 maxAllowance;      // Maximum allowance amount (0 = unlimited)
        uint256 approvalWindow;    // Max duration in seconds (0 = no expiry)
        bool whitelistOnly;        // If true, only whitelisted spenders allowed
        bool active;               // Whether this policy is active
    }

    /// @notice Registered approval with timestamp for expiry tracking
    struct ApprovalRecord {
        uint256 amount;
        uint256 grantedAt;
        uint256 expiresAt;         // 0 = no expiry
    }

    // ── State ───────────────────────────────────────────────────────────────

    /// @notice wallet => token => policy
    mapping(address => mapping(address => TokenPolicy)) public tokenPolicies;

    /// @notice wallet => token => spender => approval record
    mapping(address => mapping(address => mapping(address => ApprovalRecord))) public approvalRecords;

    /// @notice Per-wallet spender whitelist
    mapping(address => EnumerableSet.AddressSet) private _whitelists;

    /// @notice Global spender blacklist (managed by BLACKLIST_MANAGER)
    EnumerableSet.AddressSet private _globalBlacklist;

    /// @notice Number of registered wallets
    uint256 public registeredWalletCount;

    /// @notice Total policies created
    uint256 public totalPoliciesCreated;

    /// @notice Whether a wallet has ever registered
    mapping(address => bool) public isRegistered;

    // ── Events ──────────────────────────────────────────────────────────────
    event PolicySet(address indexed wallet, address indexed token, uint256 maxAllowance, uint256 approvalWindow);
    event PolicyRemoved(address indexed wallet, address indexed token);
    event ApprovalRecorded(address indexed wallet, address indexed token, address indexed spender, uint256 amount, uint256 expiresAt);
    event SpenderWhitelisted(address indexed wallet, address indexed spender);
    event SpenderRemovedFromWhitelist(address indexed wallet, address indexed spender);
    event SpenderBlacklisted(address indexed spender);
    event SpenderUnblacklisted(address indexed spender);
    event WalletRegistered(address indexed wallet);

    // ── Custom Errors ───────────────────────────────────────────────────────
    error ExceedsMaxAllowance(uint256 requested, uint256 max);
    error SpenderNotWhitelisted(address spender);
    error SpenderIsBlacklisted(address spender);
    error ApprovalExpired(address token, address spender);
    error PolicyNotActive(address token);
    error AlreadyRegistered();

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(POLICY_ADMIN_ROLE, msg.sender);
        _grantRole(BLACKLIST_MANAGER_ROLE, msg.sender);
    }

    // ── User Policy Management ──────────────────────────────────────────────

    /// @notice Register wallet for policy management
    function registerWallet() external whenNotPaused {
        if (isRegistered[msg.sender]) revert AlreadyRegistered();
        isRegistered[msg.sender] = true;
        registeredWalletCount++;
        emit WalletRegistered(msg.sender);
    }

    /// @notice Set a per-token approval policy for your wallet
    /// @param token The token address to set policy for
    /// @param maxAllowance Maximum approval amount (0 = no limit)
    /// @param approvalWindow Maximum time window in seconds (0 = no expiry)
    /// @param whitelistOnly Whether to restrict to whitelisted spenders
    function setTokenPolicy(
        address token,
        uint256 maxAllowance,
        uint256 approvalWindow,
        bool whitelistOnly
    ) external whenNotPaused {
        tokenPolicies[msg.sender][token] = TokenPolicy({
            maxAllowance: maxAllowance,
            approvalWindow: approvalWindow,
            whitelistOnly: whitelistOnly,
            active: true
        });
        totalPoliciesCreated++;
        emit PolicySet(msg.sender, token, maxAllowance, approvalWindow);
    }

    /// @notice Remove a token policy
    function removeTokenPolicy(address token) external {
        delete tokenPolicies[msg.sender][token];
        emit PolicyRemoved(msg.sender, token);
    }

    /// @notice Add a spender to your personal whitelist
    function addToWhitelist(address spender) external {
        _whitelists[msg.sender].add(spender);
        emit SpenderWhitelisted(msg.sender, spender);
    }

    /// @notice Remove a spender from your personal whitelist
    function removeFromWhitelist(address spender) external {
        _whitelists[msg.sender].remove(spender);
        emit SpenderRemovedFromWhitelist(msg.sender, spender);
    }

    // ── Approval Validation ─────────────────────────────────────────────────

    /// @notice Record and validate an approval against the wallet's policy
    /// @param token The token being approved
    /// @param spender The spender being granted approval
    /// @param amount The approval amount
    /// @return allowed Whether the approval passes all policy checks
    /// @return reason Human-readable reason if denied (empty if allowed)
    function validateAndRecordApproval(
        address token,
        address spender,
        uint256 amount
    ) external whenNotPaused returns (bool allowed, string memory reason) {
        // Check global blacklist
        if (_globalBlacklist.contains(spender)) {
            revert SpenderIsBlacklisted(spender);
        }

        TokenPolicy storage policy = tokenPolicies[msg.sender][token];

        // If no policy is set, allow by default
        if (!policy.active) {
            return (true, "");
        }

        // Check whitelist requirement
        if (policy.whitelistOnly && !_whitelists[msg.sender].contains(spender)) {
            revert SpenderNotWhitelisted(spender);
        }

        // Check max allowance
        if (policy.maxAllowance > 0 && amount > policy.maxAllowance) {
            revert ExceedsMaxAllowance(amount, policy.maxAllowance);
        }

        // Calculate expiry
        uint256 expiresAt = 0;
        if (policy.approvalWindow > 0) {
            expiresAt = block.timestamp + policy.approvalWindow;
        }

        // Record the approval
        approvalRecords[msg.sender][token][spender] = ApprovalRecord({
            amount: amount,
            grantedAt: block.timestamp,
            expiresAt: expiresAt
        });

        emit ApprovalRecorded(msg.sender, token, spender, amount, expiresAt);
        return (true, "");
    }

    /// @notice Check if a recorded approval has expired
    /// @param wallet The wallet that granted the approval
    /// @param token The approved token
    /// @param spender The approved spender
    /// @return expired Whether the approval has passed its expiry window
    function isApprovalExpired(
        address wallet,
        address token,
        address spender
    ) external view returns (bool expired) {
        ApprovalRecord storage record = approvalRecords[wallet][token][spender];
        if (record.expiresAt == 0) return false;
        return block.timestamp > record.expiresAt;
    }

    // ── Global Blacklist Management (BLACKLIST_MANAGER only) ────────────────

    /// @notice Add a spender to the global blacklist
    function addToBlacklist(address spender) external onlyRole(BLACKLIST_MANAGER_ROLE) {
        _globalBlacklist.add(spender);
        emit SpenderBlacklisted(spender);
    }

    /// @notice Remove a spender from the global blacklist
    function removeFromBlacklist(address spender) external onlyRole(BLACKLIST_MANAGER_ROLE) {
        _globalBlacklist.remove(spender);
        emit SpenderUnblacklisted(spender);
    }

    /// @notice Check if a spender is globally blacklisted
    function isBlacklisted(address spender) external view returns (bool) {
        return _globalBlacklist.contains(spender);
    }

    /// @notice Get the global blacklist length
    function blacklistLength() external view returns (uint256) {
        return _globalBlacklist.length();
    }

    // ── View Helpers ────────────────────────────────────────────────────────

    /// @notice Check if a spender is in a wallet's whitelist
    function isWhitelisted(address wallet, address spender) external view returns (bool) {
        return _whitelists[wallet].contains(spender);
    }

    /// @notice Get the number of whitelisted addresses for a wallet
    function whitelistLength(address wallet) external view returns (uint256) {
        return _whitelists[wallet].length();
    }

    /// @notice Get a whitelisted address by index
    function whitelistAt(address wallet, uint256 index) external view returns (address) {
        return _whitelists[wallet].at(index);
    }

    // ── Admin ───────────────────────────────────────────────────────────────

    /// @notice Emergency pause all policy operations
    function pause() external onlyRole(POLICY_ADMIN_ROLE) {
        _pause();
    }

    /// @notice Resume policy operations
    function unpause() external onlyRole(POLICY_ADMIN_ROLE) {
        _unpause();
    }
}
