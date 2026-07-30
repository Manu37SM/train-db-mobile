import { create } from 'zustand';
import { getJSON, setJSON } from '@/lib/storage';

/**
 * Port of train-db-frontend/stores/recentSearchStore.ts. Query-text
 * popularity tracking lives in features/home/popularSearchStore.ts, not
 * here - an earlier version of this file also tracked a "popularity" map
 * under the same MMKV key ('raillens-popular-searches') that
 * popularSearchStore.ts independently claimed for its own, different
 * shape, silently corrupting whichever one loaded second. Removed; this
 * store now only does what recentSearchStore.ts does on web.
 */
const RECENT_KEY = 'raillens-recent-searches';
const MAX_RECENT = 20;

export interface SearchEntry {
  type: 'train' | 'station' | 'journey';
  query: string;
  timestamp: number;
}

interface HistoryState {
  recent: SearchEntry[];
  record: (entry: Omit<SearchEntry, 'timestamp'>) => void;
  remove: (entry: SearchEntry) => void;
  clearRecent: () => void;
}

const initialRecent = getJSON<SearchEntry[]>(RECENT_KEY) ?? [];

export const useHistoryStore = create<HistoryState>((set, get) => ({
  recent: initialRecent,

  record: (entry) => {
    const recent = [{ ...entry, timestamp: Date.now() }, ...get().recent]
      .filter((e, i, arr) => arr.findIndex((x) => x.type === e.type && x.query === e.query) === i)
      .slice(0, MAX_RECENT);

    setJSON(RECENT_KEY, recent);
    set({ recent });
  },

  remove: (entry) => {
    const recent = get().recent.filter((e) => !(e.type === entry.type && e.query === entry.query));
    setJSON(RECENT_KEY, recent);
    set({ recent });
  },

  clearRecent: () => {
    setJSON(RECENT_KEY, []);
    set({ recent: [] });
  },
}));
