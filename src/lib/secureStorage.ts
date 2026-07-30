import * as Keychain from 'react-native-keychain';

/**
 * JWT/refresh token storage via the OS keychain (Keychain on iOS, Keystore-
 * backed encrypted storage on Android). This is the mobile equivalent of the
 * web app's stores/authStore.ts, which deliberately uses localStorage
 * because the web app has no server-rendered pages needing the token and
 * accepted the XSS trade-off documented there. Mobile has no equivalent
 * "just use localStorage" option and no reason to accept that trade-off, so
 * tokens go in the platform secure storage instead - same session shape,
 * safer storage, otherwise identical semantics (explicit Authorization
 * header set per-request, refresh-then-retry on 401).
 */
const SERVICE = 'com.raillens.mobile.auth';

export interface StoredSession {
  token: string;
  refreshToken: string;
  username: string;
  email: string;
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
