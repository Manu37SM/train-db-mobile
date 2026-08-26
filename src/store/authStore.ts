import { create } from 'zustand';
import { clearSession, loadSession, saveSession, StoredSession } from '@/lib/secureStorage';
interface AuthState {
  session: StoredSession | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (session: StoredSession) => Promise<void>;
  logout: () => Promise<void>;
}
export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  hydrated: false,
  hydrate: async () => {
    const session = await loadSession();
    set({ session, hydrated: true });
  },
  setSession: async (session) => {
    await saveSession(session);
    set({ session });
  },
  logout: async () => {
    await clearSession();
    set({ session: null });
  },
}));
export function getAuthSession() {
  return useAuthStore.getState().session;
}
