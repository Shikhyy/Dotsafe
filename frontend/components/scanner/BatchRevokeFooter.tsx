'use client';

import { useState } from 'react';
import { useBatchRevoke } from '@/hooks/useBatchRevoke';
import { useDotSafeStore } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Loader2, X, Fuel, AlertTriangle } from 'lucide-react';
import { truncateAddress } from '@/lib/scanner';
import { RiskBadge } from './RiskBadge';

export function BatchRevokeFooter() {
  const { selectedCount, batchRevoke, selectedApprovals, gasEstimate, isEstimating } = useBatchRevoke();
  const { appState, selectAllDanger, clearSelection, scanResult } = useDotSafeStore();
  const isRevoking = appState === 'REVOKING';
  const dangerCount = scanResult?.dangerCount ?? 0;
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-surface border border-border rounded-xl max-w-md w-full p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={20} className="text-red" />
                  <h3 className="font-semibold text-text">Confirm Batch Revoke</h3>
                </div>
                <button onClick={() => setShowConfirm(false)} className="text-text-muted hover:text-text cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <p className="text-sm text-text-muted mb-4">
                You are about to revoke <strong className="text-red">{selectedCount}</strong> approval{selectedCount !== 1 ? 's' : ''} in a single transaction. This action cannot be undone.
              </p>

              {/* Approval list */}
              <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
                {selectedApprovals.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-3 py-2 bg-surface-2 rounded-lg text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text">{a.tokenSymbol || 'Unknown'}</span>
                      <span className="text-text-dim font-mono">{truncateAddress(a.spenderAddress)}</span>
                    </div>
                    {a.aiScore && <RiskBadge level={a.aiScore.riskLevel} />}
                  </div>
                ))}
              </div>

              {/* Gas estimate */}
              <div className="flex items-center justify-between px-3 py-2 border border-border rounded-lg mb-5">
                <span className="text-xs text-text-muted flex items-center gap-1.5">
                  <Fuel size={12} /> Estimated Gas
                </span>
                <span className="text-xs font-mono text-text">
                  {isEstimating ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : gasEstimate ? (
                    `~${gasEstimate} DOT`
                  ) : (
                    'Unavailable'
                  )}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2.5 text-sm border border-border-2 text-text-muted rounded-lg
                             hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowConfirm(false); batchRevoke(); }}
                  disabled={isRevoking}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-red text-white rounded-lg font-semibold
                             shadow-[0_0_20px_rgba(255,59,92,0.3)] hover:shadow-[0_0_30px_rgba(255,59,92,0.5)]
                             transition-all duration-200 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 size={14} />
                  Revoke {selectedCount} Approval{selectedCount !== 1 ? 's' : ''}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky footer */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 md:bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md"
          >
            <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm text-text">
                  <strong className="text-accent">{selectedCount}</strong> approval{selectedCount !== 1 ? 's' : ''} selected
                </span>
                {gasEstimate && (
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Fuel size={10} /> ~{gasEstimate} DOT
                  </span>
                )}
                {dangerCount > 0 && (
                  <button
                    onClick={selectAllDanger}
                    className="text-xs text-red hover:text-red/80 underline cursor-pointer"
                  >
                    Select All Dangerous ({dangerCount})
                  </button>
                )}
                <button
                  onClick={clearSelection}
                  className="text-xs text-text-muted hover:text-text cursor-pointer"
                >
                  Clear
                </button>
              </div>

              <button
                onClick={() => setShowConfirm(true)}
                disabled={isRevoking}
                className="flex items-center gap-2 px-6 py-2.5 bg-red text-white rounded-lg font-semibold text-sm
                           shadow-[0_0_20px_rgba(255,59,92,0.3)] hover:shadow-[0_0_30px_rgba(255,59,92,0.5)]
                           transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isRevoking ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Revoking...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Batch Revoke ({selectedCount})
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
