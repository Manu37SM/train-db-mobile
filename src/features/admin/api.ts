import { apiClient } from '@/api/client';
import type { AdminStatsResponse, DatasetHealthResponse, ImportResult } from '@/types/api';

/**
 * Admin endpoints are gated by a shared key header (not per-user JWT roles
 * - see AuthController javadoc / FEATURE.md "Admin roles" note: RBAC is
 * deliberately deferred backend-side). Mirrors how
 * train-db-frontend/components/admin/AdminKeyForm.tsx attaches the key.
 */
function withAdminKey(adminKey: string) {
  return { headers: { 'X-Admin-Key': adminKey } };
}

export async function getAdminStats(adminKey: string) {
  const { data } = await apiClient.get<AdminStatsResponse>('/admin/stats', withAdminKey(adminKey));
  return data;
}

export async function getDatasetHealth(adminKey: string) {
  const { data } = await apiClient.get<DatasetHealthResponse>('/admin/health', withAdminKey(adminKey));
  return data;
}

export async function clearCache(adminKey: string) {
  await apiClient.post('/admin/cache/clear', null, withAdminKey(adminKey));
}

/**
 * Re-reads the bundled dataset CSV and replaces schedule data for every
 * train it contains. Synchronous and destructive - mirrors
 * train-db-frontend/services/adminService.ts's triggerImport, which the web
 * AdminDashboard gates behind a confirm step (see AdminScreen.tsx).
 */
export async function triggerImport(adminKey: string) {
  const { data } = await apiClient.post<ImportResult>('/admin/import', null, withAdminKey(adminKey));
  return data;
}
