'use client';

import { useCallback, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useDotSafeStore } from '@/store';
import { BATCH_REVOKER_ABI, ERC20_ABI, CONTRACT_ADDRESSES } from '@/lib/contracts';
import type { ApprovalData } from '@/lib/types';

export function useBatchRevoke() {
  const { selectedIds, scanResult, setAppState, clearSelection } = useDotSafeStore();
  const { writeContractAsync } = useWriteContract();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const selectedApprovals: ApprovalData[] = scanResult?.approvals.filter(
    (a) => selectedIds.has(a.id)
  ) ?? [];

  const batchRevoke = useCallback(async () => {
    if (selectedApprovals.length === 0) return;
    setAppState('REVOKING');

    try {
      const erc20s = selectedApprovals.filter((a) => a.tokenType === 'ERC20');
      const nfts = selectedApprovals.filter((a) => a.tokenType !== 'ERC20');

      // If we have the BatchRevoker contract deployed, use it
      if (CONTRACT_ADDRESSES.batchRevoker !== '0x0000000000000000000000000000000000000000') {
        if (erc20s.length > 0) {
          const hash = await writeContractAsync({
            address: CONTRACT_ADDRESSES.batchRevoker,
            abi: BATCH_REVOKER_ABI,
            functionName: 'batchRevokeERC20',
            args: [
              erc20s.map((a) => a.tokenAddress),
              erc20s.map((a) => a.spenderAddress),
            ],
          });
          setTxHash(hash);
        }

        if (nfts.length > 0) {
          await writeContractAsync({
            address: CONTRACT_ADDRESSES.batchRevoker,
            abi: BATCH_REVOKER_ABI,
            functionName: 'batchRevokeNFT',
            args: [
              nfts.map((a) => a.tokenAddress),
              nfts.map((a) => a.spenderAddress),
            ],
          });
        }
      } else {
        // Fallback: direct approve(spender, 0) calls
        for (const approval of erc20s) {
          const hash = await writeContractAsync({
            address: approval.tokenAddress,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [approval.spenderAddress, 0n],
          });
          setTxHash(hash);
        }
      }

      clearSelection();
      setAppState('SUCCESS');
    } catch (err) {
      setAppState('ERROR');
    }
  }, [selectedApprovals, writeContractAsync, setAppState, clearSelection]);

  const singleRevoke = useCallback(
    async (approval: ApprovalData) => {
      setAppState('REVOKING');
      try {
        const hash = await writeContractAsync({
          address: approval.tokenAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [approval.spenderAddress, 0n],
        });
        setTxHash(hash);
        setAppState('SUCCESS');
      } catch {
        setAppState('ERROR');
      }
    },
    [writeContractAsync, setAppState]
  );

  return {
    batchRevoke,
    singleRevoke,
    selectedApprovals,
    selectedCount: selectedIds.size,
    txHash,
  };
}
