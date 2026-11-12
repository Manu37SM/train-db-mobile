import * as Keychain from 'react-native-keychain';
import type { AuthResponse } from '@/types/api';
const SERVICE = 'com.raillens.mobile.auth';
export interface StoredSession {
  token: string;
  refreshToken: string;
  username: string;
  email: string;
  /** From the server at sign-in/refresh. Only decides which screens show; the API enforces access. */
  role?: 'USER' | 'ADMIN';
}
/** Only the fields we mean to keep: never the enrolment token or other response extras. */
export function toStoredSession(response: AuthResponse): StoredSession {
  return {
    token: response.token ?? '',
    refreshToken: response.refreshToken ?? '',
    username: response.username,
    email: response.email,
    role: response.role === 'ADMIN' ? 'ADMIN' : 'USER',
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
  try {
    return JSON.parse(result.password) as StoredSession;
  } catch {
    return null;
  }
}
export async function clearSession(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
