'use client';

import type { RiskLevel } from '@/lib/types';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
}

const config: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  DANGER: { bg: 'bg-red/10', text: 'text-red', border: 'border-red/40' },
  CAUTION: { bg: 'bg-yellow/10', text: 'text-yellow', border: 'border-yellow/40' },
  SAFE: { bg: 'bg-green/10', text: 'text-green', border: 'border-green/40' },
};

export function RiskBadge({ level, score }: RiskBadgeProps) {
  const c = config[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${c.bg} ${c.text} ${c.border}`}
    >
      {level}
      {score !== undefined && <span className="font-mono">{score}</span>}
    </span>
  );
}
