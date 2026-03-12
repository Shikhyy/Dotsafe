'use client';

import { useXCMGuard } from '@/hooks/useXCMGuard';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChainCard } from '@/components/xcm/ChainCard';
import { Shield, Globe, Loader2, Radar } from 'lucide-react';

export default function XCMPage() {
  const { chains, scanning, loading, totalAlerts, contractReady, scanAllParachains } = useXCMGuard();

  return (
    <AppLayout>
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Globe size={18} className="text-accent" />
          <h2 className="text-sm font-semibold text-text">XCM Cross-Chain Guard</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={scanAllParachains}
            disabled={scanning}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-accent text-white
                       rounded-lg shadow-[0_0_20px_rgba(232,23,93,0.25)] hover:shadow-[0_0_30px_rgba(232,23,93,0.4)]
                       transition-all duration-200 disabled:opacity-50 cursor-pointer"
          >
            {scanning ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Radar size={12} />
                Sync XCM Status
              </>
            )}
          </button>
          <WalletConnect />
        </div>
      </header>

      <div className="p-4 md:p-6 max-w-4xl">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-text mb-1">Monitored Parachains</h3>
          <p className="text-sm text-text-muted">
            DotSafe reads live monitoring state from the on-chain XCMGuard contract on Polkadot Hub.
            Use sync to refresh monitored parachains and alert counts.
          </p>
        </div>

        <div className="mb-4 p-4 bg-surface border border-border rounded-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs text-text-muted mb-1">XCMGuard Connection</div>
              <div className="text-sm font-semibold text-text">
                {contractReady ? 'Connected to deployed contract' : 'Contract address not configured'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-text-muted mb-1">Total Alerts</div>
              <div className="text-lg font-mono text-text">{loading ? '...' : totalAlerts}</div>
            </div>
          </div>
        </div>

        {/* Chain grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {chains.map((chain) => (
            <ChainCard key={chain.paraId} chain={chain} />
          ))}
        </div>

        {/* Info card */}
        <div className="mt-8 p-4 bg-surface border border-border rounded-xl">
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-accent mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-text mb-1">How XCM Guard Works</h4>
              <p className="text-xs text-text-muted leading-relaxed">
                XCM Guard uses Polkadot Hub&apos;s native XCM precompile to send cross-chain messages
                to connected parachains. The dashboard now reads the monitored parachain set and
                recorded alert counts directly from the deployed XCMGuard contract instead of mock data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
