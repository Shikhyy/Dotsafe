export type RiskLevel = 'SAFE' | 'CAUTION' | 'DANGER';
export type ConfidenceLevel = 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH';
export type RiskTrend = 'INCREASING' | 'STABLE' | 'DECREASING';
export type TokenType = 'ERC20' | 'ERC721' | 'ERC1155';

export interface RiskFactors {
  critical?: string[];
  high?: string[];
  medium?: string[];
}

export interface AIRiskScore {
  riskLevel: RiskLevel;
  riskScore: number;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  reasons: string[];
  riskFactors?: RiskFactors;
  mitigations?: string[];
  recommendation: string;
  isUpgradeable: boolean;
  isVerified: boolean;
  contractAge: number;
  isStablecoin?: boolean;
  isDeFiProtocol?: boolean;
  riskTrend?: RiskTrend;
  aiModel?: string;
  scoredAt: number;
}

export interface ApprovalData {
  id: string;
  tokenAddress: `0x${string}`;
  tokenSymbol: string;
  tokenDecimals: number;
  spenderAddress: `0x${string}`;
  spenderName?: string;
  allowanceRaw: bigint;
  isUnlimited: boolean;
  tokenType: TokenType;
  approvalBlock: number;
  approvalTimestamp: number;
  lastUsedTimestamp?: number;
  aiScore?: AIRiskScore;
}

export interface ScanResult {
  walletAddress: string;
  approvals: ApprovalData[];
  dangerCount: number;
  cautionCount: number;
  safeCount: number;
  overallRiskScore: number;
  scannedAt: number;
}

export type AppState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'WRONG_NETWORK'
  | 'SCANNING'
  | 'SCORING'
  | 'IDLE'
  | 'REVOKING'
  | 'SUCCESS'
  | 'ERROR';

export interface ParachainApproval {
  tokenSymbol: string;
  spenderAddress: string;
  isUnlimited: boolean;
  riskLevel: RiskLevel;
  riskScore: number;
}

export interface ParachainStatus {
  paraId: number;
  name: string;
  approvalCount: number;
  riskLevel: RiskLevel;
  isScanning: boolean;
  countLabel?: string;
  approvals?: ParachainApproval[];
}
