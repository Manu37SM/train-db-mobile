jest.mock('@/config/login', () => ({
  BOOKING_ENABLED: false,
  LOGIN_PROVIDER: 'raillens',
  RAILOPS_WAKE_URLS: [],
}));
import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { failureStatus, watchBackend } from './monitor';
import type { BackendStatusStore } from './store';

function fakeStore() {
  return {
    report: jest.fn(),
    suspect: jest.fn(async () => {}),
  } as unknown as BackendStatusStore & { report: jest.Mock; suspect: jest.Mock };
}

function client(adapter: AxiosAdapter, slowMs = 1000) {
  const store = fakeStore();
  const c = axios.create({ adapter });
  watchBackend(c, 'raillens', () => store, slowMs);
  return { c, store };
}

const answer =
  (status: number, delayMs = 0): AxiosAdapter =>
  (config: InternalAxiosRequestConfig) =>
    new Promise((resolve, reject) =>
      setTimeout(() => {
        const res = { status, statusText: '', headers: {}, config, data: {} };
        if (status < 400) resolve(res);
        else reject(new AxiosError('fail', 'ERR_BAD_RESPONSE', config, null, res));
      }, delayMs),
    );

describe('watchBackend', () => {
  it('reports 502/503/504 and no-answer failures, and still rejects for the caller', async () => {
    for (const s of [502, 503, 504]) {
      const { c, store } = client(answer(s));
      await expect(c.get('/x')).rejects.toBeInstanceOf(AxiosError);
      expect(store.report).toHaveBeenCalledWith('raillens');
    }
    const timeout: AxiosAdapter = (config) =>
      Promise.reject(new AxiosError('timeout of 15000ms exceeded', 'ECONNABORTED', config));
    const { c, store } = client(timeout);
    await expect(c.get('/x')).rejects.toThrow('timeout');
    expect(store.report).toHaveBeenCalledWith('raillens');
  });

  it('ordinary errors (wrong input, not found, server bug) never show the banner', async () => {
    for (const s of [400, 401, 404, 409, 429, 500]) {
      const { c, store } = client(answer(s));
      await expect(c.get('/x')).rejects.toBeInstanceOf(AxiosError);
      expect(store.report).not.toHaveBeenCalled();
    }
  });

  it('a slow request gets a quiet health check; a quick one does not', async () => {
    const slow = client(answer(200, 60), 20);
    await slow.c.get('/x');
    expect(slow.store.suspect).toHaveBeenCalledWith('raillens');

    const quick = client(answer(200, 0), 50);
    await quick.c.get('/x');
    await new Promise<void>((r) => setTimeout(r, 80));
    expect(quick.store.suspect).not.toHaveBeenCalled();
  });

  it('a cancelled request is not a backend problem', () => {
    expect(failureStatus(new axios.CanceledError())).toBe(-1);
    expect(failureStatus(new Error('x'))).toBe(-1);
    expect(failureStatus(new AxiosError('net', 'ERR_NETWORK'))).toBe(0);
  });
});
