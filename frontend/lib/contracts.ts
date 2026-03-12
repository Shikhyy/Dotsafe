export const APPROVAL_SCANNER_ABI = [
  {
    inputs: [{ internalType: 'address[]', name: 'tokens', type: 'address[]' }, { internalType: 'address[]', name: 'spenders', type: 'address[]' }, { internalType: 'address', name: 'wallet', type: 'address' }],
    name: 'batchCheckAllowances',
    outputs: [{ internalType: 'uint256[]', name: 'allowances', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }, { internalType: 'address', name: 'owner', type: 'address' }, { internalType: 'address', name: 'spender', type: 'address' }],
    name: 'checkAllowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'nftContract', type: 'address' }, { internalType: 'address', name: 'owner', type: 'address' }, { internalType: 'address', name: 'operator', type: 'address' }],
    name: 'checkApprovalForAll',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address[]', name: 'tokens', type: 'address[]' }, { internalType: 'address[]', name: 'spenders', type: 'address[]' }, { internalType: 'address', name: 'wallet', type: 'address' }],
    name: 'getAtRiskValue',
    outputs: [{ internalType: 'uint256', name: 'totalAtRisk', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const BATCH_REVOKER_ABI = [
  { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'wallet', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'count', type: 'uint256' }], name: 'BatchRevoked', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'address', name: 'token', type: 'address' }, { indexed: true, internalType: 'address', name: 'spender', type: 'address' }, { indexed: false, internalType: 'uint256', name: 'index', type: 'uint256' }], name: 'SingleRevokeFailed', type: 'event' },
  {
    inputs: [{ internalType: 'address[]', name: 'tokens', type: 'address[]' }, { internalType: 'address[]', name: 'spenders', type: 'address[]' }],
    name: 'batchRevokeERC20',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address[]', name: 'nftContracts', type: 'address[]' }, { internalType: 'address[]', name: 'operators', type: 'address[]' }],
    name: 'batchRevokeNFT',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'token', type: 'address' }, { internalType: 'address', name: 'spender', type: 'address' }],
    name: 'revokeERC20',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export const XCM_GUARD_ABI = [
  { anonymous: false, inputs: [{ indexed: true, internalType: 'uint32', name: 'paraId', type: 'uint32' }, { indexed: true, internalType: 'address', name: 'suspicious', type: 'address' }], name: 'CrossChainAlertSent', type: 'event' },
  { anonymous: false, inputs: [{ indexed: true, internalType: 'uint32', name: 'paraId', type: 'uint32' }, { indexed: true, internalType: 'address', name: 'wallet', type: 'address' }], name: 'CrossChainScanRequested', type: 'event' },
  { inputs: [], name: 'ACALA_PARA_ID', outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'ASTAR_PARA_ID', outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'MOONBEAM_PARA_ID', outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getMonitoredCount', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'getMonitoredParachains', outputs: [{ internalType: 'uint32[]', name: '', type: 'uint32[]' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'uint32', name: '', type: 'uint32' }], name: 'isMonitored', outputs: [{ internalType: 'bool', name: '', type: 'bool' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], name: 'monitoredParachains', outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }], stateMutability: 'view', type: 'function' },
  {
    inputs: [{ internalType: 'uint32', name: 'destParaId', type: 'uint32' }, { internalType: 'address', name: 'wallet', type: 'address' }, { internalType: 'bytes', name: 'encodedXcmMsg', type: 'bytes' }],
    name: 'requestCrossChainScan',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint32', name: 'destParaId', type: 'uint32' }, { internalType: 'address', name: 'suspicious', type: 'address' }, { internalType: 'bytes', name: 'encodedXcmMsg', type: 'bytes' }],
    name: 'sendRiskAlert',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export const ERC20_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: 'owner', type: 'address' }, { indexed: true, name: 'spender', type: 'address' }, { indexed: false, name: 'value', type: 'uint256' }],
    name: 'Approval',
    type: 'event',
  },
] as const;

export const ERC721_ABI = [
  {
    inputs: [{ name: 'operator', type: 'address' }, { name: 'approved', type: 'bool' }],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Contract addresses — update after deployment
export const CONTRACT_ADDRESSES = {
  approvalScanner: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  batchRevoker: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  xcmGuard: '0x0000000000000000000000000000000000000000' as `0x${string}`,
} as const;
