'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ApprovalData } from '@/lib/types';
import { RiskBadge } from './RiskBadge';
import { AIReasoningCard } from './AIReasoningCard';
import { truncateAddress, formatAllowance } from '@/lib/scanner';
import { useDotSafeStore } from '@/store';
import { useBatchRevoke } from '@/hooks/useBatchRevoke';
import { ChevronDown, X, Plus, Shield } from 'lucide-react';

function AnimatedScore({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / 800, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) ref.current = requestAnimationFrame(animate);
    };
    ref.current = requestAnimationFrame(animate);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value]);

  return <span className={className}>{display}</span>;
}

function formatAge(timestamp: number): string {
  if (!timestamp) return '';
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

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
  const hasBatchSelection = selectedIds.size > 0;

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
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -200, backgroundColor: 'rgba(0,229,160,0.1)' }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <div
        className={`group grid grid-cols-[24px_1fr_80px] md:grid-cols-[32px_1fr_44px_70px_80px] gap-2 md:gap-3.5 items-center px-3 md:px-4 py-3 border border-border rounded-lg
                    hover:border-border-2 hover:bg-surface-2 transition-all duration-200 cursor-pointer ${rowBg}
                    ${isSelected ? 'border-accent/50 bg-accent/[0.03]' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Risk dot / checkbox */}
        <div className="flex items-center justify-center relative">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelected(approval.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className={`w-3.5 h-3.5 accent-accent cursor-pointer ${hasBatchSelection || isSelected ? 'block' : 'hidden group-hover:block'} absolute`}
          />
          <div className={`w-2.5 h-2.5 rounded-full ${dotClass} ${hasBatchSelection || isSelected ? 'hidden' : 'block group-hover:hidden'}`} />
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
            {approval.approvalTimestamp > 0 && (
              <span className="text-xs text-text-dim hidden md:inline">
                {formatAge(approval.approvalTimestamp)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-text-muted font-mono">
              Spender: {approval.spenderName ? (
                <span className="text-text">{approval.spenderName}</span>
              ) : truncateAddress(approval.spenderAddress)}
            </span>
            <span className="text-xs text-text-dim">
              {approval.isUnlimited ? '∞ Unlimited' : formatAllowance(approval.allowanceRaw, approval.tokenDecimals)}
            </span>
          </div>
        </div>

        {/* Score circle — hidden on mobile */}
        <div className="hidden md:flex items-center justify-center">
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
                <AnimatedScore value={riskScore} />
              </span>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full skeleton" />
          )}
        </div>

        {/* Risk badge — hidden on mobile */}
        <div className="hidden md:block">
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
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-2 mb-1"
          >
            {approval.aiScore ? (
              <AIReasoningCard score={approval.aiScore} />
            ) : (
              <div className="ml-[46px] p-4 bg-surface-2 border border-border rounded-lg text-sm text-text-muted">
                AI scoring in progress...
              </div>
            )}

            {/* Action buttons in expanded view */}
            <div className="ml-[46px] flex items-center gap-2 mt-2">
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
                Revoke This Approval
              </button>
              <a
                href="/policy"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent text-white rounded-md
                           hover:bg-accent/90 transition-all duration-200 cursor-pointer shadow-[0_0_10px_rgba(232,23,93,0.3)]"
              >
                <Shield size={12} />
                Wrap in Policy
              </a>
              {!isSelected && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelected(approval.id);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border-2 text-text-muted rounded-md
                             hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  <Plus size={12} />
                  Add to Batch
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border-2 text-text-muted rounded-md
                           hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <X size={12} />
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
