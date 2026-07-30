import { create } from 'zustand';
import { getJSON, setJSON } from '@/lib/storage';

export type ThemePreference = 'light' | 'dark' | 'system';

interface PreferencesShape {
  theme: ThemePreference;
  defaultFromStationCode: string | null;
  defaultFromStationName: string | null;
}

interface PreferencesState extends PreferencesShape {
  setTheme: (theme: ThemePreference) => void;
  setDefaultFromStation: (stationCode: string, stationName: string) => void;
  clearDefaultFromStation: () => void;
}

const STORAGE_KEY = 'raillens-preferences';

const initial: PreferencesShape = {
  theme: 'system',
  defaultFromStationCode: null,
  defaultFromStationName: null,
  ...getJSON<Partial<PreferencesShape>>(STORAGE_KEY),
};

function persist(state: PreferencesShape) {
  setJSON(STORAGE_KEY, state);
}

/**
 * Mirrors train-db-frontend/lib/theme.ts (theme) and
 * stores/preferencesStore.ts (defaultFromStation*, used by AccountClient's
 * PreferencesCard to pre-fill JourneySearchForm's From field) - one
 * combined store here since both are small persisted preferences, backed
 * by MMKV instead of localStorage.
 */
export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  ...initial,

  setTheme: (theme) => {
    const next = { ...get(), theme };
    persist(next);
    set({ theme });
  },

  setDefaultFromStation: (stationCode, stationName) => {
    const next = { ...get(), defaultFromStationCode: stationCode, defaultFromStationName: stationName };
    persist(next);
    set({ defaultFromStationCode: stationCode, defaultFromStationName: stationName });
  },

  clearDefaultFromStation: () => {
    const next = { ...get(), defaultFromStationCode: null, defaultFromStationName: null };
    persist(next);
    set({ defaultFromStationCode: null, defaultFromStationName: null });
  },
}));
