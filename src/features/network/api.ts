import { apiClient } from '@/api/client';
import type { NetworkStatsResponse } from '@/types/api';
export async function getNetworkStats() {
  const { data } = await apiClient.get<NetworkStatsResponse>('/network/stats');
  return data;
}
