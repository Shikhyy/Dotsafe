'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ApprovalData } from '@/lib/types';
import { RiskBadge } from './RiskBadge';
import { AIReasoningCard } from './AIReasoningCard';
import { truncateAddress, formatAllowance } from '@/lib/scanner';
import { useDotSafeStore } from '@/store';
import { useBatchRevoke } from '@/hooks/useBatchRevoke';
import { ChevronDown, X } from 'lucide-react';

interface ApprovalRowProps {
  approval: ApprovalData;
  index: number;
}

export function ApprovalRow({ approval, index }: ApprovalRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { selectedIds, toggleSelected, appState } = useDotSafeStore();
  const { singleRevoke } = useBatchRevoke();
  const isSelected = selectedIds.has(approval.id);
  const isRevoking = appState === 'REVOKING';

  const riskLevel = approval.aiScore?.riskLevel ?? 'CAUTION';
  const riskScore = approval.aiScore?.riskScore;

  const dotClass =
    riskLevel === 'DANGER'
      ? 'bg-red risk-dot-danger'
      : riskLevel === 'CAUTION'
        ? 'bg-yellow'
        : 'bg-green risk-dot-safe';

  const rowBg =
    riskLevel === 'DANGER'
      ? 'bg-red/[0.03]'
      : riskLevel === 'CAUTION'
        ? 'bg-yellow/[0.02]'
        : 'bg-transparent';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div
        className={`grid grid-cols-[32px_1fr_44px_70px_80px] gap-3.5 items-center px-4 py-3 border border-border rounded-lg
                    hover:border-border-2 hover:bg-surface-2 transition-all duration-200 cursor-pointer ${rowBg}
                    ${isSelected ? 'border-accent/50' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Risk dot + checkbox */}
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelected(approval.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="hidden group-hover:block peer"
          />
          <div className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />
        </div>

        {/* Token + spender info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-text">
              {approval.tokenSymbol || 'Unknown Token'}
            </span>
            <span className="text-xs text-text-dim px-1.5 py-0.5 bg-surface-2 rounded">
              {approval.tokenType}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-text-muted font-mono">
              Spender: {truncateAddress(approval.spenderAddress)}
            </span>
            <span className="text-xs text-text-dim">
              {approval.isUnlimited ? '∞ Unlimited' : formatAllowance(approval.allowanceRaw, approval.tokenDecimals)}
            </span>
          </div>
        </div>

        {/* Score circle */}
        <div className="flex items-center justify-center">
          {riskScore !== undefined ? (
            <div className="relative w-9 h-9">
              <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="2" className="text-border" />
                <circle
                  cx="18" cy="18" r="15" fill="none" strokeWidth="2" strokeLinecap="round"
                  strokeDasharray={`${(riskScore / 100) * 94.2} 94.2`}
                  className={riskLevel === 'DANGER' ? 'text-red' : riskLevel === 'CAUTION' ? 'text-yellow' : 'text-green'}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-text">
                {riskScore}
              </span>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full skeleton" />
          )}
        </div>

        {/* Risk badge */}
        <div>
          {approval.aiScore ? (
            <RiskBadge level={riskLevel} />
          ) : (
            <div className="h-6 w-16 rounded skeleton" />
          )}
        </div>

        {/* Action */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              singleRevoke(approval);
            }}
            disabled={isRevoking}
            className="px-3 py-1.5 text-xs border border-red/40 text-red rounded-md
                       hover:bg-red hover:text-white transition-all duration-200
                       disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Revoke
          </button>
          <ChevronDown
            size={14}
            className={`text-text-muted transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && approval.aiScore && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-2 mb-1"
          >
            <AIReasoningCard score={approval.aiScore} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
