'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, LayoutDashboard, Globe, History } from 'lucide-react';
import { RiskMeter } from '@/components/stats/RiskMeter';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/xcm', icon: Globe, label: 'XCM Guard' },
  { href: '/history', icon: History, label: 'History' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-[220px] flex-shrink-0 border-r border-border bg-surface p-4 flex-col gap-6 sticky top-0 h-screen">
      <Link href="/" className="flex items-center gap-2 mb-2">
        <Shield size={22} className="text-accent" />
        <span className="text-lg font-extrabold tracking-tight">
          Dot<span className="text-accent">Safe</span>
        </span>
      </Link>

      <nav className="space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-surface-2 text-text'
                  : 'text-text-muted hover:text-text hover:bg-surface-2'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <RiskMeter />
    </aside>
  );
}
