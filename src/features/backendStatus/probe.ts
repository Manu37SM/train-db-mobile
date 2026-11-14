import { BOOKING_ENABLED, LOGIN_PROVIDER, RAILOPS_WAKE_URLS } from '@/config/login';
import { HEALTH_PATH } from '@/features/railops/wake';
import type { ProbeState } from './store';

/**
 * Asks a backend how it is, straight from the phone (the website does this from its own server). The request also
 * wakes a sleeping Render service.
 *
 *  - up:      the health endpoint answered UP.
 *  - waking:  no answer within the timeout, or Render's "starting" page instead of JSON. A sleeping free service
 *             holds requests while it boots, so this is what a cold start looks like.
 *  - down:    Render answered 502/503/504, or the service reported itself DOWN: crashed (out of memory included),
 *             restarting after a crash, or a failed deploy.
 *  - offline: the request failed at once without reaching anything: the phone has no connection.
 */
export const PROBE_TIMEOUT_MS = 8000;
/** A failure faster than this, other than our own timeout, is the phone's connection, not a sleeping server. */
export const OFFLINE_FAIL_MS = 3000;

/** https://host/api/v1 -> https://host/actuator/health */
export function raillensHealthUrl(apiBase: string): string | null {
  const m = /^(https?:\/\/[^/]+)/.exec(apiBase);
  return m ? `${m[1]}/actuator/health` : null;
}

export function railopsHealthUrls(
  enabled: boolean = LOGIN_PROVIDER === 'railops' || BOOKING_ENABLED,
): string[] {
  return enabled ? RAILOPS_WAKE_URLS.map((base) => `${base}${HEALTH_PATH}`) : [];
}

export async function probeOne(
  url: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = PROBE_TIMEOUT_MS,
  now: () => number = Date.now,
): Promise<ProbeState> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = now();
  let res: Response;
  try {
    res = await fetchImpl(url, {
      method: 'GET',
      headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
      signal: controller.signal,
    });
  } catch {
    const timedOut = controller.signal.aborted;
    return !timedOut && now() - started < OFFLINE_FAIL_MS ? 'offline' : 'waking';
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 502 || res.status === 503 || res.status === 504) return 'down';
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    return 'waking';
  }
  const status = (body as { status?: unknown } | null)?.status;
  if (res.ok && status === 'UP') return 'up';
  if (status === 'DOWN' || status === 'OUT_OF_SERVICE') return 'down';
  return 'waking';
}

/** Offline wins (nothing can be judged), then worst state: one RailOps service down means booking is down. */
export function combine(states: ProbeState[]): ProbeState {
  if (states.includes('offline')) return 'offline';
  if (states.includes('down')) return 'down';
  if (states.includes('waking')) return 'waking';
  return 'up';
}

export async function probeService(
  urls: string[],
  fetchImpl: typeof fetch = fetch,
): Promise<ProbeState> {
  if (urls.length === 0) return 'up'; // not used in this build: nothing to report on
  return combine(await Promise.all(urls.map((u) => probeOne(u, fetchImpl))));
}
