// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title XCMGuard
/// @notice Cross-chain approval monitoring via Polkadot Hub XCM precompile
/// @dev Interfaces with the XCM precompile at 0x00000000000000000000000000000000000a0000
contract XCMGuard {
    /// @notice XCM Precompile address on Polkadot Hub
    address constant XCM_PRECOMPILE = 0x00000000000000000000000000000000000a0000;

    /// @notice Emitted when a cross-chain risk alert is sent
    event CrossChainAlertSent(uint32 indexed paraId, address indexed suspicious);

    /// @notice Emitted when a cross-chain scan is requested
    event CrossChainScanRequested(uint32 indexed paraId, address indexed wallet);

    /// @notice Known parachain IDs for monitoring
    uint32 public constant MOONBEAM_PARA_ID = 2004;
    uint32 public constant ASTAR_PARA_ID = 2006;
    uint32 public constant ACALA_PARA_ID = 2000;

    /// @notice Monitored parachain list
    uint32[] public monitoredParachains;

    /// @notice Tracks which parachains are being monitored
    mapping(uint32 => bool) public isMonitored;

    constructor() {
        monitoredParachains.push(MOONBEAM_PARA_ID);
        monitoredParachains.push(ASTAR_PARA_ID);
        monitoredParachains.push(ACALA_PARA_ID);
        isMonitored[MOONBEAM_PARA_ID] = true;
        isMonitored[ASTAR_PARA_ID] = true;
        isMonitored[ACALA_PARA_ID] = true;
    }

    /// @notice Send a risk alert to a specific parachain via XCM
    /// @param destParaId The destination parachain ID
    /// @param suspicious The suspicious contract address
    /// @param encodedXcmMsg The encoded XCM message payload
    function sendRiskAlert(
        uint32 destParaId,
        address suspicious,
        bytes calldata encodedXcmMsg
    ) external {
        require(isMonitored[destParaId], "Parachain not monitored");

        // Call XCM precompile to send cross-chain message
        (bool success, ) = XCM_PRECOMPILE.call(encodedXcmMsg);
        require(success, "XCM call failed");

        emit CrossChainAlertSent(destParaId, suspicious);
    }

    /// @notice Request a cross-chain scan for a wallet on a specific parachain
    /// @param destParaId The destination parachain ID
    /// @param wallet The wallet address to scan
    /// @param encodedXcmMsg The encoded XCM query message
    function requestCrossChainScan(
        uint32 destParaId,
        address wallet,
        bytes calldata encodedXcmMsg
    ) external {
        require(isMonitored[destParaId], "Parachain not monitored");

        (bool success, ) = XCM_PRECOMPILE.call(encodedXcmMsg);
        require(success, "XCM scan request failed");

        emit CrossChainScanRequested(destParaId, wallet);
    }

    /// @notice Get all monitored parachain IDs
    /// @return Array of parachain IDs
    function getMonitoredParachains() external view returns (uint32[] memory) {
        return monitoredParachains;
    }

    /// @notice Get the number of monitored parachains
    /// @return Count of monitored parachains
    function getMonitoredCount() external view returns (uint256) {
        return monitoredParachains.length;
    }
}
