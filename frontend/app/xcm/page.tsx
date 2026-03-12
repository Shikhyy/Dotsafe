'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useXCMGuard } from '@/hooks/useXCMGuard';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import { ChainCard } from '@/components/xcm/ChainCard';
import { Shield, Globe, LayoutDashboard, Loader2, Radar } from 'lucide-react';
import Link from 'next/link';

export default function XCMPage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const { chains, scanning, scanAllParachains } = useXCMGuard();

  useEffect(() => {
    if (!isConnected) router.push('/');
  }, [isConnected, router]);

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
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors text-sm"
          >
            <LayoutDashboard size={16} />
            Dashboard
          </Link>
          <Link
            href="/xcm"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-2 text-text text-sm"
          >
            <Globe size={16} />
            XCM Guard
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b border-border bg-bg/80 backdrop-blur-md">
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

        <div className="p-6 max-w-4xl">
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
      </main>
    </div>
  );
}
