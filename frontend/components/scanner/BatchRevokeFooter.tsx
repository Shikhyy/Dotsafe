'use client';

import { useBatchRevoke } from '@/hooks/useBatchRevoke';
import { useDotSafeStore } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Loader2 } from 'lucide-react';

export function BatchRevokeFooter() {
  const { selectedCount, batchRevoke, selectedApprovals } = useBatchRevoke();
  const { appState, selectAllDanger, clearSelection, scanResult } = useDotSafeStore();
  const isRevoking = appState === 'REVOKING';
  const dangerCount = scanResult?.dangerCount ?? 0;

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md"
        >
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-text">
                <strong className="text-accent">{selectedCount}</strong> approval{selectedCount !== 1 ? 's' : ''} selected
              </span>
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
              onClick={batchRevoke}
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
  );
}
