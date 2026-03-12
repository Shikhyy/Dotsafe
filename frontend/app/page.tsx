'use client';

import { useActiveAccount } from 'thirdweb/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import { Shield, Scan, Zap, Globe, ArrowRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div ref={ref} className="font-mono text-2xl md:text-3xl font-bold text-accent">
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
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(232,23,93,0.08)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,229,160,0.04)_0%,transparent_50%)]" />

      <main className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 mb-6"
        >
          <Shield size={44} className="text-accent" />
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Dot<span className="text-accent">Safe</span>
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-lg md:text-xl text-text-muted mb-2"
        >
          AI-Powered Wallet Risk Guard
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-sm text-text-dim mb-10 max-w-lg"
        >
          Scan all your token approvals on Polkadot Hub. AI scores every risk.
          Revoke dangerous permissions in a single transaction — across parachains via XCM.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <WalletConnect />
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-wrap justify-center gap-3 mt-12"
        >
          {[
            { icon: Scan, text: 'Instant Approval Scan' },
            { icon: Zap, text: 'AI Risk Scoring' },
            { icon: Lock, text: 'Batch Revoke' },
            { icon: Globe, text: 'XCM Cross-Chain' },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-full text-xs text-text-muted
                         hover:border-border-2 hover:text-text transition-colors"
            >
              <Icon size={13} className="text-accent" />
              {text}
            </div>
          ))}
        </motion.div>

        {/* Animated stats counter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="grid grid-cols-3 gap-6 md:gap-10 mt-16"
        >
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
        </motion.div>

        {/* Security note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-16 flex flex-col items-center gap-2"
        >
          <div className="flex items-center gap-3 text-xs text-text-dim">
            <span className="flex items-center gap-1">
              <Shield size={10} className="text-green" />
              Non-custodial
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1">
              <Lock size={10} className="text-green" />
              No private keys stored
            </span>
            <span className="text-border">·</span>
            <span>Open Source · MIT</span>
          </div>
          <p className="text-[11px] text-text-dim/50 max-w-sm">
            First-mover approval security infrastructure for Polkadot Hub EVM.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
