'use client';

import type { AIRiskScore } from '@/lib/types';
import { Shield, AlertTriangle, FileCheck, Clock, ArrowUpCircle, TrendingUp, Zap, CheckCircle } from 'lucide-react';

interface AIReasoningCardProps {
  score: AIRiskScore;
}

export function AIReasoningCard({ score }: AIReasoningCardProps) {
  const confidenceColor =
    score.confidenceLevel === 'HIGH' ? 'text-green' :
    score.confidenceLevel === 'MEDIUM' ? 'text-yellow' :
    score.confidenceLevel === 'LOW' ? 'text-yellow' :
    'text-red';

  const trendIcon =
    score.riskTrend === 'INCREASING' ? '📈' :
    score.riskTrend === 'DECREASING' ? '📉' :
    '➡️';

  return (
    <div className="ml-[46px] p-4 bg-surface-2 border border-border rounded-lg animate-in fade-in duration-400 space-y-4">
      {/* Score dial and confidence */}
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

        <div className="flex-1 space-y-2">
          {/* Risk factors header */}
          <div>
            <h4 className="text-xs text-text-muted uppercase tracking-wider mb-2">AI Analysis</h4>
            <ul className="space-y-1.5">
              {score.reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text">
                  <AlertTriangle size={14} className="text-yellow mt-0.5 flex-shrink-0" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {/* Confidence badge */}
          <div className={`inline-flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-surface border border-border ${confidenceColor}`}>
            <Zap size={12} />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {score.confidenceLevel} Confidence ({score.confidence}%)
            </span>
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
            {score.riskTrend && (
              <span className="flex items-center gap-1 text-text-muted">
                {trendIcon}
                {score.riskTrend}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Risk factors breakdown (if provided) */}
      {score.riskFactors && (Object.keys(score.riskFactors).length > 0) && (
        <div className="p-3 bg-surface border border-border rounded-md space-y-2">
          <h5 className="text-xs text-text-muted uppercase tracking-wider font-semibold">Risk Factor Breakdown</h5>
          {score.riskFactors.critical && score.riskFactors.critical.length > 0 && (
            <div>
              <span className="text-xs text-red font-semibold">🔴 Critical:</span>
              <ul className="ml-3 text-xs text-text space-y-1 mt-1">
                {score.riskFactors.critical.map((factor, i) => (
                  <li key={i}>• {factor}</li>
                ))}
              </ul>
            </div>
          )}
          {score.riskFactors.high && score.riskFactors.high.length > 0 && (
            <div>
              <span className="text-xs text-yellow font-semibold">🟠 High:</span>
              <ul className="ml-3 text-xs text-text space-y-1 mt-1">
                {score.riskFactors.high.map((factor, i) => (
                  <li key={i}>• {factor}</li>
                ))}
              </ul>
            </div>
          )}
          {score.riskFactors.medium && score.riskFactors.medium.length > 0 && (
            <div>
              <span className="text-xs text-yellow font-semibold">🟡 Medium:</span>
              <ul className="ml-3 text-xs text-text space-y-1 mt-1">
                {score.riskFactors.medium.slice(0, 2).map((factor, i) => (
                  <li key={i}>• {factor}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Mitigations (if applicable) */}
      {score.mitigations && score.mitigations.length > 0 && (
        <div className="p-3 bg-green/[0.08] border border-green/20 rounded-md">
          <div className="flex items-start gap-2">
            <CheckCircle size={14} className="text-green mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="text-xs text-green font-semibold uppercase tracking-wider mb-1">Mitigations</h5>
              <ul className="text-xs text-text space-y-1">
                {score.mitigations.map((mitigation, i) => (
                  <li key={i}>✓ {mitigation}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="p-3 bg-surface border border-border rounded-md">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={14} className="text-accent" />
          <span className="text-xs text-text-muted uppercase tracking-wider">AI Recommendation</span>
        </div>
        <p className="text-sm text-text">{score.recommendation}</p>
      </div>

      {/* AI Model info */}
      {score.aiModel && (
        <div className="text-[10px] text-text-dim flex items-center gap-1">
          <Zap size={10} />
          Powered by {score.aiModel} | Score ID: {Math.random().toString(36).slice(2, 8).toUpperCase()}
        </div>
      )}
    </div>
  );
}
