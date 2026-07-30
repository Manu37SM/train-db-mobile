import { create } from 'zustand';
import { getJSON, setJSON } from '@/lib/storage';

/**
 * Direct port of train-db-frontend/stores/favoritesStore.ts - favorite
 * trains, stations, and routes, per-device, MMKV instead of localStorage.
 * Deliberately NOT synced to the backend: the web app doesn't do this
 * either (see MOBILE_FEATURE_PARITY.md), so this isn't a mobile gap, it's
 * matching the existing architecture.
 */
const STORAGE_KEY = 'raillens-favorites';

interface FavoritesShape {
  trains: string[];
  stations: string[];
  routes: string[]; // `${from}-${to}` keys, mirrors web's route favorite key shape
}

interface FavoritesState extends FavoritesShape {
  toggleTrain: (trainNumber: string) => void;
  toggleStation: (stationCode: string) => void;
  toggleRoute: (routeKey: string) => void;
}

function persist(state: FavoritesShape) {
  setJSON(STORAGE_KEY, state);
}

const initial = getJSON<FavoritesShape>(STORAGE_KEY) ?? { trains: [], stations: [], routes: [] };

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ...initial,

  toggleTrain: (trainNumber) => {
    const trains = get().trains.includes(trainNumber)
      ? get().trains.filter((t) => t !== trainNumber)
      : [...get().trains, trainNumber];
    persist({ ...get(), trains });
    set({ trains });
  },

  toggleStation: (stationCode) => {
    const stations = get().stations.includes(stationCode)
      ? get().stations.filter((s) => s !== stationCode)
      : [...get().stations, stationCode];
    persist({ ...get(), stations });
    set({ stations });
  },

  toggleRoute: (routeKey) => {
    const routes = get().routes.includes(routeKey)
      ? get().routes.filter((r) => r !== routeKey)
      : [...get().routes, routeKey];
    persist({ ...get(), routes });
    set({ routes });
  },
}));
