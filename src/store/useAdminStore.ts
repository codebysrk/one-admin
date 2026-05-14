import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logoutAdmin } from '../services/authService';

interface AdminState {
  admin: any | null;
  setAdmin: (admin: any) => void;
  logout: () => Promise<void>;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      admin: null,
      setAdmin: (admin) => set({ admin }),
      logout: async () => {
        try {
          await logoutAdmin();
        } finally {
          set({ admin: null });
        }
      },
    }),
    {
      name: 'admin-session-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
