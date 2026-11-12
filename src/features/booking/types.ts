// RailOps booking API (railops/docs/openapi/reservation-v1.yaml), the parts RailLens uses. Same as the website (Phase 5).

export type TravelClass = '1A' | '2A' | '3A' | '3E' | 'SL' | 'CC' | 'EC' | '2S';
export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'PARTIALLY_CANCELLED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'FAILED_REFUNDING'
  | 'CHART_CANCELLED'
  | 'RUN_CANCELLED';

export interface RunStop {
  seq: number;
  stationCode: string;
  arrival: string | null;
  departure: string | null;
  distanceKm: number;
  halt: boolean;
}

export interface RunSummary {
  runId: number;
  trainNo: string;
  runDate: string;
  status: string;
  bookingOpensAt: string;
  classes: TravelClass[];
  stops: RunStop[];
}

export interface PoolAvailability {
  classCode: TravelClass;
  quotaCode: string;
  cnfFree: number;
  racSlotsFree: number;
  nextWlNumber: number;
  wlRemaining: number;
  /** AVAILABLE-n | RAC-n | WL-n | REGRET | BOOKING_CLOSED */
  display: string;
}

export interface RunAvailability {
  trainRunId: number;
  runStatus: string;
  fromSeq: number;
  toSeq: number;
  pools: PoolAvailability[];
}

export interface PassengerInput {
  name: string;
  age: number;
  gender: 'M' | 'F' | 'T';
  berthPreference?: string | null;
}

export interface CreateBookingRequest {
  trainRunId: number;
  fromStopSeq: number;
  toStopSeq: number;
  travelClass: TravelClass;
  quota: 'GN';
  passengers: PassengerInput[];
  onlyIfConfirmed: boolean;
  contactPhone: string;
  contactEmail?: string | null;
}

export interface PassengerView {
  seqNo: number;
  name: string;
  age: number;
  gender: string;
  bookingStatus: string;
  currentStatus: string;
}

export interface BookingView {
  pnr: string;
  status: BookingStatus;
  trainRunId: number;
  runDate: string;
  classCode: TravelClass;
  quotaCode: string;
  fromSeq: number;
  toSeq: number;
  totalFare: number;
  holdExpiresAt?: string | null;
  passengers: PassengerView[];
}

export interface BookingSummary {
  pnr: string;
  status: BookingStatus;
  trainRunId: number;
  runDate: string;
  classCode: TravelClass;
  fromSeq: number;
  toSeq: number;
  totalFare: number;
  createdAt: string;
}

export interface BookingPage {
  items: BookingSummary[];
  nextCursor?: string | null;
}

export interface PaymentIntent {
  paymentId: string;
  checkoutUrl: string;
  amount: number;
  status: string;
}

export interface CancellationView {
  pnr: string;
  bookingStatus: string;
  totalPaid: number;
  totalCharge: number;
  refundAmount: number;
}
