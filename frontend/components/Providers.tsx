'use client';

import { ThirdwebProvider } from 'thirdweb/react';
import { ToastProvider } from '@/components/Toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ThirdwebProvider>
  );
}
