'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, LayoutDashboard, Globe, History, FileCheck } from 'lucide-react';
import { RiskMeter } from '@/components/stats/RiskMeter';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/policy', icon: FileCheck, label: 'Policies' },
  { href: '/xcm', icon: Globe, label: 'XCM Guard' },
  { href: '/history', icon: History, label: 'History' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-sidebar hidden md:flex w-[250px] lg:w-[270px] flex-shrink-0 p-5 lg:p-6 flex-col gap-7 sticky top-0 h-screen rounded-none border-y-0 border-l-0">
      <Link href="/" className="flex items-center gap-2.5 mb-2">
        <Shield size={24} className="text-accent" />
        <span className="text-xl font-extrabold tracking-tight">
          Dot<span className="text-accent">Safe</span>
        </span>
      </Link>

      <nav className="space-y-1.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`glass-nav-link flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[0.95rem] transition-all ${
                isActive
                  ? 'glass-nav-link-active text-text'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <RiskMeter />
    </aside>
  );
}
