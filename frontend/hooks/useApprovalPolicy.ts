'use client';

import { useCallback, useEffect, useState } from 'react';
import { useActiveAccount, useActiveWalletChain, useSendTransaction } from 'thirdweb/react';
import { getContract, getRpcClient, eth_getLogs, prepareContractCall, readContract } from 'thirdweb';
import { CONTRACT_ADDRESSES, APPROVAL_POLICY_ABI, ZERO_ADDRESS } from '@/lib/contracts';
import { polkadotHub } from '@/lib/chains';
import { thirdwebClient } from '@/lib/wagmi';
import { useToast } from '@/components/Toast';

export interface PolicyItem {
  id: string;
  tokenAddress: `0x${string}`;
  tokenSymbol: string;
  maxAllowance: string;
  approvalWindow: number;
  whitelistOnly: boolean;
}

export interface WhitelistItem {
  address: `0x${string}`;
  label: string;
}

const POLICY_SET_TOPIC = '0xbebc407851cb2dcdf0fc23c4cd430e0caa9f6314cdd0f14aa0fe40a0a4640003';
const POLICY_REMOVED_TOPIC = '0xe0df14cb7b363e735f6c1ec170d3177c206aec534d306bd8c4efdb834455052f';

function getExplorerUrl(chainId: number): string {
  if (chainId === polkadotHub.id) return polkadotHub.blockExplorers?.[0]?.url ?? '';
  return '';
}

function padAddressTopic(address: string): `0x${string}` {
  return `0x${address.slice(2).padStart(64, '0')}` as `0x${string}`;
}

function formatUnits(value: bigint, decimals: number): string {
  if (value === 0n) return '0';
  const divisor = 10n ** BigInt(decimals);
  const whole = value / divisor;
  const fraction = value % divisor;

  if (fraction === 0n) return whole.toString();

  const fractionText = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${whole.toString()}.${fractionText.slice(0, 4)}`;
}

function parseUnits(value: string, decimals: number): bigint {
  const normalized = value.trim();
  if (!normalized || normalized === '0') return 0n;

  const match = normalized.match(/^\d+(\.\d+)?$/);
  if (!match) {
    throw new Error('Enter a valid numeric allowance.');
  }

  const [whole, fraction = ''] = normalized.split('.');
  const paddedFraction = `${fraction}${'0'.repeat(decimals)}`.slice(0, decimals);
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(paddedFraction || '0');
}

async function fetchTokenMetadata(tokenAddress: `0x${string}`, chainId: number): Promise<{ symbol: string; decimals: number }> {
  const response = await fetch(`/api/token-metadata?address=${tokenAddress}&chainId=${chainId}`);
  if (!response.ok) {
    return { symbol: `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`, decimals: 18 };
  }

  const data = await response.json();
  return {
    symbol: data.symbol || `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`,
    decimals: typeof data.decimals === 'number' ? data.decimals : 18,
  };
}

async function resolveWhitelistLabel(address: `0x${string}`, chainId: number): Promise<string> {
  try {
    const response = await fetch(`/api/resolve-spender?address=${address}&chainId=${chainId}`);
    if (!response.ok) return `${address.slice(0, 8)}...${address.slice(-4)}`;
    const data = await response.json();
    return data.name || `${address.slice(0, 8)}...${address.slice(-4)}`;
  } catch {
    return `${address.slice(0, 8)}...${address.slice(-4)}`;
  }
}

export function useApprovalPolicy() {
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const chain = activeChain ?? polkadotHub;
  const chainId = chain.id;
  const { mutateAsync: sendTransaction } = useSendTransaction();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistItem[]>([]);

  const contractReady = CONTRACT_ADDRESSES.approvalPolicy !== ZERO_ADDRESS;

  const refresh = useCallback(async () => {
    if (!account?.address || !contractReady) {
      setIsRegistered(false);
      setPolicies([]);
      setWhitelist([]);
      return;
    }

    setLoading(true);

    try {
      const contract = getContract({
        client: thirdwebClient,
        chain,
        address: CONTRACT_ADDRESSES.approvalPolicy,
      });

      const registered = await readContract({
        contract,
        method: 'function isRegistered(address wallet) view returns (bool)',
        params: [account.address],
      });
      setIsRegistered(Boolean(registered));

      const whitelistLength = await readContract({
        contract,
        method: 'function whitelistLength(address wallet) view returns (uint256)',
        params: [account.address],
      }) as bigint;

      const whitelistAddresses = await Promise.all(
        Array.from({ length: Number(whitelistLength) }, (_, index) =>
          readContract({
            contract,
            method: 'function whitelistAt(address wallet, uint256 index) view returns (address)',
            params: [account.address, BigInt(index)],
          }) as Promise<`0x${string}`>
        )
      );

      const whitelistRows = await Promise.all(
        whitelistAddresses.map(async (address) => ({
          address,
          label: await resolveWhitelistLabel(address, chainId),
        }))
      );
      setWhitelist(whitelistRows);

      const rpcClient = getRpcClient({ client: thirdwebClient, chain });
      const ownerTopic = padAddressTopic(account.address);

      const [setLogs, removedLogs] = await Promise.all([
        eth_getLogs(rpcClient, {
          fromBlock: 0n,
          toBlock: 'latest',
          topics: [POLICY_SET_TOPIC as `0x${string}`, ownerTopic],
        }).catch(() => []),
        eth_getLogs(rpcClient, {
          fromBlock: 0n,
          toBlock: 'latest',
          topics: [POLICY_REMOVED_TOPIC as `0x${string}`, ownerTopic],
        }).catch(() => []),
      ]);

      const tokenAddresses = new Set<`0x${string}`>();

      for (const log of [...setLogs, ...removedLogs]) {
        const tokenTopic = log.topics?.[2];
        if (!tokenTopic) continue;
        tokenAddresses.add(`0x${tokenTopic.slice(-40)}` as `0x${string}`);
      }

      const policyRows = await Promise.all(
        Array.from(tokenAddresses).map(async (tokenAddress) => {
          const tokenPolicy = await readContract({
            contract,
            method: 'function tokenPolicies(address wallet, address token) view returns (uint256 maxAllowance, uint256 approvalWindow, bool whitelistOnly, bool active)',
            params: [account.address, tokenAddress],
          }) as readonly [bigint, bigint, boolean, boolean];

          const [maxAllowance, approvalWindow, whitelistOnly, active] = tokenPolicy;
          if (!active) return null;

          const metadata = await fetchTokenMetadata(tokenAddress, chainId);
          return {
            id: tokenAddress,
            tokenAddress,
            tokenSymbol: metadata.symbol,
            maxAllowance: maxAllowance === 0n ? '0' : formatUnits(maxAllowance, metadata.decimals),
            approvalWindow: Number(approvalWindow),
            whitelistOnly,
          } satisfies PolicyItem;
        })
      );

      setPolicies(policyRows.filter(Boolean) as PolicyItem[]);
    } catch {
      addToast({
        type: 'error',
        title: 'Policy Sync Failed',
        message: 'Could not load ApprovalPolicy state from the connected chain.',
      });
    } finally {
      setLoading(false);
    }
  }, [account?.address, addToast, chain, chainId, contractReady]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const executeWrite = useCallback(async (title: string, txFactory: () => ReturnType<typeof prepareContractCall>) => {
    if (!account?.address || !contractReady) return false;

    try {
      setSubmitting(true);
      const result = await sendTransaction(txFactory());
      addToast({
        type: 'success',
        title,
        message: 'Transaction submitted successfully.',
        txHash: result.transactionHash,
        explorerUrl: getExplorerUrl(chainId),
      });
      setTimeout(() => {
        void refresh();
      }, 2500);
      return true;
    } catch {
      addToast({
        type: 'error',
        title: 'Transaction Failed',
        message: 'The policy transaction was rejected or failed.',
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [account?.address, addToast, chainId, contractReady, refresh, sendTransaction]);

  const registerWallet = useCallback(async () => {
    const contract = getContract({
      client: thirdwebClient,
      chain,
      address: CONTRACT_ADDRESSES.approvalPolicy,
    });

    return executeWrite('Wallet Registered', () => prepareContractCall({
      contract,
      method: 'function registerWallet()',
      params: [],
    }));
  }, [chain, executeWrite]);

  const addPolicy = useCallback(async (tokenAddress: `0x${string}`, maxAllowanceText: string, approvalWindow: number, whitelistOnly: boolean) => {
    const contract = getContract({
      client: thirdwebClient,
      chain,
      address: CONTRACT_ADDRESSES.approvalPolicy,
    });

    const metadata = await fetchTokenMetadata(tokenAddress, chainId);
    const parsedMaxAllowance = parseUnits(maxAllowanceText || '0', metadata.decimals);

    return executeWrite('Policy Saved', () => prepareContractCall({
      contract,
      method: 'function setTokenPolicy(address token, uint256 maxAllowance, uint256 approvalWindow, bool whitelistOnly)',
      params: [tokenAddress, parsedMaxAllowance, BigInt(approvalWindow), whitelistOnly],
    }));
  }, [chain, chainId, executeWrite]);

  const removePolicy = useCallback(async (tokenAddress: `0x${string}`) => {
    const contract = getContract({
      client: thirdwebClient,
      chain,
      address: CONTRACT_ADDRESSES.approvalPolicy,
    });

    return executeWrite('Policy Removed', () => prepareContractCall({
      contract,
      method: 'function removeTokenPolicy(address token)',
      params: [tokenAddress],
    }));
  }, [chain, executeWrite]);

  const addWhitelistEntry = useCallback(async (spender: `0x${string}`) => {
    const contract = getContract({
      client: thirdwebClient,
      chain,
      address: CONTRACT_ADDRESSES.approvalPolicy,
    });

    return executeWrite('Whitelist Updated', () => prepareContractCall({
      contract,
      method: 'function addToWhitelist(address spender)',
      params: [spender],
    }));
  }, [chain, executeWrite]);

  const removeWhitelistEntry = useCallback(async (spender: `0x${string}`) => {
    const contract = getContract({
      client: thirdwebClient,
      chain,
      address: CONTRACT_ADDRESSES.approvalPolicy,
    });

    return executeWrite('Whitelist Updated', () => prepareContractCall({
      contract,
      method: 'function removeFromWhitelist(address spender)',
      params: [spender],
    }));
  }, [chain, executeWrite]);

  return {
    contractReady,
    loading,
    submitting,
    isRegistered,
    policies,
    whitelist,
    refresh,
    registerWallet,
    addPolicy,
    removePolicy,
    addWhitelistEntry,
    removeWhitelistEntry,
  };
}