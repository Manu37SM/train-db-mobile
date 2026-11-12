import { isAxiosError } from 'axios';
import type { ApiErrorResponse } from '@/types/api';
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<ApiErrorResponse>(error) && error.response?.data?.error) {
    return error.response.data.error;
  }
  return fallback;
}
/** The server's machine-readable reason (e.g. MFA_REQUIRED, INVALID_OTP), if any. */
export function getApiErrorCode(error: unknown): string | undefined {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.code;
  }
  return undefined;
}
