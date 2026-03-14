'use client';

import { useActiveAccount } from 'thirdweb/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import { Shield, Scan, Zap, Globe, Lock, LayoutDashboard, ArrowRight } from 'lucide-react';
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

  const handleDashboardNavigation = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative scanline">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(232,23,93,0.08)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,229,160,0.04)_0%,transparent_50%)]" />

      <main className="relative z-10 w-full max-w-6xl px-6 py-10 md:py-14">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative px-2 py-4 md:px-4 md:py-6"
        >
          <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-[#070a0e] px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.18em] text-text-muted mb-5"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Passet Hub Security Layer
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex items-center justify-center lg:justify-start gap-3 mb-6"
              >
                <Shield size={48} className="text-accent" />
                <h1 className="text-[2.5rem] leading-none md:text-[3.6rem] font-extrabold tracking-tight">
                  Dot<span className="text-accent">Safe</span>
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-xl md:text-2xl text-text-muted mb-3"
              >
                AI-Powered Wallet Risk Guard
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-[0.98rem] md:text-lg text-text-dim mb-8 max-w-2xl leading-relaxed mx-auto lg:mx-0"
              >
                Scan all your token approvals on Passet Hub. AI scores every risk.
                Revoke dangerous permissions in a single transaction and monitor cross-chain exposure through XCM-aware controls.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
              >
                <WalletConnect />
                <button
                  onClick={handleDashboardNavigation}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent/20 bg-[#070a0e] px-5 py-3 text-sm font-semibold text-text hover:text-white hover:bg-[#0b0f15] transition-colors cursor-pointer"
                >
                  <LayoutDashboard size={16} className="text-accent" />
                  Open Dashboard
                  <ArrowRight size={15} className="text-text-dim" />
                </button>
              </motion.div>

              <p className="mt-3 text-xs text-text-dim lg:text-left text-center">
                {account ? 'Wallet connected. Jump straight into the scanner.' : 'Connect your wallet first for full dashboard access.'}
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="rounded-[1.6rem] border border-border/60 bg-[#070a0e] p-5 text-left shadow-[0_24px_60px_rgba(0,0,0,0.28)]"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-[0.72rem] uppercase tracking-[0.18em] text-text-muted">Security Flow</p>
                <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[0.68rem] font-semibold text-accent">
                  Live on Passet Hub
                </span>
              </div>

              <div className="space-y-3.5">
                {[
                  {
                    icon: Scan,
                    title: 'Scan approvals',
                    text: 'Fetch live allowances and operator approvals directly from chain activity.',
                  },
                  {
                    icon: Zap,
                    title: 'Score risk instantly',
                    text: 'Gemini reviews allowance size, code trust, age, and proxy behavior.',
                  },
                  {
                    icon: Lock,
                    title: 'Revoke safely',
                    text: 'Batch revoke risky approvals and enforce policy rules from one control surface.',
                  },
                ].map(({ icon: Icon, title, text }, index) => (
                  <div key={title} className="rounded-2xl border border-border/50 bg-[#090c10] px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 text-accent">
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-text">{title}</span>
                          <span className="text-[0.68rem] text-text-dim">0{index + 1}</span>
                        </div>
                        <p className="text-sm text-text-muted leading-relaxed">{text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-wrap justify-center lg:justify-start gap-3.5 mt-12"
          >
            {[
              { icon: Scan, text: 'Instant Approval Scan' },
              { icon: Zap, text: 'AI Risk Scoring' },
              { icon: Lock, text: 'Batch Revoke' },
              { icon: Globe, text: 'XCM Cross-Chain' },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 px-4.5 py-2.5 rounded-full border border-border/50 bg-[#090c10] text-[0.8rem] text-text-muted hover:text-text hover:bg-[#0b0f15] transition-colors"
              >
                <Icon size={14} className="text-accent" />
                {text}
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-12"
          >
            <div className="rounded-2xl border border-border/50 bg-[#090c10] px-4 py-4 text-center">
              <AnimatedCounter end={100000} suffix="+" />
              <div className="text-xs text-text-dim mt-1">Approvals Scanned</div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-[#090c10] px-4 py-4 text-center">
              <AnimatedCounter end={2400000} prefix="$" />
              <div className="text-xs text-text-dim mt-1">Risk Identified</div>
            </div>
            <div className="rounded-2xl border border-border/50 bg-[#090c10] px-4 py-4 text-center">
              <AnimatedCounter end={3} duration={800} />
              <div className="text-xs text-text-dim mt-1">Chains Monitored</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-10 flex flex-col items-center gap-2.5"
          >
            <div className="rounded-full border border-border/50 bg-[#090c10] px-4 py-2 flex flex-wrap items-center justify-center gap-3 text-[0.78rem] text-text-dim">
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
            <p className="text-xs text-text-dim/50 max-w-sm">
              First-mover approval security infrastructure for Passet Hub.
            </p>
          </motion.div>
        </motion.section>
      </main>
    </div>
  );
}
