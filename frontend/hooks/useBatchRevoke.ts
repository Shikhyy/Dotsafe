'use client';

import { useCallback, useState, useEffect } from 'react';
import { useActiveAccount, useActiveWalletChain, useSendTransaction } from 'thirdweb/react';
import { prepareTransaction, getContract, readContract } from 'thirdweb';
import { prepareContractCall } from 'thirdweb';
import { getRpcClient, eth_gasPrice } from 'thirdweb';
import { useDotSafeStore } from '@/store';
import { BATCH_REVOKER_ABI, ERC20_ABI, ERC721_ABI, CONTRACT_ADDRESSES } from '@/lib/contracts';
import { useToast } from '@/components/Toast';
import { polkadotHub, westendAssetHub } from '@/lib/chains';
import { addRevocationRecord } from '@/lib/history';
import { thirdwebClient } from '@/lib/wagmi';
import type { ApprovalData } from '@/lib/types';

function getExplorerUrl(chainId: number): string {
  if (chainId === polkadotHub.id) return polkadotHub.blockExplorers?.[0]?.url ?? '';
  if (chainId === westendAssetHub.id) return westendAssetHub.blockExplorers?.[0]?.url ?? '';
  return '';
}

export function useBatchRevoke() {
  const { selectedIds, scanResult, setAppState, clearSelection, removeApprovals } = useDotSafeStore();
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const { mutateAsync: sendTransaction } = useSendTransaction();
  const { addToast } = useToast();
  const chainId = activeChain?.id ?? polkadotHub.id;
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [gasEstimate, setGasEstimate] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);

  const selectedApprovals: ApprovalData[] = scanResult?.approvals.filter(
    (a) => selectedIds.has(a.id)
  ) ?? [];

  // Estimate gas when selection changes
  useEffect(() => {
    if (selectedApprovals.length === 0) {
      setGasEstimate(null);
      return;
    }

    let cancelled = false;
    setIsEstimating(true);

    (async () => {
      try {
        const chain = activeChain ?? polkadotHub;
        const rpcClient = getRpcClient({ client: thirdwebClient, chain });
        const gasPerRevoke = 50000n;
        const totalGas = gasPerRevoke * BigInt(selectedApprovals.length);
        const gasPrice = await eth_gasPrice(rpcClient);
        const totalCost = totalGas * gasPrice;
        // DOT has 10 decimals
        const costInDot = Number(totalCost) / 10 ** 10;
        if (!cancelled) {
          setGasEstimate(costInDot < 0.0001 ? '<0.0001' : costInDot.toFixed(4));
        }
      } catch {
        if (!cancelled) setGasEstimate(null);
      } finally {
        if (!cancelled) setIsEstimating(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedApprovals.length, activeChain]);

  const batchRevoke = useCallback(async () => {
    if (selectedApprovals.length === 0 || !account) return;
    setAppState('REVOKING');

    try {
      const chain = activeChain ?? polkadotHub;
      const erc20s = selectedApprovals.filter((a) => a.tokenType === 'ERC20');
      const nfts = selectedApprovals.filter((a) => a.tokenType !== 'ERC20');

      let lastTxHash: `0x${string}` | undefined;

      if (CONTRACT_ADDRESSES.batchRevoker !== '0x0000000000000000000000000000000000000000') {
        const batchContract = getContract({
          client: thirdwebClient,
          chain,
          address: CONTRACT_ADDRESSES.batchRevoker,
        });

        if (erc20s.length > 0) {
          const tx = prepareContractCall({
            contract: batchContract,
            method: 'function batchRevokeERC20(address[] tokens, address[] spenders)',
            params: [
              erc20s.map((a) => a.tokenAddress),
              erc20s.map((a) => a.spenderAddress),
            ],
          });
          const result = await sendTransaction(tx);
          lastTxHash = result.transactionHash;
          setTxHash(lastTxHash);
        }

        if (nfts.length > 0) {
          const tx = prepareContractCall({
            contract: batchContract,
            method: 'function batchRevokeNFT(address[] nftContracts, address[] operators)',
            params: [
              nfts.map((a) => a.tokenAddress),
              nfts.map((a) => a.spenderAddress),
            ],
          });
          const result = await sendTransaction(tx);
          lastTxHash = result.transactionHash;
        }
      } else {
        // Fallback: direct approve(spender, 0) calls
        for (const approval of erc20s) {
          const tokenContract = getContract({
            client: thirdwebClient,
            chain,
            address: approval.tokenAddress,
          });
          const tx = prepareContractCall({
            contract: tokenContract,
            method: 'function approve(address spender, uint256 amount) returns (bool)',
            params: [approval.spenderAddress, 0n],
          });
          const result = await sendTransaction(tx);
          lastTxHash = result.transactionHash;
          setTxHash(lastTxHash);
        }
      }

      clearSelection();
      const revokedIds = selectedApprovals.map((a) => a.id);
      // Remove revoked rows after a brief delay (allows exit animation)
      setTimeout(() => removeApprovals(revokedIds), 600);
      setAppState('SUCCESS');

      // Record in history
      for (const a of selectedApprovals) {
        addRevocationRecord({
          tokenAddress: a.tokenAddress,
          tokenSymbol: a.tokenSymbol,
          spenderAddress: a.spenderAddress,
          tokenType: a.tokenType,
          txHash: lastTxHash,
          chainId,
        });
      }

      addToast({
        type: 'success',
        title: 'Approvals Revoked',
        message: `Successfully revoked ${selectedApprovals.length} approval${selectedApprovals.length !== 1 ? 's' : ''}.`,
        txHash: lastTxHash,
        explorerUrl: getExplorerUrl(chainId),
      });
    } catch (err) {
      setAppState('ERROR');
      addToast({
        type: 'error',
        title: 'Revocation Failed',
        message: 'Transaction was rejected or failed. Please try again.',
      });
    }
  }, [selectedApprovals, sendTransaction, setAppState, clearSelection, removeApprovals, addToast, chainId, account, activeChain]);

  const singleRevoke = useCallback(
    async (approval: ApprovalData) => {
      if (!account) return;
      setAppState('REVOKING');
      try {
        const chain = activeChain ?? polkadotHub;
        const tokenContract = getContract({
          client: thirdwebClient,
          chain,
          address: approval.tokenAddress,
        });

        let hash: `0x${string}`;
        if (approval.tokenType === 'ERC20') {
          const tx = prepareContractCall({
            contract: tokenContract,
            method: 'function approve(address spender, uint256 amount) returns (bool)',
            params: [approval.spenderAddress, 0n],
          });
          const result = await sendTransaction(tx);
          hash = result.transactionHash;
        } else {
          const tx = prepareContractCall({
            contract: tokenContract,
            method: 'function setApprovalForAll(address operator, bool approved)',
            params: [approval.spenderAddress, false],
          });
          const result = await sendTransaction(tx);
          hash = result.transactionHash;
        }
        setTxHash(hash);
        // Remove revoked row after brief delay (allows exit animation)
        setTimeout(() => removeApprovals([approval.id]), 600);
        setAppState('SUCCESS');

        addRevocationRecord({
          tokenAddress: approval.tokenAddress,
          tokenSymbol: approval.tokenSymbol,
          spenderAddress: approval.spenderAddress,
          tokenType: approval.tokenType,
          txHash: hash,
          chainId,
        });

        addToast({
          type: 'success',
          title: 'Approval Revoked',
          message: `Revoked ${approval.tokenSymbol || 'token'} approval for ${approval.spenderAddress.slice(0, 8)}...`,
          txHash: hash,
          explorerUrl: getExplorerUrl(chainId),
        });
      } catch {
        setAppState('ERROR');
        addToast({
          type: 'error',
          title: 'Revocation Failed',
          message: 'Transaction was rejected or failed.',
        });
      }
    },
    [sendTransaction, setAppState, addToast, chainId, account, activeChain]
  );

  return {
    batchRevoke,
    singleRevoke,
    selectedApprovals,
    selectedCount: selectedIds.size,
    txHash,
    gasEstimate,
    isEstimating,
  };
}
