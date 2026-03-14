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
    <aside className="hidden md:flex w-[250px] lg:w-[270px] flex-shrink-0 border-r border-border bg-surface p-5 lg:p-6 flex-col gap-7 sticky top-0 h-screen">
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
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[0.95rem] transition-colors ${
                isActive
                  ? 'bg-surface-2 text-text'
                  : 'text-text-muted hover:text-text hover:bg-surface-2'
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
