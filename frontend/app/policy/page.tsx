'use client';

import { useState } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { AppLayout } from '@/components/layout/AppLayout';
import { WalletConnect } from '@/components/wallet/WalletConnect';
import { useApprovalPolicy } from '@/hooks/useApprovalPolicy';
import { FileCheck, Plus, Trash2, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PolicyPage() {
  const account = useActiveAccount();
  const {
    contractReady,
    loading,
    submitting,
    isRegistered,
    policies,
    whitelist,
    registerWallet,
    addPolicy,
    removePolicy,
    addWhitelistEntry,
    removeWhitelistEntry,
  } = useApprovalPolicy();
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [showAddWhitelist, setShowAddWhitelist] = useState(false);

  // Form state for new policy
  const [newToken, setNewToken] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [newMax, setNewMax] = useState('');
  const [newWindow, setNewWindow] = useState('86400'); // 1 day default
  const [newWhitelistOnly, setNewWhitelistOnly] = useState(false);

  // Form state for whitelist
  const [newWhitelistAddr, setNewWhitelistAddr] = useState('');
  const [newWhitelistLabel, setNewWhitelistLabel] = useState('');

  const handleAddPolicy = async () => {
    if (!newToken) return;
    const ok = await addPolicy(newToken as `0x${string}`, newMax || '0', parseInt(newWindow, 10) || 0, newWhitelistOnly);
    if (!ok) return;
    setNewToken('');
    setNewSymbol('');
    setNewMax('');
    setNewWindow('86400');
    setNewWhitelistOnly(false);
    setShowAddPolicy(false);
  };

  const handleRemovePolicy = async (tokenAddress: `0x${string}`) => {
    await removePolicy(tokenAddress);
  };

  const handleAddWhitelist = async () => {
    if (!newWhitelistAddr) return;
    const ok = await addWhitelistEntry(newWhitelistAddr as `0x${string}`);
    if (!ok) return;
    setNewWhitelistAddr('');
    setNewWhitelistLabel('');
    setShowAddWhitelist(false);
  };

  const handleRemoveWhitelist = async (addr: `0x${string}`) => {
    await removeWhitelistEntry(addr);
  };

  const windowLabel = (seconds: number) => {
    if (seconds === 0) return 'No expiry';
    if (seconds < 3600) return `${seconds / 60}m`;
    if (seconds < 86400) return `${seconds / 3600}h`;
    return `${seconds / 86400}d`;
  };

  return (
    <AppLayout>
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-3 border-b border-border bg-bg/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <FileCheck size={18} className="text-accent" />
          <h2 className="text-sm font-semibold text-text">Approval Policies</h2>
        </div>
        <WalletConnect />
      </header>

      <div className="p-4 md:p-6 max-w-4xl">
        {/* Info banner */}
        <div className="mb-6 p-4 bg-accent/5 border border-accent/20 rounded-xl">
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-accent mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-text mb-1">Proactive Approval Protection</h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Set per-token spending limits, time-bounded approval windows, and spender whitelists.
                Policies are enforced on-chain via the <strong>ApprovalPolicy</strong> contract — built on
                OpenZeppelin&apos;s AccessControl, Pausable, and EnumerableSet.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 p-4 bg-surface border border-border rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-xs text-text-muted mb-1">ApprovalPolicy Connection</div>
            <div className="text-sm font-semibold text-text">
              {!contractReady
                ? 'Contract address not configured'
                : isRegistered
                  ? 'Wallet registered on-chain'
                  : 'Wallet not registered yet'}
            </div>
          </div>
          {contractReady && account && !isRegistered && (
            <button
              onClick={() => void registerWallet()}
              disabled={submitting}
              className="px-4 py-2 text-xs bg-accent text-white rounded-lg hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
            >
              Register Wallet On-Chain
            </button>
          )}
        </div>

        {/* Token Policies Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-text">Token Policies</h3>
            <button
              onClick={() => setShowAddPolicy(true)}
              disabled={!contractReady || !account || submitting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-accent/10 border border-accent/30 text-accent
                         rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Plus size={12} />
              Add Policy
            </button>
          </div>

          {/* Add Policy Form */}
          <AnimatePresence>
            {showAddPolicy && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="p-4 bg-surface border border-border rounded-xl space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Token Address</label>
                      <input
                        type="text"
                        value={newToken}
                        onChange={(e) => setNewToken(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-lg text-text placeholder:text-text-dim focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Token Symbol</label>
                      <input
                        type="text"
                        value={newSymbol}
                        onChange={(e) => setNewSymbol(e.target.value)}
                        placeholder="e.g. USDC"
                        className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-lg text-text placeholder:text-text-dim focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Max Allowance (tokens)</label>
                      <input
                        type="text"
                        value={newMax}
                        onChange={(e) => setNewMax(e.target.value)}
                        placeholder="0 = unlimited"
                        className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-lg text-text placeholder:text-text-dim focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Approval Window</label>
                      <select
                        value={newWindow}
                        onChange={(e) => setNewWindow(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-lg text-text focus:outline-none focus:border-accent"
                      >
                        <option value="0">No expiry</option>
                        <option value="3600">1 hour</option>
                        <option value="86400">1 day</option>
                        <option value="604800">1 week</option>
                        <option value="2592000">30 days</option>
                      </select>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newWhitelistOnly}
                      onChange={(e) => setNewWhitelistOnly(e.target.checked)}
                      className="accent-accent"
                    />
                    Whitelist only — only allow pre-approved spenders
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddPolicy}
                      disabled={submitting}
                      className="px-4 py-2 text-xs bg-accent text-white rounded-lg hover:brightness-110 transition cursor-pointer"
                    >
                      Save Policy
                    </button>
                    <button
                      onClick={() => setShowAddPolicy(false)}
                      className="px-4 py-2 text-xs border border-border text-text-muted rounded-lg hover:bg-surface-2 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Policy List */}
          {loading ? (
            <div className="p-8 text-center border border-dashed border-border rounded-xl">
              <p className="text-sm text-text-muted">Loading on-chain policies...</p>
            </div>
          ) : policies.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border rounded-xl">
              <FileCheck size={32} className="mx-auto text-text-dim mb-2" />
              <p className="text-sm text-text-muted mb-1">No policies set</p>
              <p className="text-xs text-text-dim">
                {contractReady
                  ? 'Add a token policy to enforce spending limits and approval windows.'
                  : 'Configure NEXT_PUBLIC_APPROVAL_POLICY_ADDRESS to load and manage live policies.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {policies.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-accent">{p.tokenSymbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text">{p.tokenSymbol}</span>
                        {p.whitelistOnly && (
                          <span className="px-1.5 py-0.5 text-[10px] bg-green/10 text-green rounded">Whitelist Only</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-muted">
                        <span>Max: {p.maxAllowance === '0' ? '∞' : p.maxAllowance}</span>
                        <span>Window: {windowLabel(p.approvalWindow)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => void handleRemovePolicy(p.tokenAddress)}
                    className="p-1.5 text-text-dim hover:text-red transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Spender Whitelist Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-text">Spender Whitelist</h3>
              <p className="text-xs text-text-muted mt-0.5">Pre-approved contracts allowed to request token approvals</p>
            </div>
            <button
              onClick={() => setShowAddWhitelist(true)}
              disabled={!contractReady || !account || submitting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green/10 border border-green/30 text-green
                         rounded-lg hover:bg-green/20 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Plus size={12} />
              Add Address
            </button>
          </div>

          <AnimatePresence>
            {showAddWhitelist && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="p-4 bg-surface border border-border rounded-xl space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Contract Address</label>
                      <input
                        type="text"
                        value={newWhitelistAddr}
                        onChange={(e) => setNewWhitelistAddr(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-lg text-text placeholder:text-text-dim focus:outline-none focus:border-accent"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Label</label>
                      <input
                        type="text"
                        value={newWhitelistLabel}
                        onChange={(e) => setNewWhitelistLabel(e.target.value)}
                        placeholder="e.g. Uniswap Router"
                        className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-lg text-text placeholder:text-text-dim focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddWhitelist}
                      disabled={submitting}
                      className="px-4 py-2 text-xs bg-green text-white rounded-lg hover:brightness-110 transition cursor-pointer"
                    >
                      Add to Whitelist
                    </button>
                    <button
                      onClick={() => setShowAddWhitelist(false)}
                      className="px-4 py-2 text-xs border border-border text-text-muted rounded-lg hover:bg-surface-2 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="p-6 text-center border border-dashed border-border rounded-xl">
              <p className="text-sm text-text-muted">Loading on-chain whitelist...</p>
            </div>
          ) : whitelist.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-border rounded-xl">
              <CheckCircle2 size={28} className="mx-auto text-text-dim mb-2" />
              <p className="text-sm text-text-muted">No whitelisted addresses</p>
            </div>
          ) : (
            <div className="space-y-2">
              {whitelist.map((w, i) => (
                <motion.div
                  key={w.address}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl"
                >
                  <div>
                    <div className="text-sm font-semibold text-text">{w.label}</div>
                    <div className="text-xs font-mono text-text-muted">{w.address}</div>
                  </div>
                  <button
                    onClick={() => void handleRemoveWhitelist(w.address as `0x${string}`)}
                    className="p-1.5 text-text-dim hover:text-red transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* OpenZeppelin architecture note */}
        <div className="p-4 bg-surface border border-border rounded-xl">
          <h4 className="text-sm font-semibold text-text mb-2">Contract Architecture</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-text-muted">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
              <div>
                <span className="text-text font-medium">AccessControl</span> — Multi-role admin: POLICY_ADMIN manages policies, BLACKLIST_MANAGER handles global blacklist
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green mt-1.5 flex-shrink-0" />
              <div>
                <span className="text-text font-medium">EnumerableSet</span> — Gas-efficient on-chain whitelist/blacklist with O(1) add, remove, and contains
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow mt-1.5 flex-shrink-0" />
              <div>
                <span className="text-text font-medium">Pausable</span> — Emergency circuit-breaker to halt all policy registration and validation
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
