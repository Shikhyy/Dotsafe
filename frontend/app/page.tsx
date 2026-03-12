'use client';

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import { Shield, Scan, Zap, Globe } from 'lucide-react';

export default function LandingPage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) router.push('/dashboard');
  }, [isConnected, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative scanline">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(232,23,93,0.08)_0%,transparent_70%)]" />

      <main className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <Shield size={40} className="text-accent" />
          <h1 className="text-4xl font-extrabold tracking-tight">
            Dot<span className="text-accent">Safe</span>
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-lg text-text-muted mb-2">
          AI-Powered Wallet Risk Guard
        </p>
        <p className="text-sm text-text-dim mb-10 max-w-md">
          Scan all your token approvals on Polkadot Hub. AI scores every risk.
          Revoke dangerous permissions in a single transaction.
        </p>

        {/* CTA */}
        <WalletConnect />

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-12">
          {[
            { icon: Scan, text: 'Instant Approval Scan' },
            { icon: Zap, text: 'AI Risk Scoring' },
            { icon: Shield, text: 'Batch Revoke' },
            { icon: Globe, text: 'XCM Cross-Chain' },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-full text-xs text-text-muted"
            >
              <Icon size={12} className="text-accent" />
              {text}
            </div>
          ))}
        </div>

        {/* Stats counter */}
        <div className="grid grid-cols-3 gap-8 mt-16">
          {[
            { value: '100K+', label: 'Approvals Scanned' },
            { value: '$2.4M', label: 'Risk Identified' },
            { value: '3', label: 'Chains Monitored' },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="font-mono text-2xl font-bold text-accent">{value}</div>
              <div className="text-xs text-text-dim mt-1">{label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
