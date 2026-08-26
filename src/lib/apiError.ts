import { isAxiosError } from 'axios';
import type { ApiErrorResponse } from '@/types/api';
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<ApiErrorResponse>(error) && error.response?.data?.error) {
    return error.response.data.error;
  }
  return fallback;
}
