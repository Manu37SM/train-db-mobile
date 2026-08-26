import { MMKV } from 'react-native-mmkv';
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
