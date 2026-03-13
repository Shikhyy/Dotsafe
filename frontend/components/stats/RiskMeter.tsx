'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useDotSafeStore } from '@/store';
import { Shield, AlertTriangle, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / 800, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [value]);

  return <span className={className}>{display}</span>;
}

export function RiskMeter() {
  const { scanResult } = useDotSafeStore();

  const score = scanResult?.overallRiskScore ?? 0;
  const dangerCount = scanResult?.dangerCount ?? 0;
  const cautionCount = scanResult?.cautionCount ?? 0;
  const safeCount = scanResult?.safeCount ?? 0;
  const total = dangerCount + cautionCount + safeCount;
  
  // Calculate average AI confidence from all scores
  const aiScores = scanResult?.approvals?.map(a => a.aiScore?.confidence ?? 0) ?? [];
  const avgConfidence = aiScores.length > 0 ? Math.round(aiScores.reduce((a, b) => a + b, 0) / aiScores.length) : 0;

  const riskColor = score >= 60 ? 'text-red' : score >= 30 ? 'text-yellow' : 'text-green';
  const riskLabel = score >= 60 ? 'High Risk' : score >= 30 ? 'Moderate' : 'Low Risk';

  const confidenceColor = avgConfidence >= 80 ? 'text-green' : avgConfidence >= 60 ? 'text-yellow' : 'text-yellow';

  return (
    <div className="p-4 bg-surface border border-border rounded-xl space-y-4">
      {/* Grid: Overall score + AI Confidence */}
      <div className="grid grid-cols-2 gap-3">
        {/* Overall score */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Shield size={14} className="text-accent" />
            <span className="text-[10px] text-text-muted uppercase tracking-wider">Risk Score</span>
          </div>
          <div className="flex items-center justify-center relative w-full" style={{ aspectRatio: '1' }}>
            <div className="relative w-full" style={{ paddingBottom: '100%' }}>
              <div className="absolute inset-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
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
                  <span className={`font-mono text-lg font-bold ${riskColor}`}><AnimatedNumber value={score} /></span>
                  <span className="text-[8px] text-text-muted">{riskLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Confidence */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-accent" />
            <span className="text-[10px] text-text-muted uppercase tracking-wider">AI Confidence</span>
          </div>
          <div className="flex items-center justify-center relative w-full" style={{ aspectRatio: '1' }}>
            <div className="relative w-full" style={{ paddingBottom: '100%' }}>
              <div className="absolute inset-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
                  <motion.circle
                    cx="48" cy="48" r="40" fill="none" strokeWidth="6" strokeLinecap="round"
                    className={confidenceColor}
                    initial={{ strokeDasharray: '0 251.3' }}
                    animate={{ strokeDasharray: `${(avgConfidence / 100) * 251.3} 251.3` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`font-mono text-lg font-bold ${confidenceColor}`}><AnimatedNumber value={avgConfidence} />%</span>
                  <span className="text-[8px] text-text-muted">
                    {avgConfidence >= 80 ? 'High' : avgConfidence >= 60 ? 'Good' : 'Review'}
                  </span>
                </div>
              </div>
            </div>
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

      {/* AI Badge */}
      {scanResult?.approvals && scanResult.approvals.length > 0 && (
        <div className="pt-2 border-t border-border">
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent/10 border border-accent/20 text-[10px]">
            <Zap size={10} className="text-accent" />
            <span className="text-accent font-semibold">Powered by Gemini 2.0 Flash</span>
          </div>
        </div>
      )}
    </div>
  );
}
