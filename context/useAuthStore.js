import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  session: undefined,   // undefined = encara carregant
  
  setAuth: (session) => set({ session }),
  
  clearAuth: () => set({ session: null }),
}));