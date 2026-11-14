jest.mock('@/config/login', () => ({
  BOOKING_ENABLED: true,
  LOGIN_PROVIDER: 'railops',
  RAILOPS_WAKE_URLS: ['https://gw.example', 'https://id.example'],
}));
import { combine, probeOne, probeService, railopsHealthUrls, raillensHealthUrl } from './probe';

const json = (status: number, body: unknown) =>
  ({ status, ok: status >= 200 && status < 300, json: async () => body }) as unknown as Response;

describe('health probe', () => {
  it('builds the health URLs', () => {
    expect(raillensHealthUrl('https://raillens-api.onrender.com/api/v1')).toBe(
      'https://raillens-api.onrender.com/actuator/health',
    );
    expect(raillensHealthUrl('nonsense')).toBeNull();
    expect(railopsHealthUrls()).toEqual([
      'https://gw.example/actuator/health/readiness',
      'https://id.example/actuator/health/readiness',
    ]);
    expect(railopsHealthUrls(false)).toEqual([]);
  });

  it('UP is up; 502/503/504 and DOWN are down; anything else is still waking', async () => {
    expect(await probeOne('u', async () => json(200, { status: 'UP' }))).toBe('up');
    for (const s of [502, 503, 504]) {
      expect(await probeOne('u', async () => json(s, null))).toBe('down');
    }
    expect(await probeOne('u', async () => json(503 + 0, { status: 'DOWN' }))).toBe('down');
    expect(await probeOne('u', async () => json(200, { status: 'DOWN' }))).toBe('down');
    const html = {
      status: 200,
      ok: true,
      json: async () => JSON.parse('<html>'),
    } as unknown as Response;
    expect(await probeOne('u', async () => html)).toBe('waking'); // Render's "starting" page
  });

  it('an instant network failure is the phone being offline; a slow one is a sleeping server', async () => {
    let t = 0;
    const clock = () => t;
    const fail = async () => {
      t += 200;
      throw new TypeError('Network request failed');
    };
    expect(await probeOne('u', fail, 8000, clock)).toBe('offline');
    const slowFail = async () => {
      t += 5000;
      throw new TypeError('Network request failed');
    };
    expect(await probeOne('u', slowFail, 8000, clock)).toBe('waking');
  });

  it('no answer before the timeout means waking', async () => {
    const hang = (_: unknown, init?: RequestInit) =>
      new Promise<Response>((_r, reject) =>
        init?.signal?.addEventListener('abort', () => reject(new Error('aborted'))),
      );
    expect(await probeOne('u', hang as typeof fetch, 20)).toBe('waking');
  });

  it('combines several services: offline first, then the worst state', () => {
    expect(combine(['up', 'down', 'offline'])).toBe('offline');
    expect(combine(['up', 'waking', 'down'])).toBe('down');
    expect(combine(['up', 'waking'])).toBe('waking');
    expect(combine(['up', 'up'])).toBe('up');
  });

  it('a backend this build does not use counts as up (nothing to report)', async () => {
    const f = jest.fn();
    expect(await probeService([], f)).toBe('up');
    expect(f).not.toHaveBeenCalled();
  });
});
