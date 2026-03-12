'use client';

import { useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { useDotSafeStore } from '@/store';
import { useApprovalScanner } from '@/hooks/useApprovalScanner';
import { useAIScoring } from '@/hooks/useAIScoring';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import { AppLayout } from '@/components/layout/AppLayout';
import { ApprovalRow } from '@/components/scanner/ApprovalRow';
import { BatchRevokeFooter } from '@/components/scanner/BatchRevokeFooter';
import { AnimatePresence } from 'framer-motion';
import { RefreshCw, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const account = useActiveAccount();
  const address = account?.address as `0x${string}` | undefined;
  const { appState, scanResult, error } = useDotSafeStore();
  const { scan, blockCount } = useApprovalScanner();
  const { scoreAll } = useAIScoring();

  // Auto-scan on connect
  useEffect(() => {
    if (address && !scanResult && appState !== 'WRONG_NETWORK') {
      scan(address);
    }
  }, [address, scan, scanResult, appState]);

  // Auto-score after scan
  useEffect(() => {
    if (appState === 'SCORING' && scanResult) {
      scoreAll();
    }
  }, [appState, scanResult, scoreAll]);

  const approvals = scanResult?.approvals ?? [];
  const isScanning = appState === 'SCANNING';
  const isScoring = appState === 'SCORING';

  return (
    <AppLayout>
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-text">Approval Scanner</h2>
          {scanResult && (
            <span className="text-xs text-text-dim">
              {approvals.length} active approval{approvals.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {address && (
            <button
              onClick={() => scan(address)}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border-2 text-text-muted
                         rounded-lg hover:bg-surface-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={12} className={isScanning ? 'animate-spin' : ''} />
              {isScanning ? 'Scanning...' : 'Rescan'}
            </button>
          )}
          <WalletConnect />
        </div>
      </header>

      {/* Content */}
      <div className="p-4 md:p-6 max-w-4xl">
        {/* Wrong network banner */}
        {appState === 'WRONG_NETWORK' && (
          <div className="mb-4 p-4 bg-yellow/10 border border-yellow/30 rounded-lg flex items-center gap-3">
            <AlertTriangle size={20} className="text-yellow flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-text">Wrong Network</p>
              <p className="text-xs text-text-muted">
                Please switch to <strong>Polkadot Hub</strong> (Chain ID: 420420421) to use DotSafe.
              </p>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 bg-red/10 border border-red/30 rounded-lg text-sm text-red">
            {error}
          </div>
        )}

        {/* Loading / skeleton state */}
        {isScanning && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
              <Loader2 size={14} className="animate-spin" />
              {blockCount > 0
                ? `Scanning ${blockCount.toLocaleString()} blocks...`
                : 'Scanning approval events...'}
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-lg skeleton" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        )}

        {/* Scoring indicator */}
        {isScoring && approvals.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
            <Loader2 size={14} className="animate-spin text-accent" />
            AI scoring in progress...
          </div>
        )}

        {/* Empty state */}
        {!isScanning && approvals.length === 0 && scanResult && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CheckCircle2 size={48} className="text-green mb-4" />
            <h3 className="text-lg font-semibold text-text mb-1">Your wallet is clean</h3>
            <p className="text-sm text-text-muted">No active approvals found. You&apos;re safe.</p>
          </div>
        )}

        {/* Approval rows */}
        {approvals.length > 0 && (
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {approvals
                .sort((a, b) => (b.aiScore?.riskScore ?? 0) - (a.aiScore?.riskScore ?? 0))
                .map((approval, index) => (
                  <ApprovalRow key={approval.id} approval={approval} index={index} />
                ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      <BatchRevokeFooter />
    </AppLayout>
  );
}
