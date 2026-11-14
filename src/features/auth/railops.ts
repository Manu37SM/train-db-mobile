import axios, { isAxiosError } from 'axios';
import { API_BASE_URL } from '@/config/env';
import { RAILOPS_BASE_URL } from '@/config/login';
import { AuthFailure } from '@/lib/apiError';
import { watchBackend } from '@/features/backendStatus/monitor';
import type { AuthResponse, CurrentUserResponse } from '@/types/api';

/**
 * Sign-in through the RailOps login (single login, Phase 4D). RailOps' app endpoints return the refresh token in the
 * body, which the app keeps in the Keychain as before. RailLens' backend then answers /auth/me for the RailOps access
 * token: it links or creates the RailLens profile and says whether the person is an admin. Everything is returned in
 * RailLens' AuthResponse shape, so the rest of the app doesn't know which login is in use.
 *
 * Password change and account closing need nothing here: the app calls RailLens as before, and RailLens forwards
 * them to RailOps for linked profiles.
 */
const railOps = axios.create({ baseURL: RAILOPS_BASE_URL, timeout: 30000 });
watchBackend(railOps, 'railops');
/** RailLens' /auth/me after a RailOps sign-in; watched so a sleeping RailLens shows the banner too. */
const raillens = axios.create({ timeout: 30000 });
watchBackend(raillens, 'raillens');

interface AppSession {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
}

function asSession(data: unknown): AppSession | null {
  const d = data as Partial<AppSession> | null;
  return d && typeof d.accessToken === 'string' && typeof d.refreshToken === 'string'
    ? (d as AppSession)
    : null;
}

/** RailOps answers with problem details; the app shows RailLens-style messages instead. */
export function toAuthFailure(error: unknown): AuthFailure {
  if (error instanceof AuthFailure) return error;
  if (!isAxiosError(error) || !error.response) {
    return new AuthFailure(0, 'Unable to reach the server. Check your connection and try again.');
  }
  const { status, data } = error.response as {
    status: number;
    data?: { code?: string; detail?: string };
  };
  if (status === 401)
    return new AuthFailure(401, 'Invalid email, password or code.', 'INVALID_CREDENTIALS');
  if (status === 429)
    return new AuthFailure(
      429,
      'Too many attempts. Please wait a minute and try again.',
      'RATE_LIMITED',
    );
  if (status === 409 || data?.code === 'ACCOUNT_EXISTS')
    return new AuthFailure(
      409,
      'An account with this email or phone number already exists.',
      'ACCOUNT_EXISTS',
    );
  if (status === 422 && data?.detail)
    return new AuthFailure(
      422,
      `Choose a stronger password: ${data.detail}.`,
      data.code ?? 'WEAK_PASSWORD',
    );
  if (status === 400)
    return new AuthFailure(400, 'Check the details you entered and try again.', 'VALIDATION_ERROR');
  return new AuthFailure(status, 'Sign-in is unavailable right now. Please try again in a minute.');
}

async function profile(accessToken: string): Promise<CurrentUserResponse> {
  try {
    const { data } = await raillens.get<CurrentUserResponse>(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return data;
  } catch (error) {
    if (isAxiosError<{ error?: string; code?: string }>(error) && error.response) {
      // e.g. 401 "This email already has a RailLens account that isn't linked..." - shown as is.
      throw new AuthFailure(
        error.response.status,
        error.response.data?.error ?? 'Request failed',
        error.response.data?.code,
      );
    }
    throw new AuthFailure(0, 'Unable to reach the server. Check your connection and try again.');
  }
}

function toAuthResponse(
  session: AppSession,
  me: Pick<CurrentUserResponse, 'username' | 'email' | 'role'>,
): AuthResponse {
  return {
    token: session.accessToken,
    tokenType: 'Bearer',
    expiresInSeconds: session.expiresIn,
    refreshToken: session.refreshToken,
    username: me.username,
    email: me.email,
    role: me.role === 'ADMIN' ? 'ADMIN' : 'USER',
  };
}

export async function logout(refreshToken: string): Promise<void> {
  try {
    await railOps.post('/api/v1/auth/app/logout', { refreshToken });
  } catch {
    // The session expires on its own.
  }
}

export async function login(email: string, password: string, otp?: string): Promise<AuthResponse> {
  const trimmed = email.trim();
  if (!trimmed.includes('@')) {
    throw new AuthFailure(400, 'Sign in with your email address.', 'EMAIL_REQUIRED');
  }
  let session: AppSession | null;
  try {
    const { data } = await railOps.post('/api/v1/auth/app/login', {
      email: trimmed,
      password,
      ...(otp ? { otp } : {}),
    });
    if ((data as { status?: string })?.status === 'MFA_ENROLMENT_REQUIRED') {
      throw new AuthFailure(
        403,
        'Finish setting up two-step sign-in in the RailOps staff app first, then sign in here.',
        'MFA_SETUP_IN_RAILOPS',
      );
    }
    session = asSession(data);
  } catch (error) {
    throw toAuthFailure(error);
  }
  if (!session)
    throw new AuthFailure(502, 'Sign-in is unavailable right now. Please try again in a minute.');
  try {
    return toAuthResponse(session, await profile(session.accessToken));
  } catch (error) {
    await logout(session.refreshToken); // no half-signed-in RailOps session left behind
    throw error;
  }
}

export async function register(
  email: string,
  phone: string,
  password: string,
): Promise<AuthResponse> {
  try {
    await railOps.post('/api/v1/auth/register', {
      email: email.trim(),
      password,
      phone: phone.trim(),
    });
  } catch (error) {
    throw toAuthFailure(error);
  }
  return login(email, password);
}

/**
 * The refresh token is used up by this call, so the new pair is always returned. If RailLens can't answer right now
 * (asleep), the previous username/email/role are kept: role only decides which screens show, the API enforces access.
 */
export async function refresh(
  refreshToken: string,
  previous: { username: string; email: string; role?: 'USER' | 'ADMIN' },
): Promise<AuthResponse> {
  let session: AppSession | null;
  try {
    const { data } = await railOps.post('/api/v1/auth/app/refresh', { refreshToken });
    session = asSession(data);
  } catch (error) {
    throw toAuthFailure(error);
  }
  if (!session) throw new AuthFailure(502, 'Sign-in is unavailable right now.');
  try {
    return toAuthResponse(session, await profile(session.accessToken));
  } catch (error) {
    if (error instanceof AuthFailure && error.status === 401) throw error;
    return toAuthResponse(session, previous);
  }
}
