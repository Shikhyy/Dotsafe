export interface RevocationRecord {
  id: string;
  tokenAddress: string;
  tokenSymbol: string;
  spenderAddress: string;
  tokenType: 'ERC20' | 'ERC721' | 'ERC1155';
  txHash?: string;
  revokedAt: number;
  chainId: number;
}

const STORAGE_KEY = 'dotsafe_revocation_history';
const MAX_RECORDS = 100;

export function getRevocationHistory(): RevocationRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRevocationRecord(record: Omit<RevocationRecord, 'id' | 'revokedAt'>): void {
  const history = getRevocationHistory();
  const newRecord: RevocationRecord = {
    ...record,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    revokedAt: Date.now(),
  };
  const updated = [newRecord, ...history].slice(0, MAX_RECORDS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearRevocationHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
