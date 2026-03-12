'use client';

import { useXCMGuard } from '@/hooks/useXCMGuard';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChainCard } from '@/components/xcm/ChainCard';
import { Shield, Globe, Loader2, Radar } from 'lucide-react';

export default function XCMPage() {
  const { chains, scanning, scanAllParachains } = useXCMGuard();

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
                Scanning...
              </>
            ) : (
              <>
                <Radar size={12} />
                Scan All Parachains
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
            DotSafe monitors token approvals across Polkadot parachains via XCM.
            Scan to detect risky approvals on connected chains.
          </p>
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
                to connected parachains. It queries approval state on Moonbeam, Astar, and Acala,
                then surfaces risky approvals in a unified dashboard. This is the only wallet
                security tool that works across the entire Polkadot ecosystem.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
