import { getRpcClient, eth_getLogs, eth_call, eth_blockNumber } from 'thirdweb';
import { thirdwebClient } from './wagmi';
import { polkadotHub } from './chains';
import type { ApprovalData } from './types';

const MAX_UINT256 = 2n ** 256n - 1n;
const UNLIMITED_THRESHOLD = 2n ** 128n;

const APPROVAL_TOPIC = '0x8c5be1e5ebec7d5bd14f714b5698a583299b7726e68f51610a89790d80e241dc'; // keccak256('Approval(address,address,uint256)')
const APPROVAL_FOR_ALL_TOPIC = '0x17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31'; // keccak256('ApprovalForAll(address,address,bool)')

function padAddress(address: string): `0x${string}` {
  return `0x${address.slice(2).padStart(64, '0')}` as `0x${string}`;
}

export async function fetchApprovalEvents(
  chain: typeof polkadotHub,
  walletAddress: `0x${string}`,
  onProgress?: (blockCount: number) => void,
): Promise<ApprovalData[]> {
  const rpcClient = getRpcClient({ client: thirdwebClient, chain });
  const ownerTopic = padAddress(walletAddress);

  // Get current block number for progress display
  let currentBlock = 0n;
  try {
    currentBlock = await eth_blockNumber(rpcClient);
    onProgress?.(Number(currentBlock));
  } catch {
    // ignore
  }

  // Fetch ERC-20 Approval events and ApprovalForAll events in parallel
  const [erc20Logs, erc721Logs] = await Promise.all([
    eth_getLogs(rpcClient, {
      fromBlock: 0n,
      toBlock: 'latest',
      topics: [APPROVAL_TOPIC, ownerTopic],
    }).catch(() => []),
    eth_getLogs(rpcClient, {
      fromBlock: 0n,
      toBlock: 'latest',
      topics: [APPROVAL_FOR_ALL_TOPIC, ownerTopic],
    }).catch(() => []),
  ]);

  // Dedup: keep latest event per (tokenAddress + spenderAddress)
  const approvalMap = new Map<string, ApprovalData>();

  for (const log of erc20Logs) {
    const tokenAddress = log.address as `0x${string}`;
    const spenderAddress = `0x${(log.topics?.[2] ?? '').slice(26)}` as `0x${string}`;
    const value = log.data ? BigInt(log.data) : 0n;
    const key = `${tokenAddress.toLowerCase()}-${spenderAddress.toLowerCase()}`;

    approvalMap.set(key, {
      id: key,
      tokenAddress,
      tokenSymbol: '',
      tokenDecimals: 18,
      spenderAddress,
      allowanceRaw: value,
      isUnlimited: value >= UNLIMITED_THRESHOLD,
      tokenType: 'ERC20',
      approvalBlock: Number(log.blockNumber ?? 0),
      approvalTimestamp: 0,
    });
  }

  for (const log of erc721Logs) {
    const nftAddress = log.address as `0x${string}`;
    const operator = `0x${(log.topics?.[2] ?? '').slice(26)}` as `0x${string}`;
    // ApprovalForAll data is a bool (0 or 1)
    const approved = log.data ? BigInt(log.data) !== 0n : false;
    const key = `${nftAddress.toLowerCase()}-${operator.toLowerCase()}`;

    if (approved) {
      approvalMap.set(key, {
        id: key,
        tokenAddress: nftAddress,
        tokenSymbol: '',
        tokenDecimals: 0,
        spenderAddress: operator,
        allowanceRaw: MAX_UINT256,
        isUnlimited: true,
        tokenType: 'ERC721',
        approvalBlock: Number(log.blockNumber ?? 0),
        approvalTimestamp: 0,
      });
    } else {
      approvalMap.delete(key);
    }
  }

  return Array.from(approvalMap.values());
}

export async function verifyLiveAllowance(
  chain: typeof polkadotHub,
  tokenAddress: `0x${string}`,
  owner: `0x${string}`,
  spender: `0x${string}`
): Promise<bigint> {
  try {
    const rpcClient = getRpcClient({ client: thirdwebClient, chain });
    // allowance(address,address) selector: 0xdd62ed3e
    const ownerPadded = owner.slice(2).padStart(64, '0');
    const spenderPadded = spender.slice(2).padStart(64, '0');
    const data = `0xdd62ed3e${ownerPadded}${spenderPadded}` as `0x${string}`;

    const result = await eth_call(rpcClient, {
      to: tokenAddress,
      data,
    });
    return result ? BigInt(result) : 0n;
  } catch {
    return 0n;
  }
}

export async function fetchTokenMetadata(
  chain: typeof polkadotHub,
  tokenAddress: `0x${string}`
): Promise<{ symbol: string; decimals: number }> {
  try {
    const rpcClient = getRpcClient({ client: thirdwebClient, chain });

    // symbol() selector: 0x95d89b41, decimals() selector: 0x313ce567
    const [symbolResult, decimalsResult] = await Promise.all([
      eth_call(rpcClient, { to: tokenAddress, data: '0x95d89b41' as `0x${string}` }).catch(() => null),
      eth_call(rpcClient, { to: tokenAddress, data: '0x313ce567' as `0x${string}` }).catch(() => null),
    ]);

    let symbol = 'UNKNOWN';
    if (symbolResult && symbolResult !== '0x') {
      try {
        // ABI-decode string: skip offset (32 bytes) + length (32 bytes), read string
        const hex = symbolResult.slice(2);
        if (hex.length >= 128) {
          const len = parseInt(hex.slice(64, 128), 16);
          const strHex = hex.slice(128, 128 + len * 2);
          symbol = Buffer.from(strHex, 'hex').toString('utf-8') || 'UNKNOWN';
        }
      } catch {
        symbol = 'UNKNOWN';
      }
    }

    let decimals = 18;
    if (decimalsResult && decimalsResult !== '0x') {
      decimals = Number(BigInt(decimalsResult));
    }

    return { symbol, decimals };
  } catch {
    return { symbol: 'UNKNOWN', decimals: 18 };
  }
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatAllowance(amount: bigint, decimals: number): string {
  if (amount >= UNLIMITED_THRESHOLD) return 'Unlimited';
  const divisor = 10n ** BigInt(decimals);
  const whole = amount / divisor;
  const frac = amount % divisor;
  if (frac === 0n) return whole.toLocaleString();
  return `${whole}.${frac.toString().padStart(decimals, '0').slice(0, 4)}`;
}
