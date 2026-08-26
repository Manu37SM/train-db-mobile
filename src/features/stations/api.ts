import { apiClient } from '@/api/client';
import type {
  Page,
  StationIntelligenceResponse,
  StationResponse,
  StationSearchResponse,
} from '@/types/api';
export async function searchStations(query: string) {
  const { data } = await apiClient.get<StationSearchResponse[]>('/stations/search', {
    params: { q: query },
  });
  return data;
}
export async function getAllStations(page = 0, size = 20) {
  const { data } = await apiClient.get<Page<StationSearchResponse>>('/stations', {
    params: { page, size },
  });
  return data;
}
export async function getStation(stationCode: string) {
  const { data } = await apiClient.get<StationResponse>(`/stations/${stationCode}`);
  return data;
}
export async function getStationIntelligence(stationCode: string) {
  const { data } = await apiClient.get<StationIntelligenceResponse>(
    `/stations/${stationCode}/intelligence`,
  );
  return data;
}
