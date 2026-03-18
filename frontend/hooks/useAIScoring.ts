'use client';

import { useCallback } from 'react';
import { useActiveWalletChain } from 'thirdweb/react';
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
  const activeChain = useActiveWalletChain();

  const scoreAll = useCallback(async () => {
    if (!scanResult?.approvals.length) {
      setAppState('IDLE');
      return;
    }

    setAppState('SCORING');

    for (const approval of scanResult.approvals) {
      // Check cache first
      const cached = getCachedScore(approval.spenderAddress);
      if (cached) {
        updateApprovalScore(approval.id, cached);
        continue;
      }

      let success = false;
      let retries = 2; // Try up to 3 times
      
      while (!success && retries >= 0) {
        try {
          const res = await fetch('/api/score-contract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contractAddress: approval.spenderAddress,
              chainId: activeChain?.id ?? 420420421,
              allowanceAmount: approval.allowanceRaw.toString(),
              approvalAge: Math.floor((Date.now() / 1000) - approval.approvalTimestamp),
              isUnlimited: approval.isUnlimited,
              tokenSymbol: approval.tokenSymbol,
            }),
          });

          if (res.status === 429 && retries > 0) {
            // Hit Gemini RPM rate limit. Wait 4.5 seconds and retry.
            await new Promise((r) => setTimeout(r, 4500));
            retries--;
            continue;
          }

          if (!res.ok) throw new Error('Score API failed');

          const score: AIRiskScore = await res.json();
          updateApprovalScore(approval.id, score);
          setCachedScore(approval.spenderAddress, score);
          success = true;
          
          // Add a tiny 250ms delay between successful requests to prevent bursting the API
          await new Promise((r) => setTimeout(r, 250));
          
        } catch {
          if (retries > 0) {
            retries--;
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }
          
          // Score permanently unavailable — don't block UI
          updateApprovalScore(approval.id, {
            riskLevel: 'CAUTION',
            riskScore: 50,
            confidence: 40,
            confidenceLevel: 'LOW',
            reasons: ['Score unavailable — AI Provider Rate Limit'],
            mitigations: ['Consider manual review via blockchain explorers'],
            recommendation: 'Review this approval manually via Subscan. Gemini AI is temporarily rate-limited.',
            isUpgradeable: false,
            isVerified: false,
            contractAge: 0,
            riskTrend: 'STABLE',
            aiModel: 'Gemini 2.0 Flash (Fallback)',
            scoredAt: Date.now(),
          });
          success = true; // Break out of retry loop
        }
      }
    }

    setAppState('IDLE');
  }, [scanResult, updateApprovalScore, setAppState]);

  return { scoreAll };
}
