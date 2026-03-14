'use client';

import { useEffect, useState } from 'react';
import { History, ExternalLink, Trash2 } from 'lucide-react';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import { AppLayout } from '@/components/layout/AppLayout';
import { getRevocationHistory, clearRevocationHistory, type RevocationRecord } from '@/lib/history';
import { truncateAddress } from '@/lib/scanner';
import { polkadotHub } from '@/lib/chains';

function getExplorerUrl(chainId: number): string {
  if (chainId === polkadotHub.id) return polkadotHub.blockExplorers?.[0]?.url ?? '';
  return '';
}

export default function HistoryPage() {
  const [records, setRecords] = useState<RevocationRecord[]>([]);

  useEffect(() => {
    setRecords(getRevocationHistory());
  }, []);

  const handleClear = () => {
    clearRevocationHistory();
    setRecords([]);
  };

  return (
    <AppLayout>
      <header className="glass-header sticky top-0 z-30 flex items-center justify-between px-4 md:px-7 py-3.5">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-text">Revocation History</h2>
          <span className="text-xs text-text-dim">{records.length} record{records.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-3">
          {records.length > 0 && (
            <button
              onClick={handleClear}
              className="glass-chip flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-muted
                         rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Trash2 size={12} />
              Clear History
            </button>
          )}
          <WalletConnect />
        </div>
      </header>

      <div className="p-4 md:p-7 max-w-6xl">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <History size={48} className="text-text-dim mb-4" />
            <h3 className="text-lg font-semibold text-text mb-1">No revocations yet</h3>
            <p className="text-sm text-text-muted">
              Revoked approvals will appear here for your records.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((record) => {
              const explorerUrl = getExplorerUrl(record.chainId);
              return (
                <div
                  key={record.id}
                  className="flex items-center gap-4 px-4 py-3 border border-border rounded-lg hover:border-border-2 transition-colors"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-green flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-text">
                        {record.tokenSymbol || 'Unknown'}
                      </span>
                      <span className="text-xs text-text-dim px-1.5 py-0.5 bg-surface-2 rounded">
                        {record.tokenType}
                      </span>
                    </div>
                    <span className="text-xs text-text-muted font-mono">
                      Spender: {truncateAddress(record.spenderAddress as `0x${string}`)}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-text-dim">
                      {new Date(record.revokedAt).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </div>
                    <div className="text-xs text-text-dim">
                      {new Date(record.revokedAt).toLocaleTimeString(undefined, {
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                  </div>
                  {record.txHash && explorerUrl && (
                    <a
                      href={`${explorerUrl}/tx/${record.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-accent/80 flex-shrink-0"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
