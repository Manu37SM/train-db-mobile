import { apiClient } from '@/api/client';
import type { AchievementsResponse, FunStatsResponse, RankingsResponse, StatsResponse } from '@/types/api';

export async function getStats() {
  const { data } = await apiClient.get<StatsResponse>('/stats');
  return data;
}

export async function getRankings() {
  const { data } = await apiClient.get<RankingsResponse>('/stats/rankings');
  return data;
}

export async function getFunStats() {
  const { data } = await apiClient.get<FunStatsResponse>('/stats/fun-facts');
  return data;
}

export async function getAchievements() {
  const { data } = await apiClient.get<AchievementsResponse>('/stats/achievements');
  return data;
}
