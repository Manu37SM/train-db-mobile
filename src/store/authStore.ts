import { create } from 'zustand';
import { clearSession, loadSession, saveSession, StoredSession } from '@/lib/secureStorage';

interface AuthState {
  session: StoredSession | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (session: StoredSession) => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Mirrors train-db-frontend/stores/authStore.ts one-for-one in shape
 * (token, refreshToken, username, email) but backed by Keychain (see
 * lib/secureStorage.ts) instead of localStorage, and Zustand instead of
 * useSyncExternalStore since this app already pulls in Zustand for other
 * stores per the agreed stack - no need for two different state patterns.
 */
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

// Non-reactive read for use outside React (e.g. the axios interceptor in
// api/client.ts, which can't call a hook).
export function getAuthSession() {
  return useAuthStore.getState().session;
}
