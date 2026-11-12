import { BOOKING_ENABLED, LOGIN_PROVIDER, RAILOPS_PAYMENT_HOSTS } from '@/config/login';

/** Booking talks to RailOps with the person's RailOps token, so it needs the RailOps login (Phase 4D) as well. */
export function bookingEnabled(): boolean {
  return BOOKING_ENABLED && LOGIN_PROVIDER === 'railops';
}

/** Only https on an allowed host, without credentials: never open a look-alike payment page. */
export function isAllowedCheckoutUrl(
  raw: string,
  hosts: readonly string[] = RAILOPS_PAYMENT_HOSTS,
): boolean {
  const m = /^https:\/\/([^/?#@]+)(?:[/?#]|$)/i.exec(raw);
  if (!m || raw.slice(8).split(/[/?#]/)[0].includes('@')) return false;
  return hosts.includes(m[1].toLowerCase());
}

/**
 * One per booking attempt (RailOps: 16-64 of [A-Za-z0-9-]). It only has to be unique, not secret, so Math.random is
 * enough; Hermes has no crypto.randomUUID.
 */
export function newIdempotencyKey(): string {
  const rand = () => Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  return `rl-${Date.now().toString(36)}-${rand()}${rand()}`;
}
