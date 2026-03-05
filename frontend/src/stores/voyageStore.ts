import { create } from 'zustand';

interface VoyageState {
  voyages: Record<string, unknown>[];
  loading: boolean;
  setVoyages: (voyages: Record<string, unknown>[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useVoyageStore = create<VoyageState>((set) => ({
  voyages: [],
  loading: false,
  setVoyages: (voyages) => set({ voyages }),
  setLoading: (loading) => set({ loading }),
}));
