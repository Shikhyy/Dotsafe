'use client';

import { useActiveAccount } from 'thirdweb/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import { Shield, Scan, Zap, Globe } from 'lucide-react';

function AnimatedCounter({ end, suffix = '', prefix = '', duration = 1600 }: {
  end: number; suffix?: string; prefix?: string; duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * end));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [started, end, duration]);

  return (
    <div ref={ref} className="font-mono text-2xl font-bold text-accent">
      {prefix}{display.toLocaleString()}{suffix}
    </div>
  );
}

export default function LandingPage() {
  const account = useActiveAccount();
  const router = useRouter();

  useEffect(() => {
    if (account) router.push('/dashboard');
  }, [account, router]);

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

        {/* Animated stats counter */}
        <div className="grid grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <AnimatedCounter end={100000} suffix="+" />
            <div className="text-xs text-text-dim mt-1">Approvals Scanned</div>
          </div>
          <div className="text-center">
            <AnimatedCounter end={2400000} prefix="$" />
            <div className="text-xs text-text-dim mt-1">Risk Identified</div>
          </div>
          <div className="text-center">
            <AnimatedCounter end={3} duration={800} />
            <div className="text-xs text-text-dim mt-1">Chains Monitored</div>
          </div>
        </div>
      </main>
    </div>
  );
}
