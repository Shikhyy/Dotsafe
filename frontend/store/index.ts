import { create } from 'zustand';
import type { ApprovalData, AppState, ScanResult } from '@/lib/types';

interface DotSafeStore {
  // App state
  appState: AppState;
  setAppState: (state: AppState) => void;

  // Scan results
  scanResult: ScanResult | null;
  setScanResult: (result: ScanResult | null) => void;

  // Selected approvals for batch revoke
  selectedIds: Set<string>;
  toggleSelected: (id: string) => void;
  selectAllDanger: () => void;
  clearSelection: () => void;

  // Remove revoked approvals from results
  removeApprovals: (ids: string[]) => void;

  // Update a single approval's AI score
  updateApprovalScore: (id: string, score: ApprovalData['aiScore']) => void;

  // Error state
  error: string | null;
  setError: (error: string | null) => void;
}

export const useDotSafeStore = create<DotSafeStore>((set, get) => ({
  appState: 'DISCONNECTED',
  setAppState: (appState) => set({ appState }),

  scanResult: null,
  setScanResult: (scanResult) => set({ scanResult }),

  selectedIds: new Set(),
  toggleSelected: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),
  selectAllDanger: () =>
    set((state) => {
      const ids = new Set<string>();
      state.scanResult?.approvals.forEach((a) => {
        if (a.aiScore?.riskLevel === 'DANGER') ids.add(a.id);
      });
      return { selectedIds: ids };
    }),
  clearSelection: () => set({ selectedIds: new Set() }),

  removeApprovals: (ids) =>
    set((state) => {
      if (!state.scanResult) return {};
      const idSet = new Set(ids);
      const approvals = state.scanResult.approvals.filter((a) => !idSet.has(a.id));
      const dangerCount = approvals.filter((a) => a.aiScore?.riskLevel === 'DANGER').length;
      const cautionCount = approvals.filter((a) => a.aiScore?.riskLevel === 'CAUTION').length;
      const safeCount = approvals.filter((a) => a.aiScore?.riskLevel === 'SAFE').length;
      const scores = approvals.map((a) => a.aiScore?.riskScore ?? 0);
      const overallRiskScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
      return {
        scanResult: {
          ...state.scanResult,
          approvals,
          dangerCount,
          cautionCount,
          safeCount,
          overallRiskScore,
        },
      };
    }),

  updateApprovalScore: (id, score) =>
    set((state) => {
      if (!state.scanResult) return {};
      const approvals = state.scanResult.approvals.map((a) =>
        a.id === id ? { ...a, aiScore: score } : a
      );
      const dangerCount = approvals.filter((a) => a.aiScore?.riskLevel === 'DANGER').length;
      const cautionCount = approvals.filter((a) => a.aiScore?.riskLevel === 'CAUTION').length;
      const safeCount = approvals.filter((a) => a.aiScore?.riskLevel === 'SAFE').length;
      const scores = approvals.map((a) => a.aiScore?.riskScore ?? 0);
      const overallRiskScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
      return {
        scanResult: {
          ...state.scanResult,
          approvals,
          dangerCount,
          cautionCount,
          safeCount,
          overallRiskScore,
        },
      };
    }),

  error: null,
  setError: (error) => set({ error }),
}));
