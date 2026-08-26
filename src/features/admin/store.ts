import { create } from 'zustand';
import * as Keychain from 'react-native-keychain';
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
