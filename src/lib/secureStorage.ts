import * as Keychain from 'react-native-keychain';
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
