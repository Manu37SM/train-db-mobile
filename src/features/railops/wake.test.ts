import { HEALTH_PATH, resetWake, wakeRailOps } from './wake';
import { RAILOPS_WAKE_URLS } from '@/config/login';

describe('wakeRailOps', () => {
  beforeEach(() => resetWake());

  it('does nothing while the app uses neither the RailOps login nor booking', () => {
    const f = jest.fn();
    expect(wakeRailOps(1_000_000, f as unknown as typeof fetch, false)).toBe(0);
    expect(f).not.toHaveBeenCalled();
  });

  it('pings every RailOps service once, then not again for a few minutes; failures are ignored', () => {
    const f = jest.fn().mockRejectedValue(new Error('asleep'));
    expect(wakeRailOps(1_000_000, f as unknown as typeof fetch, true)).toBe(
      RAILOPS_WAKE_URLS.length,
    );
    expect(f).toHaveBeenCalledTimes(RAILOPS_WAKE_URLS.length);
    expect(f.mock.calls[0][0]).toBe(`${RAILOPS_WAKE_URLS[0]}${HEALTH_PATH}`);
    expect(wakeRailOps(1_060_000, f as unknown as typeof fetch, true)).toBe(0);
    expect(wakeRailOps(1_000_000 + 4 * 60 * 1000, f as unknown as typeof fetch, true)).toBe(
      RAILOPS_WAKE_URLS.length,
    );
  });
});
