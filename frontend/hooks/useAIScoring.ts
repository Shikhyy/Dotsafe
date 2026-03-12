'use client';

import { useCallback } from 'react';
import { useDotSafeStore } from '@/store';
import type { AIRiskScore, ApprovalData } from '@/lib/types';

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCachedScore(contractAddress: string): AIRiskScore | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`dotsafe_score_${contractAddress.toLowerCase()}`);
    if (!raw) return null;
    const cached = JSON.parse(raw) as AIRiskScore;
    if (Date.now() - cached.scoredAt > CACHE_TTL) return null;
    return cached;
  } catch {
    return null;
  }
}

function setCachedScore(contractAddress: string, score: AIRiskScore) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`dotsafe_score_${contractAddress.toLowerCase()}`, JSON.stringify(score));
  } catch {
    // localStorage full — ignore
  }
}

export function useAIScoring() {
  const { scanResult, updateApprovalScore, setAppState } = useDotSafeStore();

  const scoreAll = useCallback(async () => {
    if (!scanResult?.approvals.length) {
      setAppState('IDLE');
      return;
    }

    setAppState('SCORING');

    const promises = scanResult.approvals.map(async (approval) => {
      // Check cache first
      const cached = getCachedScore(approval.spenderAddress);
      if (cached) {
        updateApprovalScore(approval.id, cached);
        return;
      }

      try {
        const res = await fetch('/api/score-contract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractAddress: approval.spenderAddress,
            chainId: 420420421,
            allowanceAmount: approval.allowanceRaw.toString(),
            approvalAge: Math.floor((Date.now() / 1000) - approval.approvalTimestamp),
            isUnlimited: approval.isUnlimited,
            tokenSymbol: approval.tokenSymbol,
          }),
        });

        if (!res.ok) throw new Error('Score API failed');

        const score: AIRiskScore = await res.json();
        updateApprovalScore(approval.id, score);
        setCachedScore(approval.spenderAddress, score);
      } catch {
        // Score unavailable — don't block UI
        updateApprovalScore(approval.id, {
          riskLevel: 'CAUTION',
          riskScore: 50,
          reasons: ['Score unavailable — API error'],
          recommendation: 'Review this approval manually.',
          isUpgradeable: false,
          isVerified: false,
          contractAge: 0,
          scoredAt: Date.now(),
        });
      }
    });

    await Promise.allSettled(promises);
    setAppState('IDLE');
  }, [scanResult, updateApprovalScore, setAppState]);

  return { scoreAll };
}
