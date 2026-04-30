import { create } from 'zustand';

export const useAuthStore = create((set) => ({
    //variables globals
  user: null,
  session: null,
  isInitialized: false, //per saber si ja havia iniciat sessió

  //per guardar l'user quan fa login
  setAuth:(session) => set ({
    session: session,
    user: session ? session.user: null,
    isInitialized: true,
  }),

  //per esborrar l'user si fa logout
  clearAuth: () => set ({
    session: null,
    user: null
  }),
}));