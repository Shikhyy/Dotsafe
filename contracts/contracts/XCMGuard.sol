// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/// @title XCMGuard
/// @author DotSafe Team
/// @notice Cross-chain approval monitoring via Polkadot Hub XCM precompile
/// @dev Uses OpenZeppelin AccessControl for role-based administration and
///      Pausable for emergency circuit-breaking. Interfaces with the XCM
///      precompile at 0x00000000000000000000000000000000000a0000.
contract XCMGuard is AccessControl, Pausable {
    /// @notice Role for operators who can send alerts / request scans
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    /// @notice Role for administrators who can manage monitored parachains
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");

    /// @notice XCM Precompile address on Polkadot Hub
    address constant XCM_PRECOMPILE = 0x00000000000000000000000000000000000a0000;

    /// @notice Known parachain IDs for monitoring
    uint32 public constant MOONBEAM_PARA_ID = 2004;
    uint32 public constant ASTAR_PARA_ID = 2006;
    uint32 public constant ACALA_PARA_ID = 2000;

    /// @notice Monitored parachain list
    uint32[] public monitoredParachains;

    /// @notice Tracks which parachains are being monitored
    mapping(uint32 => bool) public isMonitored;

    /// @notice Cross-chain alert count per parachain
    mapping(uint32 => uint256) public alertCount;

    /// @notice Total alerts sent across all chains
    uint256 public totalAlerts;

    // ── Events ──────────────────────────────────────────────────────────────
    event CrossChainAlertSent(uint32 indexed paraId, address indexed suspicious, address indexed sender);
    event CrossChainScanRequested(uint32 indexed paraId, address indexed wallet, address indexed sender);
    event ParachainAdded(uint32 indexed paraId);
    event ParachainRemoved(uint32 indexed paraId);

    // ── Custom Errors ───────────────────────────────────────────────────────
    error ParachainNotMonitored(uint32 paraId);
    error ParachainAlreadyMonitored(uint32 paraId);
    error XCMCallFailed();

    constructor() {
        // Grant all roles to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GUARDIAN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);

        // Initialize default monitored parachains
        _addParachain(MOONBEAM_PARA_ID);
        _addParachain(ASTAR_PARA_ID);
        _addParachain(ACALA_PARA_ID);
    }

    /// @notice Send a risk alert to a specific parachain via XCM
    /// @param destParaId The destination parachain ID
    /// @param suspicious The suspicious contract address
    /// @param encodedXcmMsg The encoded XCM message payload
    function sendRiskAlert(
        uint32 destParaId,
        address suspicious,
        bytes calldata encodedXcmMsg
    ) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        if (!isMonitored[destParaId]) revert ParachainNotMonitored(destParaId);

        // Best-effort XCM call — alert is recorded on-chain regardless of XCM delivery
        if (encodedXcmMsg.length > 0) {
            XCM_PRECOMPILE.call(encodedXcmMsg);
        }

        alertCount[destParaId]++;
        totalAlerts++;
        emit CrossChainAlertSent(destParaId, suspicious, msg.sender);
    }

    /// @notice Request a cross-chain scan for a wallet on a specific parachain
    /// @param destParaId The destination parachain ID
    /// @param wallet The wallet address to scan
    /// @param encodedXcmMsg The encoded XCM query message
    function requestCrossChainScan(
        uint32 destParaId,
        address wallet,
        bytes calldata encodedXcmMsg
    ) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        if (!isMonitored[destParaId]) revert ParachainNotMonitored(destParaId);

        // Best-effort XCM call — scan request is recorded on-chain regardless of XCM delivery
        if (encodedXcmMsg.length > 0) {
            XCM_PRECOMPILE.call(encodedXcmMsg);
        }

        emit CrossChainScanRequested(destParaId, wallet, msg.sender);
    }

    // ── Guardian Admin Functions ─────────────────────────────────────────────

    /// @notice Add a new parachain to the monitoring list
    /// @param paraId The parachain ID to add
    function addParachain(uint32 paraId) external onlyRole(GUARDIAN_ROLE) {
        if (isMonitored[paraId]) revert ParachainAlreadyMonitored(paraId);
        _addParachain(paraId);
        emit ParachainAdded(paraId);
    }

    /// @notice Remove a parachain from the monitoring list
    /// @param paraId The parachain ID to remove
    function removeParachain(uint32 paraId) external onlyRole(GUARDIAN_ROLE) {
        if (!isMonitored[paraId]) revert ParachainNotMonitored(paraId);
        isMonitored[paraId] = false;
        // Remove from array
        for (uint256 i = 0; i < monitoredParachains.length; i++) {
            if (monitoredParachains[i] == paraId) {
                monitoredParachains[i] = monitoredParachains[monitoredParachains.length - 1];
                monitoredParachains.pop();
                break;
            }
        }
        emit ParachainRemoved(paraId);
    }

    /// @notice Emergency pause — halts all XCM operations
    function pause() external onlyRole(GUARDIAN_ROLE) {
        _pause();
    }

    /// @notice Resume XCM operations
    function unpause() external onlyRole(GUARDIAN_ROLE) {
        _unpause();
    }

    // ── View Functions ──────────────────────────────────────────────────────

    /// @notice Get all monitored parachain IDs
    function getMonitoredParachains() external view returns (uint32[] memory) {
        return monitoredParachains;
    }

    /// @notice Get the number of monitored parachains
    function getMonitoredCount() external view returns (uint256) {
        return monitoredParachains.length;
    }

    // ── Internal ────────────────────────────────────────────────────────────

    function _addParachain(uint32 paraId) internal {
        isMonitored[paraId] = true;
        monitoredParachains.push(paraId);
    }
}
