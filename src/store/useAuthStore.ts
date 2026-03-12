'use client';

import { create } from 'zustand';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isPremium: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isLoading: true,
  isPremium: false,

  setUser: (user: User | null) => {
    const isPremium =
      user?.subscription_status === 'premium' ||
      user?.subscription_status === 'trial';
    set({ user, isPremium, isLoading: false });
  },

  setLoading: (isLoading: boolean) => set({ isLoading }),

  clearUser: () => set({ user: null, isPremium: false, isLoading: false }),
}));

// Helper hook for subscription gate checks
export function useIsPremium(): boolean {
  return useAuthStore((s) => s.isPremium);
}
