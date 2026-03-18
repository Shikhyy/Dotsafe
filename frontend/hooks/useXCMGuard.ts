'use client';

import { useState, useCallback, useEffect } from 'react';
import { getContract, prepareContractCall, readContract } from 'thirdweb';
import { useActiveAccount, useActiveWalletChain, useSendTransaction } from 'thirdweb/react';
import { CONTRACT_ADDRESSES, XCM_GUARD_ABI, ZERO_ADDRESS } from '@/lib/contracts';
import { thirdwebClient } from '@/lib/wagmi';
import { polkadotHub } from '@/lib/chains';
import { useToast } from '@/components/Toast';
import type { ParachainStatus } from '@/lib/types';

const PARACHAINS: ParachainStatus[] = [
  { paraId: 2004, name: 'Moonbeam', approvalCount: 0, riskLevel: 'SAFE', isScanning: false, countLabel: 'Alerts Sent' },
  { paraId: 2006, name: 'Astar', approvalCount: 0, riskLevel: 'SAFE', isScanning: false, countLabel: 'Alerts Sent' },
  { paraId: 2000, name: 'Acala', approvalCount: 0, riskLevel: 'SAFE', isScanning: false, countLabel: 'Alerts Sent' },
];

const PARACHAIN_NAMES: Record<number, string> = {
  2004: 'Moonbeam',
  2006: 'Astar',
  2000: 'Acala',
};

export function useXCMGuard() {
  const [chains, setChains] = useState<ParachainStatus[]>(PARACHAINS);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const chain = activeChain ?? polkadotHub;
  const { mutateAsync: sendTransaction } = useSendTransaction();
  const { addToast } = useToast();

  const contractReady = CONTRACT_ADDRESSES.xcmGuard !== ZERO_ADDRESS;

  const refresh = useCallback(async () => {
    if (!contractReady) {
      setChains(PARACHAINS);
      setTotalAlerts(0);
      return;
    }

    setLoading(true);

    try {
      const contract = getContract({
        client: thirdwebClient,
        chain,
        address: CONTRACT_ADDRESSES.xcmGuard,
        abi: XCM_GUARD_ABI,
      });

      const monitoredParachains = await readContract({
        contract,
        method: 'getMonitoredParachains',
        params: [],
      }) as readonly number[];

      const alertCounts = await Promise.all(
        monitoredParachains.map(async (paraId) => {
          const count = await readContract({
            contract,
            method: 'alertCount',
            params: [paraId],
          }) as bigint;

          return { paraId, count };
        })
      );

      const total = await readContract({
        contract,
        method: 'totalAlerts',
        params: [],
      }) as bigint;

      setChains(alertCounts.map(({ paraId, count }) => ({
        paraId,
        name: PARACHAIN_NAMES[paraId] ?? `Para ${paraId}`,
        approvalCount: Number(count),
        riskLevel: count > 0n ? 'CAUTION' : 'SAFE',
        isScanning: false,
        approvals: [],
        countLabel: 'Alerts Sent',
      })));
      setTotalAlerts(Number(total));
    } catch {
      addToast({
        type: 'error',
        title: 'XCM Sync Failed',
        message: 'Could not read XCMGuard status from the connected chain.',
      });
    } finally {
      setLoading(false);
    }
  }, [addToast, chain, contractReady]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const scanAllParachains = useCallback(async () => {
    if (!contractReady) {
      addToast({
        type: 'warning',
        title: 'XCMGuard Not Configured',
        message: 'Set NEXT_PUBLIC_XCM_GUARD_ADDRESS to read live parachain status.',
      });
      return;
    }

    setScanning(true);
    setChains((prev) => prev.map((c) => ({ ...c, isScanning: true })));

    try {
      if (account?.address) {
        const contract = getContract({
          client: thirdwebClient,
          chain,
          address: CONTRACT_ADDRESSES.xcmGuard,
          abi: XCM_GUARD_ABI,
        });

        for (const parachain of chains) {
          try {
            // Encode paraId + wallet as ABI parameters for the XCM precompile call
            // Format: 32-byte padded uint32 (paraId) + 32-byte padded address (wallet)
            const paraIdHex = parachain.paraId.toString(16).padStart(64, '0');
            const walletHex = account.address.slice(2).padStart(64, '0');
            const xcmPayload = `0x${paraIdHex}${walletHex}` as `0x${string}`;

            const tx = prepareContractCall({
              contract,
              method: 'requestCrossChainScan',
              params: [parachain.paraId, account.address, xcmPayload],
            });
            await sendTransaction(tx);
          } catch {
            // Keep syncing readable state even if the chain is not ready for live XCM payloads.
          }
        }
      }

      await refresh();
      addToast({
        type: 'success',
        title: 'XCM Status Synced',
        message: 'Monitored parachain status was refreshed from XCMGuard.',
      });
    } finally {
      setChains((prev) => prev.map((c) => ({ ...c, isScanning: false })));
      setScanning(false);
    }
  }, [account?.address, addToast, chain, chains, contractReady, refresh, sendTransaction]);

  const simulateThreat = useCallback(async (paraId: number) => {
    if (!contractReady || !account?.address) {
      addToast({ type: 'error', title: 'Wallet Required', message: 'Connect wallet to simulate a threat.' });
      return;
    }

    try {
      const contract = getContract({
        client: thirdwebClient,
        chain,
        address: CONTRACT_ADDRESSES.xcmGuard,
        abi: XCM_GUARD_ABI,
      });

      // Simulated suspicious attacker address
      const suspiciousAddress = '0x1337000000000000000000000000000000001337';
      const encodedXcmMsg = '0x'; // Empty bytes since we are simulating the precompile

      const tx = prepareContractCall({
        contract,
        method: 'sendRiskAlert',
        params: [paraId, suspiciousAddress, encodedXcmMsg],
      });

      await sendTransaction(tx);
      addToast({
        type: 'success',
        title: 'XCM Alert Dispatched',
        message: 'Live cross-chain alert sent to the Passet Hub.'
      });
      setTimeout(() => void refresh(), 4000);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Simulation Failed',
        message: err?.message || 'Transaction reverted.',
      });
    }
  }, [account?.address, addToast, chain, contractReady, refresh, sendTransaction]);

  return { chains, scanning, loading, totalAlerts, contractReady, scanAllParachains, refresh, simulateThreat };
}
