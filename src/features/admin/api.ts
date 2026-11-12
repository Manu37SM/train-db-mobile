import { apiClient } from '@/api/client';
import type { AdminStatsResponse, DatasetHealthResponse, ImportResult } from '@/types/api';
// Admin calls carry the signed-in admin's own bearer token (added by apiClient, refreshed when it nears expiry:
// admin tokens last 15 minutes). The shared X-Admin-Key is gone.
export async function getAdminStats() {
  const { data } = await apiClient.get<AdminStatsResponse>('/admin/stats');
  return data;
}
export async function getDatasetHealth() {
  const { data } = await apiClient.get<DatasetHealthResponse>('/admin/health');
  return data;
}
export async function clearCache() {
  await apiClient.post('/admin/cache/clear', null);
}
export async function triggerImport() {
  const { data } = await apiClient.post<ImportResult>('/admin/import', null);
  return data;
}
