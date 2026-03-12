'use client';

import type { AIRiskScore } from '@/lib/types';
import { Shield, AlertTriangle, FileCheck, Clock, ArrowUpCircle } from 'lucide-react';

interface AIReasoningCardProps {
  score: AIRiskScore;
}

export function AIReasoningCard({ score }: AIReasoningCardProps) {
  return (
    <div className="ml-[46px] p-4 bg-surface-2 border border-border rounded-lg animate-in fade-in duration-400">
      {/* Score dial */}
      <div className="flex items-start gap-6">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-border" />
            <circle
              cx="32" cy="32" r="28" fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${(score.riskScore / 100) * 175.9} 175.9`}
              className={score.riskLevel === 'DANGER' ? 'text-red' : score.riskLevel === 'CAUTION' ? 'text-yellow' : 'text-green'}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold text-text">
            {score.riskScore}
          </span>
        </div>

        <div className="flex-1 space-y-3">
          {/* Risk factors */}
          <div>
            <h4 className="text-xs text-text-muted uppercase tracking-wider mb-2">Risk Factors</h4>
            <ul className="space-y-1.5">
              {score.reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text">
                  <AlertTriangle size={14} className="text-yellow mt-0.5 flex-shrink-0" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="flex items-center gap-1 text-text-muted">
              <Clock size={12} />
              {score.contractAge}d old
            </span>
            <span className={`flex items-center gap-1 ${score.isVerified ? 'text-green' : 'text-red'}`}>
              <FileCheck size={12} />
              {score.isVerified ? 'Verified' : 'Unverified'}
            </span>
            {score.isUpgradeable && (
              <span className="flex items-center gap-1 text-yellow">
                <ArrowUpCircle size={12} />
                Upgradeable
              </span>
            )}
          </div>

          {/* Recommendation */}
          <div className="p-3 bg-surface border border-border rounded-md">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} className="text-accent" />
              <span className="text-xs text-text-muted uppercase tracking-wider">Recommendation</span>
            </div>
            <p className="text-sm text-text">{score.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
