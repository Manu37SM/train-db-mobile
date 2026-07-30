import { apiClient } from '@/api/client';
import type {
  Page,
  RouteComparisonResponse,
  TrainDetailsResponse,
  TrainIntelligenceResponse,
  TrainSearchResponse,
} from '@/types/api';

export async function searchTrains(query: string) {
  const { data } = await apiClient.get<TrainSearchResponse[]>('/trains/search', { params: { q: query } });
  return data;
}

export async function getAllTrains(page = 0, size = 20) {
  const { data } = await apiClient.get<Page<TrainSearchResponse>>('/trains', { params: { page, size } });
  return data;
}

export async function getTrainDetails(trainNumber: string) {
  const { data } = await apiClient.get<TrainDetailsResponse>(`/trains/${trainNumber}`);
  return data;
}

export async function getTrainIntelligence(trainNumber: string) {
  const { data } = await apiClient.get<TrainIntelligenceResponse>(`/trains/${trainNumber}/intelligence`);
  return data;
}

export async function compareTrains(trainNumber: string, otherTrainNumber: string) {
  const { data } = await apiClient.get<RouteComparisonResponse>(
    `/trains/${trainNumber}/compare/${otherTrainNumber}`,
  );
  return data;
}
