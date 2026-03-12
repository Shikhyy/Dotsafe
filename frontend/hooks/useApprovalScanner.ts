'use client';

import { useCallback, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { useDotSafeStore } from '@/store';
import { fetchApprovalEvents, verifyLiveAllowance, fetchTokenMetadata } from '@/lib/scanner';
import type { ApprovalData, ScanResult } from '@/lib/types';

export function useApprovalScanner() {
  const client = usePublicClient();
  const { setAppState, setScanResult, setError } = useDotSafeStore();
  const [loading, setLoading] = useState(false);

  const scan = useCallback(
    async (walletAddress: `0x${string}`) => {
      if (!client) return;
      setLoading(true);
      setAppState('SCANNING');
      setError(null);

      try {
        // 1. Fetch approval events
        const rawApprovals = await fetchApprovalEvents(client, walletAddress);

        // 2. Verify live allowances & fetch metadata in parallel
        const verified: ApprovalData[] = [];
        const batchSize = 10;

        for (let i = 0; i < rawApprovals.length; i += batchSize) {
          const batch = rawApprovals.slice(i, i + batchSize);
          const results = await Promise.all(
            batch.map(async (approval) => {
              const [liveAllowance, metadata] = await Promise.all([
                approval.tokenType === 'ERC20'
                  ? verifyLiveAllowance(client, approval.tokenAddress, walletAddress, approval.spenderAddress)
                  : Promise.resolve(approval.allowanceRaw),
                fetchTokenMetadata(client, approval.tokenAddress),
              ]);

              // Skip revoked (zero allowance) approvals
              if (liveAllowance === 0n) return null;

              return {
                ...approval,
                allowanceRaw: liveAllowance,
                isUnlimited: liveAllowance >= 2n ** 128n,
                tokenSymbol: metadata.symbol,
                tokenDecimals: metadata.decimals,
              };
            })
          );

          verified.push(...(results.filter(Boolean) as ApprovalData[]));
        }

        const result: ScanResult = {
          walletAddress,
          approvals: verified,
          dangerCount: 0,
          cautionCount: 0,
          safeCount: verified.length,
          overallRiskScore: 0,
          scannedAt: Date.now(),
        };

        setScanResult(result);
        setAppState('SCORING');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Scan failed');
        setAppState('ERROR');
      } finally {
        setLoading(false);
      }
    },
    [client, setAppState, setScanResult, setError]
  );

  return { scan, loading };
}
