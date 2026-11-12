import type { BookingStatus, TravelClass } from './types';

export function formatInr(amount: number): string {
  // Hermes' Intl may lack currency formatting on some Android versions; keep it simple and predictable.
  const [whole, paise] = amount.toFixed(2).split('.');
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `₹${rest ? `${rest},${last3}` : last3}.${paise}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Railway times are Indian time wherever the phone is. */
export function formatIst(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(new Date(iso).getTime() + 330 * 60000);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${hh}:${mm}`;
}

/** The next `count` dates in India, starting tomorrow, as YYYY-MM-DD. */
export function nextDatesIst(count: number, now: Date = new Date()): string[] {
  const base = now.getTime() + 330 * 60000;
  return Array.from({ length: count }, (_, i) =>
    new Date(base + (i + 1) * 86400000).toISOString().slice(0, 10),
  );
}

export function shortDate(ymd: string): string {
  const [, m, d] = ymd.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

export const CLASS_NAMES: Record<TravelClass, string> = {
  '1A': 'First AC',
  '2A': 'AC 2-tier',
  '3A': 'AC 3-tier',
  '3E': 'AC 3-tier economy',
  SL: 'Sleeper',
  CC: 'AC chair car',
  EC: 'Executive chair car',
  '2S': 'Second sitting',
};

export function availabilityLabel(display: string): { text: string; bookable: boolean } {
  const [kind, n] = display.split('-');
  switch (kind) {
    case 'AVAILABLE':
      return { text: `Available ${n}`, bookable: true };
    case 'RAC':
      return { text: `RAC ${n}`, bookable: true };
    case 'WL':
      return { text: `Waitlist ${n}`, bookable: true };
    case 'REGRET':
      return { text: 'Full (regret)', bookable: false };
    case 'BOOKING_CLOSED':
      return { text: 'Booking closed', bookable: false };
    default:
      return { text: display, bookable: false };
  }
}

export const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'Waiting for payment',
  CONFIRMED: 'Booked',
  PARTIALLY_CANCELLED: 'Partly cancelled',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired (not paid in time)',
  FAILED_REFUNDING: 'Failed, refund on its way',
  CHART_CANCELLED: 'Cancelled at chart (waitlisted)',
  RUN_CANCELLED: 'Train cancelled, full refund',
};

const NAME_PATTERN = /^[\p{L} .'-]+$/u;
export const PHONE_PATTERN = /^\+?[0-9 -]{10,16}$/;
export const MAX_PASSENGERS = 6;

export interface PassengerRow {
  name: string;
  age: string;
  gender: 'M' | 'F' | 'T' | '';
}

/** Same rules as RailOps, so the person hears about a problem before the request. */
export function validatePassengers(rows: PassengerRow[]): string | null {
  if (rows.length < 1 || rows.length > MAX_PASSENGERS)
    return `Add 1 to ${MAX_PASSENGERS} passengers.`;
  for (const [i, p] of rows.entries()) {
    const n = i + 1;
    const name = p.name.trim();
    if (!name || name.length > 60 || !NAME_PATTERN.test(name))
      return `Passenger ${n}: enter a name using letters only.`;
    const age = Number(p.age);
    if (p.age === '' || !Number.isInteger(age) || age < 0 || age > 125)
      return `Passenger ${n}: enter an age from 0 to 125.`;
    if (!p.gender) return `Passenger ${n}: choose a gender.`;
  }
  return null;
}
