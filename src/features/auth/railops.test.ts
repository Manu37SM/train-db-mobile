import { AxiosError, AxiosHeaders } from 'axios';

const mockPost = jest.fn();
const mockGet = jest.fn();
jest.mock('@/config/env', () => ({ API_BASE_URL: 'https://raillens.example/api/v1' }));
jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  // Called lazily: the module under test runs axios.create() while it is imported, before these consts exist.
  return {
    __esModule: true,
    ...actual,
    default: {
      ...actual.default,
      create: () => ({
        post: (...a: unknown[]) => mockPost(...a),
        get: (...a: unknown[]) => mockGet(...a),
        interceptors: { request: { use: () => 0 }, response: { use: () => 0 } },
      }),
    },
  };
});

import { login, logout, refresh, register } from './railops';
import { AuthFailure, getApiErrorCode, getApiErrorMessage } from '@/lib/apiError';

function httpError(status: number, data: unknown) {
  return new AxiosError('fail', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });
}
const session = {
  accessToken: 'ro-access',
  expiresIn: 600,
  refreshToken: 'ro-refresh',
  refreshExpiresIn: 1209600,
};
const me = { username: 'asha_1a2b3c', email: 'asha@example.com', role: 'USER' };

describe('RailOps sign-in (Phase 4D)', () => {
  beforeEach(() => {
    mockPost.mockReset();
    mockGet.mockReset();
  });

  it('login: RailOps session + RailLens profile, in the usual AuthResponse shape', async () => {
    mockPost.mockResolvedValueOnce({ data: session });
    mockGet.mockResolvedValueOnce({ data: me });
    const res = await login(' asha@example.com ', 'pw');
    expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/app/login', {
      email: 'asha@example.com',
      password: 'pw',
    });
    expect(mockGet.mock.calls[0][0]).toMatch(/\/auth\/me$/);
    expect(mockGet.mock.calls[0][1].headers.Authorization).toBe('Bearer ro-access');
    expect(res).toMatchObject({
      token: 'ro-access',
      refreshToken: 'ro-refresh',
      username: 'asha_1a2b3c',
      role: 'USER',
    });
  });

  it('login: staff code is sent; a username is refused before any call', async () => {
    mockPost.mockResolvedValueOnce({ data: session });
    mockGet.mockResolvedValueOnce({ data: { ...me, role: 'ADMIN' } });
    expect((await login('ops@x.in', 'pw', '123456')).role).toBe('ADMIN');
    expect(mockPost.mock.calls[0][1].otp).toBe('123456');

    const err = await login('asha', 'pw').catch((e) => e);
    expect(getApiErrorCode(err)).toBe('EMAIL_REQUIRED');
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it('login: wrong password and MFA-setup-needed become clear messages', async () => {
    mockPost.mockRejectedValueOnce(httpError(401, { code: 'AUTH_FAILED', detail: 'x' }));
    const bad = await login('a@x.in', 'pw').catch((e) => e);
    expect(bad).toBeInstanceOf(AuthFailure);
    expect(getApiErrorMessage(bad, 'f')).toBe('Invalid email, password or code.');

    mockPost.mockResolvedValueOnce({
      data: { status: 'MFA_ENROLMENT_REQUIRED', enrolmentToken: 'e' },
    });
    expect(getApiErrorCode(await login('a@x.in', 'pw').catch((e) => e))).toBe(
      'MFA_SETUP_IN_RAILOPS',
    );
  });

  it('login: if RailLens refuses the profile, the new RailOps session is ended', async () => {
    mockPost.mockResolvedValueOnce({ data: session }).mockResolvedValueOnce({ data: null });
    mockGet.mockRejectedValueOnce(
      httpError(401, { error: 'This email already has a RailLens account that isn’t linked' }),
    );
    const err = await login('a@x.in', 'pw').catch((e) => e);
    expect(getApiErrorMessage(err, 'f')).toContain('isn’t linked');
    expect(mockPost).toHaveBeenLastCalledWith('/api/v1/auth/app/logout', {
      refreshToken: 'ro-refresh',
    });
  });

  it('register: creates the RailOps account then signs in; weak passwords show RailOps’ reason', async () => {
    mockPost
      .mockResolvedValueOnce({ data: { userId: 'u' } })
      .mockResolvedValueOnce({ data: session });
    mockGet.mockResolvedValueOnce({ data: me });
    await register('asha@example.com', ' 98765 43210 ', 'long-enough-1');
    expect(mockPost.mock.calls[0]).toEqual([
      '/api/v1/auth/register',
      { email: 'asha@example.com', password: 'long-enough-1', phone: '98765 43210' },
    ]);

    mockPost.mockRejectedValueOnce(
      httpError(422, { code: 'WEAK_PASSWORD', detail: 'this password is too common' }),
    );
    const weak = await register('a@x.in', '9876543210', 'password123').catch((e) => e);
    expect(getApiErrorMessage(weak, 'f')).toContain('too common');
  });

  it('refresh: keeps the new tokens even when RailLens is asleep, but not when it refuses', async () => {
    const previous = { username: 'asha_1a2b3c', email: 'asha@example.com', role: 'ADMIN' as const };
    mockPost.mockResolvedValueOnce({ data: { ...session, refreshToken: 'rotated' } });
    mockGet.mockRejectedValueOnce(new AxiosError('timeout', 'ECONNABORTED'));
    const res = await refresh('old', previous);
    expect(mockPost).toHaveBeenCalledWith('/api/v1/auth/app/refresh', { refreshToken: 'old' });
    expect(res).toMatchObject({ refreshToken: 'rotated', username: 'asha_1a2b3c', role: 'ADMIN' });

    mockPost.mockResolvedValueOnce({ data: session });
    mockGet.mockRejectedValueOnce(httpError(401, { error: 'no' }));
    await expect(refresh('old', previous)).rejects.toBeInstanceOf(AuthFailure);

    mockPost.mockRejectedValueOnce(httpError(401, {}));
    await expect(refresh('old', previous)).rejects.toMatchObject({ status: 401 });
  });

  it('logout never throws', async () => {
    mockPost.mockRejectedValueOnce(new Error('down'));
    await expect(logout('rt')).resolves.toBeUndefined();
  });
});
