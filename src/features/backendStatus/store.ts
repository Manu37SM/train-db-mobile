/**
 * What the person should be told when a backend can't be reached: the same states and timings as the website's
 * banner (train-db-frontend lib/backendStatus/store.ts), plus "offline" for when the phone itself has no internet.
 * Requests report trouble here; the store then checks the backend's health every few seconds until it answers:
 *
 *   ok -> waking -> ready           a sleeping free server starting up (countdown to the expected time)
 *   ok -> waking -> down -> ready   crashed / out of memory / restarting, or still not up after GIVE_UP_MS
 *   ok -> offline -> ready          the phone has no connection
 *
 * "ready" stays until the person taps Try again or closes it: what they were doing failed and needs doing again.
 * Pure (no React Native imports) so it can be unit-tested.
 */
export type BackendService = 'raillens' | 'railops';
export type Phase = 'ok' | 'waking' | 'down' | 'offline' | 'ready';
export type ProbeState = 'up' | 'waking' | 'down' | 'offline';

export interface ServiceStatus {
  phase: Phase;
  /** When the trouble was first noticed (ms). */
  since: number;
  /** When a normal cold start should be done (ms): what the countdown counts down to. */
  expectedBy: number;
}

export type StatusSnapshot = Readonly<Record<BackendService, ServiceStatus>>;

/** Typical cold start on Render's free plan: RailLens ~30-60 s; RailOps has five services to wake. */
export const EXPECTED_WAKE_MS: Record<BackendService, number> = {
  raillens: 60_000,
  railops: 90_000,
};
/** Longer than any cold start: past this it's not sleeping, it's down. */
export const GIVE_UP_MS: Record<BackendService, number> = { raillens: 180_000, railops: 240_000 };
export const POLL_MS = 5_000;
/** Once down, check less often (it can take minutes), but keep checking so "ready" still shows up. */
export const DOWN_POLL_MS = 30_000;
/** A single 5xx can be a restart in progress; two in a row means down. */
export const DOWN_AFTER = 2;

export interface StoreDeps {
  probe: (service: BackendService) => Promise<ProbeState>;
  now: () => number;
  schedule: (fn: () => void, ms: number) => unknown;
  cancel: (handle: unknown) => void;
}

const OK: ServiceStatus = { phase: 'ok', since: 0, expectedBy: 0 };

export function createBackendStatusStore(deps: StoreDeps) {
  let state: StatusSnapshot = { raillens: OK, railops: OK };
  const listeners = new Set<() => void>();
  const timers: Partial<Record<BackendService, unknown>> = {};
  const downStreak: Record<BackendService, number> = { raillens: 0, railops: 0 };

  function set(service: BackendService, value: ServiceStatus) {
    state = { ...state, [service]: value };
    listeners.forEach((l) => l());
  }

  function stop(service: BackendService) {
    if (timers[service] !== undefined) deps.cancel(timers[service]);
    delete timers[service];
  }

  function scheduleCheck(service: BackendService, ms: number) {
    stop(service);
    timers[service] = deps.schedule(() => void check(service), ms);
  }

  function watching(phase: Phase) {
    return phase === 'waking' || phase === 'down' || phase === 'offline';
  }

  async function check(service: BackendService) {
    delete timers[service];
    if (!watching(state[service].phase)) return;
    let result: ProbeState;
    try {
      result = await deps.probe(service);
    } catch {
      result = 'waking';
    }
    const now = deps.now();
    const s = state[service];
    if (!watching(s.phase)) return; // dismissed meanwhile
    if (result === 'up') {
      downStreak[service] = 0;
      set(service, { ...s, phase: 'ready' });
      return;
    }
    if (result === 'offline') {
      // No internet on the phone says nothing about the server: restart the clock once the connection is back.
      downStreak[service] = 0;
      if (s.phase !== 'offline') set(service, { ...s, phase: 'offline' });
      scheduleCheck(service, POLL_MS);
      return;
    }
    if (s.phase === 'offline') {
      // Connection back but the server isn't answering yet: from here it's an ordinary wake-up.
      set(service, { phase: 'waking', since: now, expectedBy: now + EXPECTED_WAKE_MS[service] });
      scheduleCheck(service, POLL_MS);
      return;
    }
    downStreak[service] = result === 'down' ? downStreak[service] + 1 : 0;
    const isDown = downStreak[service] >= DOWN_AFTER || now - s.since >= GIVE_UP_MS[service];
    if (isDown && s.phase !== 'down') set(service, { ...s, phase: 'down' });
    scheduleCheck(service, isDown ? DOWN_POLL_MS : POLL_MS);
  }

  function report(service: BackendService) {
    if (watching(state[service].phase)) return; // already watching
    const now = deps.now();
    downStreak[service] = 0;
    set(service, { phase: 'waking', since: now, expectedBy: now + EXPECTED_WAKE_MS[service] });
    void check(service);
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => state,
    /** A request to this backend failed in a way that means "unreachable" (see isBackendTrouble). */
    report,
    /**
     * Something is slow or failed for an unknown reason, or the app came back to the foreground. Check quietly
     * and show the banner only if the backend really isn't up, so an ordinary error never shows "waking up".
     */
    async suspect(service: BackendService) {
      if (watching(state[service].phase)) return;
      let result: ProbeState;
      try {
        result = await deps.probe(service);
      } catch {
        return;
      }
      if (result === 'up') return;
      report(service);
    },
    /** "Check now" from the banner while down or offline. */
    recheck(service: BackendService) {
      const phase = state[service].phase;
      if (phase !== 'down' && phase !== 'offline') return;
      stop(service);
      void check(service);
    },
    dismiss(service: BackendService) {
      stop(service);
      downStreak[service] = 0;
      set(service, OK);
    },
  };
}

export type BackendStatusStore = ReturnType<typeof createBackendStatusStore>;

/**
 * True when a failure means "the backend isn't there" rather than "the request was wrong": no answer at all
 * (status 0: network error or timeout) or a 502/503/504 from Render's proxy.
 */
export function isBackendTrouble(status: number): boolean {
  return status === 0 || status === 502 || status === 503 || status === 504;
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const NAMES: Record<BackendService, string> = {
  raillens: 'RailLens',
  railops: 'Booking (RailOps)',
};

export type Tone = 'amber' | 'red' | 'grey' | 'green';

/** The banner's words for one service, or null when there's nothing to say. Kept here so it can be tested. */
export function bannerContent(
  service: BackendService,
  status: ServiceStatus,
  now: number,
): { tone: Tone; title: string; detail: string } | null {
  const name = NAMES[service];
  switch (status.phase) {
    case 'waking': {
      const left = status.expectedBy - now;
      return {
        tone: 'amber',
        title: `${name} is waking up.`,
        detail:
          left > 0
            ? `The free server sleeps when nobody is using it. Try again in about ${formatCountdown(left)}.`
            : 'Taking a little longer than usual, still starting…',
      };
    }
    case 'down':
      return {
        tone: 'red',
        title: `${name} is down right now.`,
        detail: 'The server crashed or is restarting. Please try again later.',
      };
    case 'offline':
      return {
        tone: 'grey',
        title: 'You’re offline.',
        detail: 'Check your internet connection. We’ll keep trying.',
      };
    case 'ready':
      return { tone: 'green', title: `${name} is back.`, detail: 'Please try again.' };
    default:
      return null;
  }
}
