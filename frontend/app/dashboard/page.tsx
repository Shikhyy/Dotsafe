'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useDotSafeStore } from '@/store';
import { useApprovalScanner } from '@/hooks/useApprovalScanner';
import { useAIScoring } from '@/hooks/useAIScoring';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import { RiskMeter } from '@/components/stats/RiskMeter';
import { ApprovalRow } from '@/components/scanner/ApprovalRow';
import { BatchRevokeFooter } from '@/components/scanner/BatchRevokeFooter';
import { Shield, RefreshCw, LayoutDashboard, Globe, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { appState, scanResult, setAppState, error } = useDotSafeStore();
  const { scan, loading } = useApprovalScanner();
  const { scoreAll } = useAIScoring();

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected) router.push('/');
  }, [isConnected, router]);

  // Auto-scan on connect
  useEffect(() => {
    if (address && !scanResult) {
      scan(address);
    }
  }, [address, scan, scanResult]);

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
    <div className="min-h-screen flex scanline">
      {/* Sidebar */}
      <aside className="w-[220px] flex-shrink-0 border-r border-border bg-surface p-4 flex flex-col gap-6 sticky top-0 h-screen">
        <Link href="/" className="flex items-center gap-2 mb-2">
          <Shield size={22} className="text-accent" />
          <span className="text-lg font-extrabold tracking-tight">
            Dot<span className="text-accent">Safe</span>
          </span>
        </Link>

        <nav className="space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-2 text-text text-sm"
          >
            <LayoutDashboard size={16} />
            Dashboard
          </Link>
          <Link
            href="/xcm"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors text-sm"
          >
            <Globe size={16} />
            XCM Guard
          </Link>
        </nav>

        <RiskMeter />
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b border-border bg-bg/80 backdrop-blur-md">
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
        <div className="p-6 max-w-4xl">
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
                Scanning approval events...
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
            <div className="space-y-2">
              {approvals
                .sort((a, b) => (b.aiScore?.riskScore ?? 0) - (a.aiScore?.riskScore ?? 0))
                .map((approval, index) => (
                  <ApprovalRow key={approval.id} approval={approval} index={index} />
                ))}
            </div>
          )}
        </div>
      </main>

      <BatchRevokeFooter />
    </div>
  );
}
