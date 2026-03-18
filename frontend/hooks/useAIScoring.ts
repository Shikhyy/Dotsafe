'use client';

import { useCallback } from 'react';
import { useActiveWalletChain } from 'thirdweb/react';
import { useDotSafeStore } from '@/store';
import type { AIRiskScore, ApprovalData } from '@/lib/types';

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCachedScore(contractAddress: string): AIRiskScore | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`dotsafe_score_v2_${contractAddress.toLowerCase()}`);
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
    localStorage.setItem(`dotsafe_score_v2_${contractAddress.toLowerCase()}`, JSON.stringify(score));
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

    const uncachedApprovals = [];

    // Check cache first
    for (const approval of scanResult.approvals) {
      const cached = getCachedScore(approval.spenderAddress);
      if (cached) {
        updateApprovalScore(approval.id, cached);
      } else {
        uncachedApprovals.push(approval);
      }
    }

    if (uncachedApprovals.length === 0) {
      setAppState('IDLE');
      return;
    }

    let success = false;
    let retries = 2; // Try up to 3 times
    
    while (!success && retries >= 0) {
      try {
        const payload = {
          chainId: activeChain?.id ?? 420420421,
          approvals: uncachedApprovals.map(a => ({
            id: a.id,
            contractAddress: a.spenderAddress,
            allowanceAmount: a.allowanceRaw.toString(),
            approvalAge: Math.floor((Date.now() / 1000) - a.approvalTimestamp),
            isUnlimited: a.isUnlimited,
            tokenSymbol: a.tokenSymbol,
          }))
        };

        const res = await fetch('/api/score-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.status === 429 && retries > 0) {
          await new Promise((r) => setTimeout(r, 4500));
          retries--;
          continue;
        }

        if (!res.ok) throw new Error('Score API Batch failed');

        const data = await res.json();
        
        for (const score of data.scores) {
           updateApprovalScore(score.id, score);
           
           // Match approval spenderAddress to cache it properly
           const matchingApproval = uncachedApprovals.find(a => a.id === score.id);
           if (matchingApproval) {
               setCachedScore(matchingApproval.spenderAddress, score);
           }
        }
        
        success = true;
      } catch {
        if (retries > 0) {
          retries--;
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        
        // Score permanently unavailable — don't block UI
        for (const approval of uncachedApprovals) {
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
        }
        success = true;
      }
    }

    setAppState('IDLE');
  }, [scanResult, updateApprovalScore, setAppState]);

  return { scoreAll };
}
