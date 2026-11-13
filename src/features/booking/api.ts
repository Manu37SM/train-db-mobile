import axios, { isAxiosError } from 'axios';
import { RAILOPS_BASE_URL } from '@/config/login';
import { getValidAccessToken } from '@/api/client';
import { AuthFailure } from '@/lib/apiError';
import type {
  BookingPage,
  BookingView,
  CancellationView,
  CreateBookingRequest,
  PaymentIntent,
  RunAvailability,
  RunSummary,
  SeatMap,
  TravelClass,
} from './types';

/**
 * RailOps booking API (Phase 5B), same calls as the website. Signed-in calls carry the person's RailOps access token
 * (the app's own token once sign-in goes through RailOps). Prices always come from RailOps: nothing sends an amount.
 */
const railOps = axios.create({ baseURL: RAILOPS_BASE_URL, timeout: 65000 }); // free services take ~1 min to wake

/** Switch on RailOps' stable codes, never its detail text (worded for logs). */
const MESSAGES: Record<string, string> = {
  RES_RUN_NOT_FOUND: 'This train isn’t open for booking on that date yet.',
  RES_REGRET: 'No seats or waitlist places are left in this class.',
  RES_ONLY_IF_CNF_UNMET:
    'Confirmed berths aren’t available for everyone, so nothing was booked (you chose “book only if confirmed”).',
  RES_RUN_NOT_BOOKABLE: 'Booking isn’t open for this train right now.',
  RES_HOLD_EXPIRED: 'Your seat hold expired before payment. Please book again.',
  RES_BOOKING_NOT_FOUND: 'We couldn’t find that booking.',
  RES_CANCELLATION_CLOSED: 'Online cancellation is closed for this booking.',
  RES_BOOKING_NOT_PAYABLE: 'This booking can’t be paid for any more.',
  RES_WAITING_ROOM: 'This train is very busy right now. Please try again in a few minutes.',
  IDEM_KEY_REUSED: 'This request conflicts with an earlier one. Please go back and try again.',
  IDEM_IN_PROGRESS: 'Your earlier request is still being processed. Please wait a moment.',
  PAYMENT_UNAVAILABLE:
    'Payments are temporarily unavailable. Your seats are still held; please try again shortly.',
  DEPENDENCY_UNAVAILABLE: 'A service is temporarily unavailable. Please try again shortly.',
};
const USE_DETAIL = new Set([
  'RES_QUOTA_INELIGIBLE',
  'RES_INVALID_JOURNEY',
  'RES_INVALID_CANCELLATION',
]);

export function toBookingFailure(error: unknown): AuthFailure {
  if (error instanceof AuthFailure) return error;
  if (!isAxiosError(error) || !error.response) {
    return new AuthFailure(
      0,
      'Can’t reach the booking service. Check your connection and try again.',
    );
  }
  const status = error.response.status;
  const p = (error.response.data ?? {}) as { code?: string; detail?: string };
  const code = p.code ?? (status === 429 ? 'TOO_MANY_REQUESTS' : undefined);
  let message = code ? MESSAGES[code] : undefined;
  if (!message && code && USE_DETAIL.has(code) && p.detail) {
    message =
      p.detail.charAt(0).toUpperCase() + p.detail.slice(1) + (/[.!?]$/.test(p.detail) ? '' : '.');
  }
  message ??=
    status === 401
      ? 'Please sign in again.'
      : status === 429
        ? 'Too many requests. Please wait a moment and try again.'
        : status >= 500
          ? 'The booking service had a problem. Please try again in a minute.'
          : 'The request couldn’t be completed. Please check the details and try again.';
  return new AuthFailure(status, message, code);
}

async function call<T>(
  method: 'get' | 'post',
  url: string,
  options: { body?: unknown; auth?: boolean; idempotencyKey?: string } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;
  if (options.auth !== false) {
    const token = await getValidAccessToken();
    if (!token) throw new AuthFailure(401, 'Please sign in to book.', 'UNAUTHENTICATED');
    headers.Authorization = `Bearer ${token}`;
  }
  try {
    const { data } = await railOps.request<T>({ method, url, data: options.body, headers });
    return data;
  } catch (error) {
    throw toBookingFailure(error);
  }
}

export const findRun = (trainNo: string, date: string) =>
  call<RunSummary>(
    'get',
    `/api/v1/runs?trainNo=${encodeURIComponent(trainNo)}&date=${encodeURIComponent(date)}`,
    { auth: false },
  );
export const getRun = (runId: number) =>
  call<RunSummary>('get', `/api/v1/runs/${runId}`, { auth: false });
/** Phase 6: public live seat map. */
export const getSeatMap = (
  runId: number,
  travelClass: TravelClass,
  fromSeq: number,
  toSeq: number,
) =>
  call<SeatMap>(
    'get',
    `/api/v1/runs/${runId}/seat-map?class=${encodeURIComponent(travelClass)}&from=${fromSeq}&to=${toSeq}`,
    { auth: false },
  );
export const getAvailability = (runId: number, fromSeq: number, toSeq: number) =>
  call<RunAvailability>('get', `/api/v1/runs/${runId}/availability?from=${fromSeq}&to=${toSeq}`, {
    auth: false,
  });
/** idempotencyKey: one per attempt, reused on retry, so a retry never books twice. */
export const createBooking = (request: CreateBookingRequest, idempotencyKey: string) =>
  call<BookingView>('post', '/api/v1/bookings', { body: request, idempotencyKey });
export const getBooking = (pnr: string) =>
  call<BookingView>('get', `/api/v1/bookings/${encodeURIComponent(pnr)}`);
export const listBookings = (cursor?: string | null) =>
  call<BookingPage>(
    'get',
    `/api/v1/bookings?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
  );
/** Demo only: RailOps answers 404 RES_SIMULATED_PAYMENTS_OFF where a real payment gateway is in use. */
export const paySimulated = (pnr: string, outcome: 'SUCCESS' | 'FAILURE') =>
  call<PaymentIntent>('post', `/api/v1/bookings/${encodeURIComponent(pnr)}/simulated-payment`, {
    body: { outcome },
  });
export const paymentIntent = (pnr: string) =>
  call<PaymentIntent>('post', `/api/v1/bookings/${encodeURIComponent(pnr)}/payment-intent`);
export const cancellationQuote = (pnr: string) =>
  call<CancellationView>('get', `/api/v1/bookings/${encodeURIComponent(pnr)}/cancellation-quote`);
export const cancelBooking = (pnr: string, idempotencyKey: string) =>
  call<CancellationView>('post', `/api/v1/bookings/${encodeURIComponent(pnr)}/cancellations`, {
    body: {},
    idempotencyKey,
  });
