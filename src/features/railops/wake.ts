import { BOOKING_ENABLED, LOGIN_PROVIDER, RAILOPS_WAKE_URLS } from '@/config/login';

export const HEALTH_PATH = '/actuator/health/readiness';
const EVERY_MS = 4 * 60 * 1000;
let lastWake = 0;

/** For tests. */
export function resetWake() {
  lastWake = 0;
}

/**
 * Pings every RailOps service so a sleeping one starts before the person signs in or books (see RAILOPS_WAKE_URLS).
 * Fire-and-forget, at most once every few minutes, never throws. Returns how many were pinged.
 */
export function wakeRailOps(
  now: number = Date.now(),
  fetchImpl: typeof fetch = fetch,
  enabled: boolean = LOGIN_PROVIDER === 'railops' || BOOKING_ENABLED,
): number {
  if (!enabled || now - lastWake < EVERY_MS) return 0;
  lastWake = now;
  for (const url of RAILOPS_WAKE_URLS) {
    fetchImpl(`${url}${HEALTH_PATH}`, { method: 'GET' }).catch(() => {});
  }
  return RAILOPS_WAKE_URLS.length;
}
