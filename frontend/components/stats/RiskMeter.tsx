'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useDotSafeStore } from '@/store';
import { AlertTriangle, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / 800, 1);
      setDisplay(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [value]);

  return <>{display}</>;
}

export function RiskMeter() {
  const { scanResult } = useDotSafeStore();

  const score        = scanResult?.overallRiskScore ?? 0;
  const dangerCount  = scanResult?.dangerCount  ?? 0;
  const cautionCount = scanResult?.cautionCount ?? 0;
  const safeCount    = scanResult?.safeCount    ?? 0;
  const total        = dangerCount + cautionCount + safeCount;

  const aiScores      = scanResult?.approvals?.map(a => a.aiScore?.confidence ?? 0) ?? [];
  const avgConfidence = aiScores.length > 0
    ? Math.round(aiScores.reduce((a, b) => a + b, 0) / aiScores.length)
    : 0;

  const riskHex   = score >= 60 ? '#FF3B5C' : score >= 30 ? '#F5C518' : '#00E5A0';
  const riskClass = score >= 60 ? 'text-red'  : score >= 30 ? 'text-yellow' : 'text-green';
  const riskLabel = score >= 60 ? 'High Risk' : score >= 30 ? 'Moderate'    : 'Low Risk';

  const confHex   = avgConfidence >= 80 ? '#00E5A0' : avgConfidence >= 60 ? '#F5C518' : '#FF3B5C';
  const confClass = avgConfidence >= 80 ? 'text-green' : avgConfidence >= 60 ? 'text-yellow' : 'text-red';
  const confLabel = avgConfidence >= 80 ? 'High' : avgConfidence >= 60 ? 'Solid' : 'Review';

  // r=44 → circumference = 2π×44 ≈ 276.46
  const C = 276.46;

  return (
    <div className="glass-panel rounded-2xl p-4 space-y-4">

      {/* ── hero ring ── */}
      <div className="flex flex-col items-center">
        <p className="self-start text-[0.6rem] uppercase tracking-[0.2em] text-text-muted mb-3">Risk Score</p>
        <div className="relative w-[100px] h-[100px]">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="#1A2530" strokeWidth="8" />
            <motion.circle
              cx="50" cy="50" r="44"
              fill="none" strokeWidth="8" strokeLinecap="round"
              stroke={riskHex}
              initial={{ strokeDasharray: `0 ${C}` }}
              animate={{ strokeDasharray: `${(score / 100) * C} ${C}` }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-mono text-2xl font-bold leading-none ${riskClass}`}>
              <AnimatedNumber value={score} />
            </span>
            <span className="text-[0.58rem] text-text-muted mt-0.5 tracking-wide">{riskLabel}</span>
          </div>
        </div>
      </div>

      {/* ── confidence bar ── */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap size={11} className="text-accent" />
            <span className="text-[0.6rem] uppercase tracking-[0.18em] text-text-muted">AI Confidence</span>
          </div>
          <span className={`font-mono text-xs font-semibold ${confClass}`}>
            <AnimatedNumber value={avgConfidence} />%
          </span>
        </div>
        <div className="glass-chip h-2 w-full rounded-full overflow-hidden" style={{ background: 'rgba(20, 29, 39, 0.86)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: confHex }}
            initial={{ width: '0%' }}
            animate={{ width: `${avgConfidence}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        </div>
        <p className={`text-right text-[0.58rem] ${confClass}`}>{confLabel}</p>
      </div>

      {/* ── stat rows ── */}
      <div className="space-y-1">
        <div className="glass-chip flex items-center justify-between px-2.5 py-1.5 rounded-lg border-red/20 bg-red/5">
          <span className="flex items-center gap-2 text-sm text-red">
            <AlertCircle size={13} /> Danger
          </span>
          <span className="font-mono text-sm font-bold text-text">{dangerCount}</span>
        </div>
        <div className="glass-chip flex items-center justify-between px-2.5 py-1.5 rounded-lg border-yellow/20 bg-yellow/5">
          <span className="flex items-center gap-2 text-sm text-yellow">
            <AlertTriangle size={13} /> Caution
          </span>
          <span className="font-mono text-sm font-bold text-text">{cautionCount}</span>
        </div>
        <div className="glass-chip flex items-center justify-between px-2.5 py-1.5 rounded-lg border-green/20 bg-green/5">
          <span className="flex items-center gap-2 text-sm text-green">
            <CheckCircle2 size={13} /> Safe
          </span>
          <span className="font-mono text-sm font-bold text-text">{safeCount}</span>
        </div>
      </div>

      {/* ── total ── */}
      <div className="border-t border-border/60 pt-3 flex items-center justify-between">
        <span className="text-sm text-text-muted">Total Approvals</span>
        <span className="font-mono text-sm font-bold text-text">{total}</span>
      </div>

      {/* ── AI badge (only after scan) ── */}
      {scanResult?.approvals && scanResult.approvals.length > 0 && (
        <div className="glass-chip flex items-center gap-1.5 px-2 py-1.5 rounded-lg border-accent/20 bg-accent/8">
          <Zap size={11} className="text-accent" />
          <span className="text-[0.6rem] font-semibold text-accent">Gemini 2.0 Flash</span>
        </div>
      )}
    </div>
  );
}
