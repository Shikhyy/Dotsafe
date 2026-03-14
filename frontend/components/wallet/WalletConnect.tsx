'use client';

import { ConnectButton, useActiveAccount, useActiveWallet, useActiveWalletChain, useDisconnect } from 'thirdweb/react';
import { thirdwebClient } from '@/lib/wagmi';
import { polkadotHub } from '@/lib/chains';
import { useDotSafeStore } from '@/store';
import { useEffect, useRef, useState } from 'react';
import { Check, Copy, LogOut, Wifi } from 'lucide-react';

function ConnectedWallet() {
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!account) return null;

  const addr = account.address;
  const short = `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  async function copyAddress() {
    await navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="glass-chip flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text hover:border-accent transition-colors font-mono"
      >
        <span className="w-2 h-2 rounded-full bg-green inline-block flex-shrink-0" />
        {short}
      </button>

      {open && (
        <div className="glass-panel absolute right-0 top-full mt-2 w-60 rounded-xl z-50 overflow-hidden">
          {/* Address row — copy is a sibling button, NOT nested */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <span className="font-mono text-xs text-text truncate flex-1">{short}</span>
            <button
              onClick={copyAddress}
              className="p-1.5 rounded text-text-muted hover:text-text hover:bg-white/5 transition-colors flex-shrink-0"
              title="Copy address"
            >
              {copied ? <Check size={13} className="text-green" /> : <Copy size={13} />}
            </button>
          </div>

          {/* Chain */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border text-xs text-text-muted">
            <Wifi size={13} />
            {activeChain?.name ?? 'Unknown network'}
          </div>

          {/* Disconnect */}
          <button
            onClick={() => { disconnect(wallet!); setOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red hover:bg-white/5 transition-colors"
          >
            <LogOut size={14} />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

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
        style: {
          background: 'linear-gradient(135deg, #E8175D 0%, #B81250 48%, #7D113D 100%)',
          color: '#ffffff',
          border: '1px solid rgba(232, 23, 93, 0.55)',
          borderRadius: '12px',
          padding: '12px 30px',
          minWidth: '180px',
          boxShadow: '0 10px 30px rgba(232, 23, 93, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          fontWeight: '600',
        },
      }}
      theme="dark"
      connectModal={{
        size: 'compact',
        title: 'Connect to DotSafe',
        showThirdwebBranding: false,
      }}
      detailsButton={{
        render: () => <ConnectedWallet />,
      }}
    />
  );
}
