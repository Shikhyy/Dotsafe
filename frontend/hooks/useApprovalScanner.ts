'use client';

import { useCallback, useState } from 'react';
import { useActiveWalletChain } from 'thirdweb/react';
import { useDotSafeStore } from '@/store';
import { fetchApprovalEvents, verifyLiveAllowance, fetchTokenMetadata } from '@/lib/scanner';
import { polkadotHub } from '@/lib/chains';
import type { ApprovalData, ScanResult } from '@/lib/types';

export function useApprovalScanner() {
  const activeChain = useActiveWalletChain();
  const { setAppState, setScanResult, setError } = useDotSafeStore();
  const [loading, setLoading] = useState(false);
  const [blockCount, setBlockCount] = useState(0);

  const scan = useCallback(
    async (walletAddress: `0x${string}`) => {
      const chain = activeChain ?? polkadotHub;
      setLoading(true);
      setBlockCount(0);
      setAppState('SCANNING');
      setError(null);

      try {
        // 1. Fetch approval events
        const rawApprovals = await fetchApprovalEvents(chain, walletAddress, (blocks) => {
          setBlockCount(blocks);
        });

        // 2. Verify live allowances & fetch metadata in parallel
        const verified: ApprovalData[] = [];
        const batchSize = 10;

        for (let i = 0; i < rawApprovals.length; i += batchSize) {
          const batch = rawApprovals.slice(i, i + batchSize);
          const results = await Promise.all(
            batch.map(async (approval) => {
              const [liveAllowance, metadata] = await Promise.all([
                approval.tokenType === 'ERC20'
                  ? verifyLiveAllowance(chain, approval.tokenAddress, walletAddress, approval.spenderAddress)
                  : Promise.resolve(approval.allowanceRaw),
                fetchTokenMetadata(chain, approval.tokenAddress),
              ]);

              // Skip revoked (zero allowance) approvals
              if (liveAllowance === 0n) return null;

              // Attempt to resolve spender name
              let spenderName: string | undefined;
              try {
                const res = await fetch(`/api/resolve-spender?address=${approval.spenderAddress}&chainId=${chain.id}`);
                if (res.ok) {
                  const data = await res.json();
                  if (data.isKnown && data.name) spenderName = data.name;
                }
              } catch {
                // ignore — spender name is optional
              }

              return {
                ...approval,
                allowanceRaw: liveAllowance,
                isUnlimited: liveAllowance >= 2n ** 128n,
                tokenSymbol: metadata.symbol,
                tokenDecimals: metadata.decimals,
                spenderName,
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
    [activeChain, setAppState, setScanResult, setError]
  );

  return { scan, loading, blockCount };
}
