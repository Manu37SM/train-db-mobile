import { MMKV } from 'react-native-mmkv';

/**
 * General-purpose local storage, replacing the web app's localStorage-backed
 * stores (recentSearchStore, favoritesStore, savedJourneyStore,
 * popularSearchStore, popularityStore, preferencesStore, adminKeyStore - see
 * train-db-frontend/stores/). MMKV is synchronous and fast enough to read
 * directly from Zustand store initializers, matching the synchronous
 * localStorage.getItem pattern those stores already use.
 *
 * Do NOT put the JWT/refresh token here - see lib/secureStorage.ts, which
 * uses the Keychain instead because those values are sensitive.
 */
export const storage = new MMKV({ id: 'raillens-storage' });

export function getJSON<T>(key: string): T | null {
  const raw = storage.getString(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setJSON<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

export function remove(key: string): void {
  storage.delete(key);
}
