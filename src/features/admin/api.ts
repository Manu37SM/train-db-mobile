import { apiClient } from '@/api/client';
import type { AdminStatsResponse, DatasetHealthResponse, ImportResult } from '@/types/api';
function withAdminKey(adminKey: string) {
  return { headers: { 'X-Admin-Key': adminKey } };
}
export async function getAdminStats(adminKey: string) {
  const { data } = await apiClient.get<AdminStatsResponse>('/admin/stats', withAdminKey(adminKey));
  return data;
}
export async function getDatasetHealth(adminKey: string) {
  const { data } = await apiClient.get<DatasetHealthResponse>(
    '/admin/health',
    withAdminKey(adminKey),
  );
  return data;
}
export async function clearCache(adminKey: string) {
  await apiClient.post('/admin/cache/clear', null, withAdminKey(adminKey));
}
export async function triggerImport(adminKey: string) {
  const { data } = await apiClient.post<ImportResult>(
    '/admin/import',
    null,
    withAdminKey(adminKey),
  );
  return data;
}
