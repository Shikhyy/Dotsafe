'use client';

import type { ParachainStatus } from '@/lib/types';
import { Globe, Loader2, Shield } from 'lucide-react';
import { RiskBadge } from '@/components/scanner/RiskBadge';

interface ChainCardProps {
  chain: ParachainStatus;
}

export function ChainCard({ chain }: ChainCardProps) {
  const borderColor =
    chain.riskLevel === 'DANGER'
      ? 'border-red/30 hover:border-red/50'
      : chain.riskLevel === 'CAUTION'
        ? 'border-yellow/30 hover:border-yellow/50'
        : 'border-border hover:border-border-2';

  return (
    <div
      className={`p-5 bg-surface border rounded-xl transition-all duration-200 ${borderColor}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-accent" />
          <span className="font-semibold text-sm text-text">{chain.name}</span>
        </div>
        <span className="text-xs text-text-dim font-mono">ID: {chain.paraId}</span>
      </div>

      {chain.isScanning ? (
        <div className="flex items-center gap-2 text-text-muted text-sm">
          <Loader2 size={14} className="animate-spin" />
          Scanning via XCM...
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">Approvals Found</span>
            <span className="font-mono text-lg text-text">{chain.approvalCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-muted">Risk Status</span>
            <RiskBadge level={chain.riskLevel} />
          </div>
          {chain.riskLevel === 'DANGER' && (
            <div className="mt-2 p-2 rounded-md bg-red/[0.05] border border-red/20">
              <div className="flex items-center gap-1.5 text-xs text-red">
                <Shield size={12} />
                Risky approvals detected — review recommended
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
