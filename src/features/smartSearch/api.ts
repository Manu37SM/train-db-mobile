import { apiClient } from '@/api/client';
import type { SmartSearchResponse } from '@/types/api';
export async function smartSearch(query: string) {
  const { data } = await apiClient.get<SmartSearchResponse>('/search/smart', {
    params: { q: query },
  });
  return data;
}
