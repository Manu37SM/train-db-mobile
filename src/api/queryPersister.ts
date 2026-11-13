import { createMMKV } from 'react-native-mmkv';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
const queryCacheStorage = createMMKV({ id: 'raillens-query-cache' });
export const queryPersister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => queryCacheStorage.getString(key) ?? null,
    setItem: (key, value) => queryCacheStorage.set(key, value),
    removeItem: (key) => {
      queryCacheStorage.remove(key);
    },
  },
  key: 'RAILLENS_QUERY_CACHE',
});
export const QUERY_PERSIST_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * The cache file is plain storage, so nothing personal goes in it: the signed-in profile, admin data and bookings
 * (names, ages, PNRs) stay in memory only. Public train and station data is still kept for offline use.
 */
const PRIVATE_ROOTS = new Set(['auth', 'admin', 'booking']);
/** Structural type on purpose: two copies of query-core are installed, and their Query classes don't match. */
export function shouldPersistQuery(query: {
  state: { status: string };
  queryKey: readonly unknown[];
}): boolean {
  // TanStack's default is "successful queries only"; this adds the privacy filter.
  return query.state.status === 'success' && !PRIVATE_ROOTS.has(String(query.queryKey[0]));
}
