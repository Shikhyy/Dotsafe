'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ParachainStatus } from '@/lib/types';
import { Globe, Loader2, Shield, ChevronDown, AlertTriangle } from 'lucide-react';
import { RiskBadge } from '@/components/scanner/RiskBadge';

interface ChainCardProps {
  chain: ParachainStatus;
  onSimulateThreat?: (paraId: number) => Promise<void> | void;
}

export function ChainCard({ chain, onSimulateThreat }: ChainCardProps) {
  const [expanded, setExpanded] = useState(false);
  const hasApprovals = (chain.approvals?.length ?? 0) > 0;

  const borderColor =
    chain.riskLevel === 'DANGER'
      ? 'border-red/30 hover:border-red/50'
      : chain.riskLevel === 'CAUTION'
        ? 'border-yellow/30 hover:border-yellow/50'
        : 'border-border hover:border-border-2';

  return (
    <div
      className={`bg-surface border rounded-xl transition-all duration-200 ${borderColor} ${hasApprovals ? 'cursor-pointer' : ''}`}
      onClick={() => hasApprovals && setExpanded(!expanded)}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-accent" />
            <span className="font-semibold text-sm text-text">{chain.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-dim font-mono">ID: {chain.paraId}</span>
            {hasApprovals && (
              <ChevronDown size={14} className={`text-text-muted transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            )}
          </div>
        </div>

        {chain.isScanning ? (
          <div className="flex items-center gap-2 text-text-muted text-sm">
            <Loader2 size={14} className="animate-spin" />
            Scanning via XCM...
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">{chain.countLabel ?? 'Approvals Found'}</span>
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
                  Risky approvals detected — click to review
                </div>
              </div>
            )}
            {onSimulateThreat && (
                <button
                  onClick={(e) => { e.stopPropagation(); onSimulateThreat(chain.paraId); }}
                  className="w-full mt-3 py-2 bg-surface-2 hover:bg-surface-3 border border-border rounded-lg text-xs font-semibold text-text transition-colors flex items-center justify-center gap-2 group"
                >
                  <AlertTriangle size={14} className="text-yellow group-hover:text-red transition-colors" />
                  Simulate Threat Alert
                </button>
            )}
          </div>
        )}
      </div>

      {/* Expanded approval list */}
      <AnimatePresence>
        {expanded && chain.approvals && chain.approvals.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="px-5 py-3 space-y-2">
              <span className="text-xs text-text-muted uppercase tracking-wider">Chain Approvals</span>
              {chain.approvals.map((approval, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-surface-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      approval.riskLevel === 'DANGER' ? 'bg-red risk-dot-danger' :
                      approval.riskLevel === 'CAUTION' ? 'bg-yellow' : 'bg-green risk-dot-safe'
                    }`} />
                    <div>
                      <span className="text-sm font-semibold text-text">{approval.tokenSymbol}</span>
                      <div className="flex items-center gap-2 text-xs text-text-muted">
                        <span className="font-mono">{approval.spenderAddress}</span>
                        {approval.isUnlimited && <span className="text-yellow">∞ Unlimited</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-text-muted">{approval.riskScore}/100</span>
                    <RiskBadge level={approval.riskLevel} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
