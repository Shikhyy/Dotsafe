'use client';

import { useEffect, type ReactNode } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { MobileTabBar } from './MobileTabBar';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const account = useActiveAccount();
  const router = useRouter();

  useEffect(() => {
    if (!account) router.push('/');
  }, [account, router]);

  return (
    <div className="min-h-screen flex scanline">
      <Sidebar />
      <main className="flex-1 min-w-0 pb-16 md:pb-0">
        {children}
      </main>
      <MobileTabBar />
    </div>
  );
}
