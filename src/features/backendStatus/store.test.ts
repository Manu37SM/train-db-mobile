import {
  bannerContent,
  createBackendStatusStore,
  DOWN_POLL_MS,
  EXPECTED_WAKE_MS,
  formatCountdown,
  GIVE_UP_MS,
  isBackendTrouble,
  POLL_MS,
  type ProbeState,
} from './store';

/** A store on a fake clock: run() advances time and fires the scheduled checks in order. */
function harness(answers: ProbeState[]) {
  let now = 1_000_000;
  const queue: { at: number; fn: () => void; id: number }[] = [];
  let ids = 0;
  const probe = jest.fn(async () => answers.shift() ?? 'waking');
  const store = createBackendStatusStore({
    probe,
    now: () => now,
    schedule: (fn, ms) => {
      const id = ++ids;
      queue.push({ at: now + ms, fn, id });
      return id;
    },
    cancel: (id) => {
      const i = queue.findIndex((q) => q.id === id);
      if (i >= 0) queue.splice(i, 1);
    },
  });
  const flush = () => new Promise<void>((r) => setTimeout(r, 0));
  async function run(ms: number) {
    const end = now + ms;
    await flush();
    for (;;) {
      queue.sort((a, b) => a.at - b.at);
      const next = queue[0];
      if (!next || next.at > end) break;
      queue.shift();
      now = next.at;
      next.fn();
      await flush();
    }
    now = end;
  }
  return {
    store,
    probe,
    run,
    now: () => now,
    phase: () => store.getSnapshot().raillens.phase,
  };
}

describe('backend status store (mobile)', () => {
  it('a sleeping backend: waking with a countdown, then ready when it answers', async () => {
    const h = harness(['waking', 'waking', 'up']);
    h.store.report('raillens');
    const s = h.store.getSnapshot().raillens;
    expect(s.phase).toBe('waking');
    expect(s.expectedBy - s.since).toBe(EXPECTED_WAKE_MS.raillens);
    await h.run(POLL_MS);
    expect(h.phase()).toBe('waking');
    await h.run(POLL_MS);
    expect(h.phase()).toBe('ready');
    await h.run(60_000);
    expect(h.probe).toHaveBeenCalledTimes(3); // stops checking once ready
  });

  it('two 5xx answers in a row mean down (crash, out of memory, restart); it still notices when it comes back', async () => {
    const h = harness(['down', 'down', 'down', 'up']);
    h.store.report('raillens');
    await h.run(0);
    expect(h.phase()).toBe('waking'); // one 5xx can be a restart in progress
    await h.run(POLL_MS);
    expect(h.phase()).toBe('down');
    await h.run(DOWN_POLL_MS);
    expect(h.phase()).toBe('down');
    await h.run(DOWN_POLL_MS);
    expect(h.phase()).toBe('ready');
  });

  it('never answering for longer than any cold start also means down', async () => {
    const h = harness([]);
    h.store.report('raillens');
    await h.run(GIVE_UP_MS.raillens - POLL_MS);
    expect(h.phase()).toBe('waking');
    await h.run(POLL_MS);
    expect(h.phase()).toBe('down');
  });

  it('no internet on the phone shows offline, not "server down", however long it lasts', async () => {
    const h = harness(Array(60).fill('offline'));
    h.store.report('raillens');
    await h.run(0);
    expect(h.phase()).toBe('offline');
    await h.run(GIVE_UP_MS.raillens + 60_000);
    expect(h.phase()).toBe('offline');
  });

  it('connection back but server asleep: a fresh wake-up countdown starts from then', async () => {
    const h = harness(['offline', 'waking', 'up']);
    h.store.report('raillens');
    await h.run(0);
    expect(h.phase()).toBe('offline');
    await h.run(POLL_MS);
    const s = h.store.getSnapshot().raillens;
    expect(s.phase).toBe('waking');
    expect(s.since).toBe(h.now());
    await h.run(POLL_MS);
    expect(h.phase()).toBe('ready');
  });

  it('more failures while already watching do not restart the countdown', async () => {
    const h = harness([]);
    h.store.report('raillens');
    const first = h.store.getSnapshot().raillens.since;
    await h.run(10_000);
    h.store.report('raillens');
    expect(h.store.getSnapshot().raillens.since).toBe(first);
  });

  it('closing the banner stops the checks', async () => {
    const h = harness([]);
    h.store.report('raillens');
    await h.run(0);
    h.store.dismiss('raillens');
    const calls = h.probe.mock.calls.length;
    await h.run(60_000);
    expect(h.phase()).toBe('ok');
    expect(h.probe).toHaveBeenCalledTimes(calls);
  });

  it('suspect() stays silent when the backend is up, and shows the banner when it is not', async () => {
    const up = harness(['up']);
    await up.store.suspect('raillens');
    expect(up.phase()).toBe('ok');
    const asleep = harness(['waking', 'waking']);
    await asleep.store.suspect('raillens');
    expect(asleep.phase()).toBe('waking');
  });

  it('RailLens and RailOps are tracked separately', async () => {
    const h = harness([]);
    h.store.report('railops');
    expect(h.store.getSnapshot().railops.phase).toBe('waking');
    expect(h.store.getSnapshot().railops.expectedBy - h.now()).toBe(EXPECTED_WAKE_MS.railops);
    expect(h.phase()).toBe('ok');
  });

  it('only "no answer" and 502/503/504 count as the backend being unreachable', () => {
    expect([0, 502, 503, 504].every(isBackendTrouble)).toBe(true);
    expect([400, 401, 404, 409, 429, 500].some(isBackendTrouble)).toBe(false);
  });
});

describe('banner words', () => {
  const at = (phase: 'ok' | 'waking' | 'down' | 'offline' | 'ready') => ({
    phase,
    since: 0,
    expectedBy: 60_000,
  });

  it('waking counts down to "try again"', () => {
    const c = bannerContent('raillens', at('waking'), 15_000);
    expect(c?.tone).toBe('amber');
    expect(c?.title).toBe('RailLens is waking up.');
    expect(c?.detail).toContain('Try again in about 0:45');
    expect(bannerContent('raillens', at('waking'), 70_000)?.detail).toMatch(/longer than usual/);
  });

  it('down says try again later; offline blames the connection; ready says try again', () => {
    expect(bannerContent('railops', at('down'), 0)).toMatchObject({
      tone: 'red',
      title: 'Booking (RailOps) is down right now.',
      detail: expect.stringContaining('try again later'),
    });
    expect(bannerContent('raillens', at('offline'), 0)?.tone).toBe('grey');
    expect(bannerContent('raillens', at('ready'), 0)?.title).toBe('RailLens is back.');
    expect(bannerContent('raillens', at('ok'), 0)).toBeNull();
  });

  it('formats the countdown as m:ss', () => {
    expect(formatCountdown(90_000)).toBe('1:30');
    expect(formatCountdown(500)).toBe('0:01');
    expect(formatCountdown(-5)).toBe('0:00');
  });
});
