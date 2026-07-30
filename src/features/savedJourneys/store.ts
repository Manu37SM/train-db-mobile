import { create } from 'zustand';
import { getJSON, setJSON } from '@/lib/storage';

/**
 * Direct port of train-db-frontend/stores/savedJourneyStore.ts. Distinct
 * from favoritesStore.ts (which saves a whole train or station) - this
 * saves a specific boarding/de-boarding pair on a specific train, i.e. a
 * named version of the "plan a partial journey" selection made on
 * TrainDetailsScreen (see src/lib/partialJourney.ts). NOT the same thing
 * as a from→to journey search (that's JourneySearchScreen, unrelated) -
 * an earlier pass of this file conflated the two; fixed to match web.
 */
const STORAGE_KEY = 'raillens-saved-journeys';

export interface SavedJourney {
  id: string;
  trainNumber: string;
  trainName: string;
  boardingStationCode: string;
  boardingStationName: string;
  deboardingStationCode: string;
  deboardingStationName: string;
  distanceKm: number;
  durationMinutes: number | null;
  savedAt: string;
}

interface SavedJourneysState {
  journeys: SavedJourney[];
  isSaved: (trainNumber: string, boardingStationCode: string, deboardingStationCode: string) => boolean;
  toggle: (journey: Omit<SavedJourney, 'id' | 'savedAt'>) => void;
  remove: (id: string) => void;
  clear: () => void;
}

function journeyId(trainNumber: string, boardingStationCode: string, deboardingStationCode: string): string {
  return `${trainNumber}-${boardingStationCode}-${deboardingStationCode}`;
}

const initial = getJSON<SavedJourney[]>(STORAGE_KEY) ?? [];

export const useSavedJourneysStore = create<SavedJourneysState>((set, get) => ({
  journeys: initial,

  isSaved: (trainNumber, boardingStationCode, deboardingStationCode) => {
    const id = journeyId(trainNumber, boardingStationCode, deboardingStationCode);
    return get().journeys.some((j) => j.id === id);
  },

  toggle: (journey) => {
    const id = journeyId(journey.trainNumber, journey.boardingStationCode, journey.deboardingStationCode);
    const exists = get().journeys.some((j) => j.id === id);

    const journeys = exists
      ? get().journeys.filter((j) => j.id !== id)
      : [{ ...journey, id, savedAt: new Date().toISOString() }, ...get().journeys];

    setJSON(STORAGE_KEY, journeys);
    set({ journeys });
  },

  remove: (id) => {
    const journeys = get().journeys.filter((j) => j.id !== id);
    setJSON(STORAGE_KEY, journeys);
    set({ journeys });
  },

  clear: () => {
    setJSON(STORAGE_KEY, []);
    set({ journeys: [] });
  },
}));
