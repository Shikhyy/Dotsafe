'use client';

import { motion } from 'framer-motion';
import { useDotSafeStore } from '@/store';
import { Shield, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

export function RiskMeter() {
  const { scanResult } = useDotSafeStore();

  const score = scanResult?.overallRiskScore ?? 0;
  const dangerCount = scanResult?.dangerCount ?? 0;
  const cautionCount = scanResult?.cautionCount ?? 0;
  const safeCount = scanResult?.safeCount ?? 0;
  const total = dangerCount + cautionCount + safeCount;

  const riskColor = score >= 60 ? 'text-red' : score >= 30 ? 'text-yellow' : 'text-green';
  const riskLabel = score >= 60 ? 'High Risk' : score >= 30 ? 'Moderate' : 'Low Risk';

  return (
    <div className="p-4 bg-surface border border-border rounded-xl space-y-4">
      {/* Overall score */}
      <div className="flex items-center gap-3">
        <Shield size={20} className="text-accent" />
        <span className="text-xs text-text-muted uppercase tracking-wider">Risk Score</span>
      </div>

      <div className="flex items-center justify-center">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
            <motion.circle
              cx="48" cy="48" r="40" fill="none" strokeWidth="6" strokeLinecap="round"
              className={riskColor}
              initial={{ strokeDasharray: '0 251.3' }}
              animate={{ strokeDasharray: `${(score / 100) * 251.3} 251.3` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-mono text-2xl font-bold ${riskColor}`}>{score}</span>
            <span className="text-[9px] text-text-muted">{riskLabel}</span>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-red">
            <AlertCircle size={12} /> Danger
          </span>
          <span className="font-mono text-text">{dangerCount}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-yellow">
            <AlertTriangle size={12} /> Caution
          </span>
          <span className="font-mono text-text">{cautionCount}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-green">
            <CheckCircle2 size={12} /> Safe
          </span>
          <span className="font-mono text-text">{safeCount}</span>
        </div>
      </div>

      {/* Total */}
      <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-text-muted">
        <span>Total Approvals</span>
        <span className="font-mono text-text">{total}</span>
      </div>
    </div>
  );
}
