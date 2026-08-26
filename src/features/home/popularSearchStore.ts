import { create } from 'zustand';
import { getJSON, setJSON } from '@/lib/storage';
const STORAGE_KEY = 'raillens-popular-searches';
const MIN_QUERY_LENGTH = 2;
export interface PopularSearchEntry {
  query: string;
  displayQuery: string;
  count: number;
}
interface PopularSearchShape {
  trains: Record<string, PopularSearchEntry>;
  stations: Record<string, PopularSearchEntry>;
}
interface PopularSearchState extends PopularSearchShape {
  recordTrainSearch: (query: string) => void;
  recordStationSearch: (query: string) => void;
  clear: () => void;
}
const initial: PopularSearchShape = getJSON<PopularSearchShape>(STORAGE_KEY) ?? {
  trains: {},
  stations: {},
};
const MAX_ENTRIES_PER_BUCKET = 200;
function persist(state: PopularSearchShape) {
  setJSON(STORAGE_KEY, state);
}
function recordInto(
  bucket: Record<string, PopularSearchEntry>,
  rawQuery: string,
): Record<string, PopularSearchEntry> | null {
  const displayQuery = rawQuery.trim();
  const query = displayQuery.toLowerCase();
  if (query.length < MIN_QUERY_LENGTH) return null;
  const existing = bucket[query];
  const nextBucket = { ...bucket };
  if (!existing && Object.keys(nextBucket).length >= MAX_ENTRIES_PER_BUCKET) {
    let leastSearchedQuery: string | null = null;
    let leastCount = Infinity;
    for (const entry of Object.values(nextBucket)) {
      if (entry.count < leastCount) {
        leastCount = entry.count;
        leastSearchedQuery = entry.query;
      }
    }
    if (leastSearchedQuery) {
      delete nextBucket[leastSearchedQuery];
    }
  }
  nextBucket[query] = {
    query,
    displayQuery: existing?.displayQuery ?? displayQuery,
    count: (existing?.count ?? 0) + 1,
  };
  return nextBucket;
}
export const usePopularSearchStore = create<PopularSearchState>((set, get) => ({
  ...initial,
  recordTrainSearch: (query) => {
    const trains = recordInto(get().trains, query);
    if (!trains) return;
    persist({ ...get(), trains });
    set({ trains });
  },
  recordStationSearch: (query) => {
    const stations = recordInto(get().stations, query);
    if (!stations) return;
    persist({ ...get(), stations });
    set({ stations });
  },
  clear: () => {
    persist({ trains: {}, stations: {} });
    set({ trains: {}, stations: {} });
  },
}));
function topEntries(
  entries: Record<string, PopularSearchEntry>,
  limit: number,
): PopularSearchEntry[] {
  return Object.values(entries)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
export function getPopularTrainSearches(limit = 5) {
  return topEntries(usePopularSearchStore.getState().trains, limit);
}
export function getPopularStationSearches(limit = 5) {
  return topEntries(usePopularSearchStore.getState().stations, limit);
}
