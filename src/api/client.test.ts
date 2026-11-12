import { AxiosError, AxiosHeaders } from 'axios';
jest.mock('@/config/env', () => ({ API_BASE_URL: 'https://raillens.example/api/v1' }));
jest.mock('react-native-keychain', () => ({}));
import { isSessionOver } from './client';
import { AuthFailure } from '@/lib/apiError';

const http = (status: number) =>
  new AxiosError('x', 'ERR', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: {},
  });

describe('when a failed refresh signs the person out', () => {
  it('only when the server refused the refresh token', () => {
    expect(isSessionOver(http(401))).toBe(true);
    expect(isSessionOver(new AuthFailure(401, 'x'))).toBe(true);
    expect(isSessionOver(http(400))).toBe(true);
  });
  it('not on timeouts, offline or a server still waking up', () => {
    expect(isSessionOver(new AxiosError('timeout', 'ECONNABORTED'))).toBe(false);
    expect(isSessionOver(new AuthFailure(0, 'offline'))).toBe(false);
    expect(isSessionOver(http(502))).toBe(false);
    expect(isSessionOver(http(503))).toBe(false);
  });
});
