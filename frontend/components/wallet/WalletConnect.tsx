'use client';

import { ConnectButton, useActiveAccount, useActiveWalletChain } from 'thirdweb/react';
import { thirdwebClient } from '@/lib/wagmi';
import { polkadotHub } from '@/lib/chains';
import { useDotSafeStore } from '@/store';
import { useEffect } from 'react';

export function WalletConnect() {
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const { setAppState } = useDotSafeStore();

  useEffect(() => {
    if (!account) {
      setAppState('DISCONNECTED');
    } else if (activeChain && activeChain.id !== polkadotHub.id) {
      setAppState('WRONG_NETWORK');
    } else {
      setAppState('IDLE');
    }
  }, [account, activeChain, setAppState]);

  return (
    <ConnectButton
      client={thirdwebClient}
      chain={polkadotHub}
      chains={[polkadotHub]}
      connectButton={{
        label: 'Connect Wallet',
        className: 'dotsafe-connect-btn',
      }}
      theme="dark"
      connectModal={{
        size: 'compact',
        title: 'Connect to DotSafe',
        showThirdwebBranding: false,
      }}
    />
  );
}
