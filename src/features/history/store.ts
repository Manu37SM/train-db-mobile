import { create } from 'zustand';
import { getJSON, setJSON } from '@/lib/storage';
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
