'use client';

import { useState, useCallback } from 'react';
import type { ParachainStatus } from '@/lib/types';

const PARACHAINS: ParachainStatus[] = [
  { paraId: 2004, name: 'Moonbeam', approvalCount: 0, riskLevel: 'SAFE', isScanning: false },
  { paraId: 2006, name: 'Astar', approvalCount: 0, riskLevel: 'SAFE', isScanning: false },
  { paraId: 2000, name: 'Acala', approvalCount: 0, riskLevel: 'SAFE', isScanning: false },
];

export function useXCMGuard() {
  const [chains, setChains] = useState<ParachainStatus[]>(PARACHAINS);
  const [scanning, setScanning] = useState(false);

  const scanAllParachains = useCallback(async () => {
    setScanning(true);
    setChains((prev) => prev.map((c) => ({ ...c, isScanning: true })));

    // Simulated scan — in production, calls XCMGuard.sol + parachain RPCs
    await new Promise((r) => setTimeout(r, 2000));

    setChains([
      { paraId: 2004, name: 'Moonbeam', approvalCount: 2, riskLevel: 'DANGER', isScanning: false },
      { paraId: 2006, name: 'Astar', approvalCount: 1, riskLevel: 'CAUTION', isScanning: false },
      { paraId: 2000, name: 'Acala', approvalCount: 0, riskLevel: 'SAFE', isScanning: false },
    ]);
    setScanning(false);
  }, []);

  return { chains, scanning, scanAllParachains };
}
