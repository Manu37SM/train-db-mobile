import axios, { AxiosError, InternalAxiosRequestConfig, isAxiosError } from 'axios';
import { API_BASE_URL } from '@/config/env';
import { LOGIN_PROVIDER } from '@/config/login';
import { refresh as railOpsRefresh } from '@/features/auth/railops';
import { getAuthSession, useAuthStore } from '@/store/authStore';
import { getJwtExpiryMillis } from '@/lib/jwt';
import { toStoredSession } from '@/lib/secureStorage';
import { AuthFailure } from '@/lib/apiError';
import type { AuthResponse } from '@/types/api';
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});
let refreshPromise: Promise<string | null> | null = null;
/** The refresh token was refused (401/400/403), as opposed to the network or the server failing. */
export function isSessionOver(error: unknown): boolean {
  const status =
    error instanceof AuthFailure
      ? error.status
      : isAxiosError(error)
        ? error.response?.status
        : undefined;
  return status === 400 || status === 401 || status === 403;
}
async function refreshAccessToken(): Promise<string | null> {
  const session = getAuthSession();
  if (!session?.refreshToken) return null;
  if (!refreshPromise) {
    const refreshed: Promise<AuthResponse> =
      LOGIN_PROVIDER === 'railops'
        ? railOpsRefresh(session.refreshToken, session)
        : axios
            .post<AuthResponse>(`${API_BASE_URL}/auth/refresh`, {
              refreshToken: session.refreshToken,
            })
            .then((res) => res.data);
    refreshPromise = refreshed
      .then(async (data) => {
        // The server re-reads the role on refresh: a demoted admin drops to USER here.
        await useAuthStore.getState().setSession(toStoredSession(data));
        return data.token;
      })
      .catch(async (error: unknown) => {
        // Sign out only when the server says the session is over. A timeout or a service still waking up
        // (free hosting) keeps the person signed in; the next request tries again.
        if (isSessionOver(error)) await useAuthStore.getState().logout();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}
/**
 * A usable access token, refreshed when it is about to expire; null when signed out. For calls that don't go
 * through apiClient, such as RailOps booking (Phase 5B).
 */
export async function getValidAccessToken(): Promise<string | null> {
  const session = getAuthSession();
  if (!session?.token) return null;
  const expiry = getJwtExpiryMillis(session.token);
  if (expiry !== null && expiry - Date.now() < 30000) {
    return refreshAccessToken();
  }
  return session.token;
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
    // A 401 from sign-in itself (wrong password, MFA_REQUIRED, bad code) is an answer, not an expired token.
    const isSignInCall = /^\/?auth\/(login|register|refresh|mfa\/)/.test(original?.url ?? '');
    if (error.response?.status === 401 && original && !original._retried && !isSignInCall) {
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
