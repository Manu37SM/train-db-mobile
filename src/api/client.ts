import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/config/env';
import { getAuthSession, useAuthStore } from '@/store/authStore';
import { getJwtExpiryMillis } from '@/lib/jwt';
import type { AuthResponse } from '@/types/api';
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});
let refreshPromise: Promise<string | null> | null = null;
async function refreshAccessToken(): Promise<string | null> {
  const session = getAuthSession();
  if (!session?.refreshToken) return null;
  if (!refreshPromise) {
    refreshPromise = axios
      .post<AuthResponse>(`${API_BASE_URL}/auth/refresh`, {
        refreshToken: session.refreshToken,
      })
      .then(async (res) => {
        await useAuthStore.getState().setSession(res.data);
        return res.data.token;
      })
      .catch(async () => {
        await useAuthStore.getState().logout();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const session = getAuthSession();
  if (!session?.token) return config;
  const expiry = getJwtExpiryMillis(session.token);
  const isNearExpiry = expiry !== null && expiry - Date.now() < 30000;
  const token = isNearExpiry ? ((await refreshAccessToken()) ?? session.token) : session.token;
  config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & {
          _retried?: boolean;
        })
      | undefined;
    if (error.response?.status === 401 && original && !original._retried) {
      original._retried = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        original.headers.set('Authorization', `Bearer ${newToken}`);
        return apiClient.request(original);
      }
    }
    return Promise.reject(error);
  },
);
