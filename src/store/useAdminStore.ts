import { create } from 'zustand';
import { logoutAdmin } from '../services/authService';

interface AdminState {
  admin: any | null;
  activeTab: string;
  setAdmin: (admin: any) => void;
  setActiveTab: (tab: string) => void;
  logout: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  admin: null,
  activeTab: 'Dashboard',
  setAdmin: (admin) => set({ admin }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  logout: async () => {
    try {
      await logoutAdmin();
    } finally {
      set({ admin: null, activeTab: 'Dashboard' });
    }
  },
}));
