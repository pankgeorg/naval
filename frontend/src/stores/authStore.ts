import { create } from 'zustand';

interface AuthState {
  token: string | null;
  user: { id: string; email: string } | null;
  setToken: (token: string | null) => void;
  setUser: (user: { id: string; email: string } | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  setToken: (token) => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    set({ token });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },
}));
