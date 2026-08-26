import { create } from 'zustand';
import { getJSON, setJSON } from '@/lib/storage';
const STORAGE_KEY = 'raillens-popularity';
interface PopularityEntry {
  code: string;
  name: string;
  views: number;
}
interface PopularityShape {
  trains: Record<string, PopularityEntry>;
  stations: Record<string, PopularityEntry>;
}
interface PopularityState extends PopularityShape {
  recordTrainView: (code: string, name: string) => void;
  recordStationView: (code: string, name: string) => void;
  clear: () => void;
}
const initial: PopularityShape = getJSON<PopularityShape>(STORAGE_KEY) ?? {
  trains: {},
  stations: {},
};
const MAX_ENTRIES_PER_BUCKET = 200;
function persist(state: PopularityShape) {
  setJSON(STORAGE_KEY, state);
}
function recordEntry(
  bucket: Record<string, PopularityEntry>,
  code: string,
  name: string,
): Record<string, PopularityEntry> {
  const existing = bucket[code];
  const nextBucket = { ...bucket };
  if (!existing && Object.keys(nextBucket).length >= MAX_ENTRIES_PER_BUCKET) {
    let leastViewedCode: string | null = null;
    let leastViews = Infinity;
    for (const entry of Object.values(nextBucket)) {
      if (entry.views < leastViews) {
        leastViews = entry.views;
        leastViewedCode = entry.code;
      }
    }
    if (leastViewedCode) {
      delete nextBucket[leastViewedCode];
    }
  }
  nextBucket[code] = { code, name, views: (existing?.views ?? 0) + 1 };
  return nextBucket;
}
export const usePopularityStore = create<PopularityState>((set, get) => ({
  ...initial,
  recordTrainView: (code, name) => {
    const trains = recordEntry(get().trains, code, name);
    persist({ ...get(), trains });
    set({ trains });
  },
  recordStationView: (code, name) => {
    const stations = recordEntry(get().stations, code, name);
    persist({ ...get(), stations });
    set({ stations });
  },
  clear: () => {
    persist({ trains: {}, stations: {} });
    set({ trains: {}, stations: {} });
  },
}));
function topN(entries: Record<string, PopularityEntry>, n: number): PopularityEntry[] {
  return Object.values(entries)
    .sort((a, b) => b.views - a.views)
    .slice(0, n);
}
export function getPopularTrains(n: number) {
  return topN(usePopularityStore.getState().trains, n);
}
export function getPopularStations(n: number) {
  return topN(usePopularityStore.getState().stations, n);
}
