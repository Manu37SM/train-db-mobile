import { isAxiosError } from 'axios';
import type { ApiErrorResponse } from '@/types/api';

/**
 * Extracts the backend's own error text (train-db's GlobalExceptionHandler
 * always returns {timestamp, status, error} - see ApiErrorResponse) from a
 * failed axios call, falling back to a caller-supplied generic message for
 * anything else (network failure, unexpected response shape). Mirrors
 * train-db-frontend's services/api.ts ApiError, which already does this on
 * web - mobile's screens were instead hardcoding a single generic message
 * regardless of what the backend actually said, which went from "slightly
 * less specific" to "actively misleading" the moment AuthService started
 * returning a distinct account-locked message (HTTP 423) alongside the
 * existing generic 401 for a plain wrong password.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<ApiErrorResponse>(error) && error.response?.data?.error) {
    return error.response.data.error;
  }
  return fallback;
}
