import { MMKV } from 'react-native-mmkv';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
const queryCacheStorage = new MMKV({ id: 'raillens-query-cache' });
export const queryPersister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => queryCacheStorage.getString(key) ?? null,
    setItem: (key, value) => queryCacheStorage.set(key, value),
    removeItem: (key) => queryCacheStorage.delete(key),
  },
  key: 'RAILLENS_QUERY_CACHE',
});
export const QUERY_PERSIST_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
