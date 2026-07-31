import { create } from 'zustand';
import { getJSON, setJSON } from '@/lib/storage';

/**
 * Direct port of train-db-frontend/stores/popularityStore.ts - "trains/
 * stations you've viewed most on this device", purely client-side view
 * counting (no server-side analytics exists to back a real global
 * ranking, same disclaimer as web's Popular.tsx). MMKV instead of
 * localStorage.
 */
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

const initial: PopularityShape = getJSON<PopularityShape>(STORAGE_KEY) ?? { trains: {}, stations: {} };

// Without a cap, a long-lived user browsing widely across the ~14,000-train/
// several-thousand-station catalog over months would grow this map roughly
// proportional to the dataset itself - unbounded MMKV growth plus an
// ever-growing full-object JSON.stringify + write on every single view (see
// persist() below). 200 is generous headroom over what's ever displayed
// (top 5/10), so this never affects normal usage.
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
