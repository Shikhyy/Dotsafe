import { type PublicClient, parseAbiItem, keccak256, toHex, pad } from 'viem';
import type { ApprovalData } from './types';

const APPROVAL_EVENT = parseAbiItem(
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
);
const APPROVAL_FOR_ALL_EVENT = parseAbiItem(
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)'
);

const MAX_UINT256 = 2n ** 256n - 1n;
const UNLIMITED_THRESHOLD = 2n ** 128n;

export async function fetchApprovalEvents(
  client: PublicClient,
  walletAddress: `0x${string}`
): Promise<ApprovalData[]> {
  const ownerTopic = pad(walletAddress, { size: 32 });

  // Fetch ERC-20 Approval events
  const [erc20Logs, erc721Logs] = await Promise.all([
    client.getLogs({
      event: APPROVAL_EVENT,
      args: { owner: walletAddress },
      fromBlock: 0n,
      toBlock: 'latest',
    }).catch(() => []),
    client.getLogs({
      event: APPROVAL_FOR_ALL_EVENT,
      args: { owner: walletAddress },
      fromBlock: 0n,
      toBlock: 'latest',
    }).catch(() => []),
  ]);

  // Dedup: keep latest event per (tokenAddress + spenderAddress)
  const approvalMap = new Map<string, ApprovalData>();

  for (const log of erc20Logs) {
    const tokenAddress = log.address as `0x${string}`;
    const spenderAddress = (log.args.spender ?? '0x') as `0x${string}`;
    const value = log.args.value ?? 0n;
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
    const operator = (log.args.operator ?? '0x') as `0x${string}`;
    const approved = log.args.approved ?? false;
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
  client: PublicClient,
  tokenAddress: `0x${string}`,
  owner: `0x${string}`,
  spender: `0x${string}`
): Promise<bigint> {
  try {
    const result = await client.readContract({
      address: tokenAddress,
      abi: [
        {
          inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
          name: 'allowance',
          outputs: [{ name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'allowance',
      args: [owner, spender],
    });
    return result as bigint;
  } catch {
    return 0n;
  }
}

export async function fetchTokenMetadata(
  client: PublicClient,
  tokenAddress: `0x${string}`
): Promise<{ symbol: string; decimals: number }> {
  try {
    const [symbol, decimals] = await Promise.all([
      client.readContract({
        address: tokenAddress,
        abi: [{ inputs: [], name: 'symbol', outputs: [{ name: '', type: 'string' }], stateMutability: 'view', type: 'function' }],
        functionName: 'symbol',
      }).catch(() => 'UNKNOWN'),
      client.readContract({
        address: tokenAddress,
        abi: [{ inputs: [], name: 'decimals', outputs: [{ name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' }],
        functionName: 'decimals',
      }).catch(() => 18),
    ]);
    return { symbol: symbol as string, decimals: Number(decimals) };
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
