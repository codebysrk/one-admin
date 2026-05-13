import { create } from 'zustand';

interface AdminState {
  admin: any | null;
  setAdmin: (admin: any) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  admin: null,
  setAdmin: (admin) => set({ admin }),
  logout: () => set({ admin: null }),
}));
