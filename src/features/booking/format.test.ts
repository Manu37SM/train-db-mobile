jest.mock('@/config/login', () => ({
  BOOKING_ENABLED: true,
  LOGIN_PROVIDER: 'railops',
  RAILOPS_PAYMENT_HOSTS: ['rzp.io'],
  RAILOPS_PAYMENTS: 'razorpay',
}));
import {
  availabilityLabel,
  formatInr,
  formatIst,
  nextDatesIst,
  shortDate,
  validatePassengers,
} from './format';
import { bookingEnabled, isAllowedCheckoutUrl, newIdempotencyKey } from './config';

describe('booking helpers (app)', () => {
  it('formats rupees the Indian way without relying on Intl', () => {
    expect(formatInr(845)).toBe('₹845.00');
    expect(formatInr(123456.5)).toBe('₹1,23,456.50');
    expect(formatInr(12345678)).toBe('₹1,23,45,678.00');
  });

  it('shows Indian time wherever the phone is', () => {
    expect(formatIst('2026-11-20T10:30:00Z')).toBe('20 Nov, 16:00');
    expect(formatIst(null)).toBe('—');
  });

  it('date choices start tomorrow, in Indian time', () => {
    const d = nextDatesIst(3, new Date('2026-11-10T20:00:00Z')); // 01:30 IST on 11 Nov
    expect(d).toEqual(['2026-11-12', '2026-11-13', '2026-11-14']);
    expect(shortDate('2026-11-12')).toBe('12 Nov');
  });

  it('only some availability is bookable', () => {
    expect(availabilityLabel('AVAILABLE-3')).toEqual({ text: 'Available 3', bookable: true });
    expect(availabilityLabel('WL-12').bookable).toBe(true);
    expect(availabilityLabel('REGRET').bookable).toBe(false);
    expect(availabilityLabel('BOOKING_CLOSED').bookable).toBe(false);
  });

  it('passenger checks match RailOps', () => {
    const ok = { name: 'Asha Rao', age: '30', gender: 'F' as const };
    expect(validatePassengers([ok])).toBeNull();
    expect(validatePassengers([])).toMatch(/1 to 6/);
    expect(validatePassengers(Array(7).fill(ok))).toMatch(/1 to 6/);
    expect(validatePassengers([{ ...ok, name: 'x"); DROP' }])).toMatch(/name/);
    expect(validatePassengers([{ ...ok, age: '126' }])).toMatch(/age/);
    expect(validatePassengers([{ ...ok, gender: '' as const }])).toMatch(/gender/);
  });

  it('checkout pages: https on an allowed host only', () => {
    const hosts = ['checkout.razorpay.com'];
    expect(isAllowedCheckoutUrl('https://checkout.razorpay.com/x', hosts)).toBe(true);
    expect(isAllowedCheckoutUrl('http://checkout.razorpay.com/x', hosts)).toBe(false);
    expect(isAllowedCheckoutUrl('https://checkout.razorpay.com.evil.in/x', hosts)).toBe(false);
    expect(isAllowedCheckoutUrl('https://u:p@checkout.razorpay.com/x', hosts)).toBe(false);
    expect(isAllowedCheckoutUrl('https://rzp.io/i/AbC')).toBe(true); // the app's default: Razorpay links only
    expect(isAllowedCheckoutUrl('https://pay.example/x')).toBe(false);
  });

  it('idempotency keys fit RailOps’ rule and differ every time', () => {
    const keys = new Set(Array.from({ length: 200 }, newIdempotencyKey));
    expect(keys.size).toBe(200);
    keys.forEach((k) => expect(k).toMatch(/^[A-Za-z0-9-]{16,64}$/));
  });

  it('booking needs the switch and the RailOps login', () => {
    expect(bookingEnabled()).toBe(true);
  });
});
