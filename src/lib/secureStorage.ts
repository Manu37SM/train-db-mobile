import * as Keychain from 'react-native-keychain';
import { LOGIN_PROVIDER, LoginProvider } from '@/config/login';
import type { AuthResponse } from '@/types/api';
const SERVICE = 'com.raillens.mobile.auth';
export interface StoredSession {
  token: string;
  refreshToken: string;
  username: string;
  email: string;
  /** From the server at sign-in/refresh. Only decides which screens show; the API enforces access. */
  role?: 'USER' | 'ADMIN';
  /** Which login issued these tokens (Phase 4D). Missing = saved before 4D = 'raillens'. */
  provider?: LoginProvider;
}
/** Only the fields we mean to keep: never the enrolment token or other response extras. */
export function toStoredSession(response: AuthResponse): StoredSession {
  return {
    token: response.token ?? '',
    refreshToken: response.refreshToken ?? '',
    username: response.username,
    email: response.email,
    role: response.role === 'ADMIN' ? 'ADMIN' : 'USER',
    provider: LOGIN_PROVIDER,
  };
}
export async function saveSession(session: StoredSession): Promise<void> {
  await Keychain.setGenericPassword(session.username, JSON.stringify(session), {
    service: SERVICE,
  });
}
export async function loadSession(): Promise<StoredSession | null> {
  const result = await Keychain.getGenericPassword({ service: SERVICE });
  if (!result) return null;
  let session: StoredSession;
  try {
    session = JSON.parse(result.password) as StoredSession;
  } catch {
    return null;
  }
  // After an update that switched login, the old tokens belong to the other service: never send them there.
  // The person simply signs in once more.
  if (!isFromCurrentLogin(session)) {
    await clearSession();
    return null;
  }
  return session;
}
export function isFromCurrentLogin(session: StoredSession): boolean {
  return (session.provider ?? 'raillens') === LOGIN_PROVIDER;
}
export async function clearSession(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
