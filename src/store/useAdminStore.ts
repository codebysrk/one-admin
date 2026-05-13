import { create } from 'zustand';

interface AdminState {
  admin: any | null;
  activeTab: string;
  setAdmin: (admin: any) => void;
  setActiveTab: (tab: string) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  admin: null,
  activeTab: 'Dashboard',
  setAdmin: (admin) => set({ admin }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  logout: () => set({ admin: null, activeTab: 'Dashboard' }),
}));
