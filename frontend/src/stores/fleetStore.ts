import { create } from 'zustand';
import type { Ship } from '../types/ship';

interface FleetState {
  ships: Ship[];
  loading: boolean;
  setShips: (ships: Ship[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useFleetStore = create<FleetState>((set) => ({
  ships: [],
  loading: false,
  setShips: (ships) => set({ ships }),
  setLoading: (loading) => set({ loading }),
}));
