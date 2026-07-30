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

function persist(state: PopularityShape) {
  setJSON(STORAGE_KEY, state);
}

export const usePopularityStore = create<PopularityState>((set, get) => ({
  ...initial,

  recordTrainView: (code, name) => {
    const existing = get().trains[code];
    const trains = { ...get().trains, [code]: { code, name, views: (existing?.views ?? 0) + 1 } };
    persist({ ...get(), trains });
    set({ trains });
  },

  recordStationView: (code, name) => {
    const existing = get().stations[code];
    const stations = { ...get().stations, [code]: { code, name, views: (existing?.views ?? 0) + 1 } };
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
