import { isAxiosError } from 'axios';
import type { ApiErrorResponse } from '@/types/api';
/** A sign-in failure already turned into a RailLens-style message (RailOps login, Phase 4D). */
export class AuthFailure extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'AuthFailure';
  }
}
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AuthFailure) return error.message;
  if (isAxiosError<ApiErrorResponse>(error) && error.response?.data?.error) {
    return error.response.data.error;
  }
  return fallback;
}
/** The server's machine-readable reason (e.g. MFA_REQUIRED, INVALID_OTP), if any. */
export function getApiErrorCode(error: unknown): string | undefined {
  if (error instanceof AuthFailure) return error.code;
  if (isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.code;
  }
  return undefined;
}
