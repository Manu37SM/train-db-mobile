import { create } from 'zustand';
import * as Keychain from 'react-native-keychain';

/**
 * Port of train-db-frontend/stores/adminKeyStore.ts. The shared admin key
 * is entered once by whoever administers the deployment; Keychain instead
 * of localStorage for the same reason as the auth session (see
 * lib/secureStorage.ts) - it's a credential, not preference data.
 */
const SERVICE = 'com.raillens.mobile.admin';

interface AdminKeyState {
  key: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setKey: (key: string) => Promise<void>;
  clearKey: () => Promise<void>;
}

export const useAdminKeyStore = create<AdminKeyState>((set) => ({
  key: null,
  hydrated: false,

  hydrate: async () => {
    const result = await Keychain.getGenericPassword({ service: SERVICE });
    set({ key: result ? result.password : null, hydrated: true });
  },

  setKey: async (key) => {
    await Keychain.setGenericPassword('admin', key, { service: SERVICE });
    set({ key });
  },

  clearKey: async () => {
    await Keychain.resetGenericPassword({ service: SERVICE });
    set({ key: null });
  },
}));
