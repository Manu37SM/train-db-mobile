import { apiClient } from '@/api/client';
import type { JourneySearchResponse } from '@/types/api';

export async function searchJourneys(from: string, to: string) {
  const { data } = await apiClient.get<JourneySearchResponse>('/journeys', { params: { from, to } });
  return data;
}
