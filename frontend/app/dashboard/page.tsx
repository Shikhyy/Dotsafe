'use client';

import { useEffect, useState } from 'react';
import { useActiveAccount, useWalletBalance } from 'thirdweb/react';
import { useDotSafeStore } from '@/store';
import { useApprovalScanner } from '@/hooks/useApprovalScanner';
import { useAIScoring } from '@/hooks/useAIScoring';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import { AppLayout } from '@/components/layout/AppLayout';
import { ApprovalRow } from '@/components/scanner/ApprovalRow';
import { BatchRevokeFooter } from '@/components/scanner/BatchRevokeFooter';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, CheckCircle2, Loader2, AlertTriangle, AlertCircle, Shield, Share2 } from 'lucide-react';
import { truncateAddress } from '@/lib/scanner';
import { polkadotHub } from '@/lib/chains';
import { thirdwebClient } from '@/lib/wagmi';

export default function DashboardPage() {
  const account = useActiveAccount();
  const address = account?.address as `0x${string}` | undefined;
  const { appState, scanResult, error, selectAllDanger } = useDotSafeStore();
  const { scan, blockCount } = useApprovalScanner();
  const { scoreAll } = useAIScoring();
  const [shared, setShared] = useState(false);

  const { data: balanceData } = useWalletBalance({
    client: thirdwebClient,
    chain: polkadotHub,
    address: address,
  });

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
  const dangerCount = scanResult?.dangerCount ?? 0;
  const cautionCount = scanResult?.cautionCount ?? 0;
  const safeCount = scanResult?.safeCount ?? 0;
  const overallRisk = scanResult?.overallRiskScore ?? 0;

  const handleShare = async () => {
    const text = `My wallet on Polkadot Hub is secured by DotSafe! Risk score: ${overallRisk}/100. Scanned ${approvals.length} approvals.`;
    if (navigator.share) {
      await navigator.share({ title: 'DotSafe — Wallet Secured', text });
    } else {
      await navigator.clipboard.writeText(text);
    }
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <AppLayout>
      {/* Top bar */}
      <header className="glass-header sticky top-0 z-30 flex items-center justify-between px-4 md:px-7 py-3.5">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-text">Approval Scanner</h2>
          {address && (
            <div className="hidden lg:flex items-center gap-2 text-xs text-text-muted">
              <span className="font-mono">{truncateAddress(address)}</span>
              {balanceData && (
                <span className="glass-chip px-1.5 py-0.5 rounded text-text-dim">
                  {Number(balanceData.displayValue).toFixed(2)} {balanceData.symbol}
                </span>
              )}
              {scanResult && (
                <span className={`glass-chip px-1.5 py-0.5 rounded font-mono ${
                  overallRisk >= 60 ? 'bg-red/10 text-red' : overallRisk >= 30 ? 'bg-yellow/10 text-yellow' : 'bg-green/10 text-green'
                }`}>
                  Risk: {overallRisk}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {address && (
            <button
              onClick={() => scan(address)}
              disabled={isScanning}
              className="glass-chip flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-muted
                         rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={12} className={isScanning ? 'animate-spin' : ''} />
              {isScanning ? 'Scanning...' : 'Rescan'}
            </button>
          )}
          <WalletConnect />
        </div>
      </header>

      {/* Content */}
      <div className="p-4 md:p-7 max-w-6xl">
        {/* Wrong network banner */}
        {appState === 'WRONG_NETWORK' && (
          <div className="mb-4 p-4 bg-yellow/10 border border-yellow/30 rounded-lg flex items-center gap-3">
            <AlertTriangle size={20} className="text-yellow flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-text">Wrong Network</p>
              <p className="text-xs text-text-muted">
                Please switch to <strong>{polkadotHub.name}</strong> (Chain ID: {polkadotHub.id}) to use DotSafe.
              </p>
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="glass-chip mb-4 p-3 rounded-lg text-sm text-red border-red/30 bg-red/10">
            {error}
          </div>
        )}

        {/* Risk summary stats */}
        {scanResult && !isScanning && approvals.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-7">
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
              className="glass-panel p-3.5 rounded-xl border-t-2 border-t-accent"
            >
              <div className="text-xs text-text-muted mb-1">Total Approvals</div>
              <div className="text-2xl font-mono font-bold text-text">{approvals.length}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="glass-panel p-3.5 rounded-xl border-red/20 border-t-2 border-t-red"
            >
              <div className="flex items-center gap-1 text-xs text-text-muted mb-1">
                <AlertCircle size={10} className="text-red" /> Danger
              </div>
              <div className="text-2xl font-mono font-bold text-red">{dangerCount}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass-panel p-3.5 rounded-xl border-yellow/20 border-t-2 border-t-yellow"
            >
              <div className="flex items-center gap-1 text-xs text-text-muted mb-1">
                <AlertTriangle size={10} className="text-yellow" /> Caution
              </div>
              <div className="text-2xl font-mono font-bold text-yellow">{cautionCount}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="glass-panel p-3.5 rounded-xl border-green/20 border-t-2 border-t-green"
            >
              <div className="flex items-center gap-1 text-xs text-text-muted mb-1">
                <CheckCircle2 size={10} className="text-green" /> Safe
              </div>
              <div className="text-2xl font-mono font-bold text-green">{safeCount}</div>
            </motion.div>
          </div>
        )}

        {/* Quick actions bar */}
        {scanResult && !isScanning && dangerCount > 0 && (
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={selectAllDanger}
              className="glass-chip flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red/10 border-red/30 text-red
                         rounded-lg hover:bg-red/20 transition-colors cursor-pointer"
            >
              <AlertCircle size={12} />
              Select All Dangerous ({dangerCount})
            </button>
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
            <p className="text-sm text-text-muted mb-6">No active approvals found. You&apos;re safe.</p>
            <button
              onClick={handleShare}
              className="glass-chip flex items-center gap-2 px-4 py-2 text-sm border-green/30 text-green rounded-lg
                         hover:bg-green/10 transition-colors cursor-pointer"
            >
              <Share2 size={14} />
              {shared ? 'Copied!' : 'Share Your Clean Status'}
            </button>
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

        {/* Share button after all scored */}
        {approvals.length > 0 && appState === 'IDLE' && overallRisk < 30 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleShare}
              className="glass-chip flex items-center gap-2 px-4 py-2 text-sm border-green/30 text-green rounded-lg
                         hover:bg-green/10 transition-colors cursor-pointer"
            >
              <Share2 size={14} />
              {shared ? 'Copied!' : 'Share Your Safe Status'}
            </button>
          </div>
        )}
      </div>

      <BatchRevokeFooter />
    </AppLayout>
  );
}
