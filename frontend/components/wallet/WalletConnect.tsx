'use client';

import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from 'wagmi';
import { polkadotHub } from '@/lib/chains';
import { useDotSafeStore } from '@/store';
import { truncateAddress } from '@/lib/scanner';
import { Wallet, LogOut, AlertTriangle } from 'lucide-react';

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { appState, setAppState } = useDotSafeStore();
  const { data: balance } = useBalance({ address });

  const isWrongNetwork = isConnected && chain?.id !== polkadotHub.id;

  if (!isConnected) {
    return (
      <button
        onClick={() => {
          setAppState('CONNECTING');
          connect({ connector: connectors[0] });
        }}
        className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg font-semibold text-sm
                   shadow-[0_0_20px_rgba(232,23,93,0.25)] hover:shadow-[0_0_30px_rgba(232,23,93,0.4)]
                   transition-all duration-200 cursor-pointer"
      >
        <Wallet size={16} />
        Connect Wallet
      </button>
    );
  }

  if (isWrongNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: polkadotHub.id })}
        className="flex items-center gap-2 px-5 py-2.5 bg-yellow text-black rounded-lg font-semibold text-sm
                   cursor-pointer"
      >
        <AlertTriangle size={16} />
        Switch to Polkadot Hub
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg">
        <div className="w-2 h-2 rounded-full bg-green" />
        <span className="text-sm font-mono text-text">{truncateAddress(address!)}</span>
        {balance && (
          <span className="text-xs text-text-muted ml-2">
            {(Number(balance.value) / 10 ** balance.decimals).toFixed(2)} {balance.symbol}
          </span>
        )}
      </div>
      <button
        onClick={() => {
          disconnect();
          setAppState('DISCONNECTED');
        }}
        className="p-2 text-text-muted hover:text-red transition-colors cursor-pointer"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}
