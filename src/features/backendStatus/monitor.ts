import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { probeService, railopsHealthUrls, raillensHealthUrl } from './probe';
import {
  type BackendService,
  type BackendStatusStore,
  createBackendStatusStore,
  isBackendTrouble,
} from './store';

let appStore: BackendStatusStore | null = null;
let raillensUrls: string[] = [];
/** Read when probing, not at import, so config/login is only touched once something actually fails. */
const healthUrls = (service: BackendService): string[] =>
  service === 'raillens' ? raillensUrls : railopsHealthUrls();

/**
 * Where RailLens lives, from config/env (called once by the app shell; kept out of here so this module has no
 * React Native imports and can be unit-tested).
 */
export function configureBackendStatus(raillensApiBase: string): void {
  const url = raillensHealthUrl(raillensApiBase);
  raillensUrls = url ? [url] : [];
}

/** The app-wide store the banner shows. */
export function backendStatus(): BackendStatusStore {
  if (!appStore) {
    appStore = createBackendStatusStore({
      probe: (service) => probeService(healthUrls(service)),
      now: () => Date.now(),
      schedule: (fn, ms) => setTimeout(fn, ms),
      cancel: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
    });
  }
  return appStore;
}

/**
 * A request still waiting after this long gets a quiet health check, so a sleeping server shows "waking up" within
 * seconds instead of after the request's own timeout (15-65 s). Silent if the server is up and just busy.
 */
export const SLOW_REQUEST_MS = 6000;

type Timed = InternalAxiosRequestConfig & { _slowTimer?: ReturnType<typeof setTimeout> };

/** Status of a failed request: 0 when nothing answered (network error, timeout), -1 when it was cancelled. */
export function failureStatus(error: unknown): number {
  if (axios.isCancel(error)) return -1;
  if (axios.isAxiosError(error)) return error.response?.status ?? 0;
  return -1;
}

/**
 * Hooks an axios client into the banner: failures that mean "unreachable" (no answer, 502/503/504) report the
 * backend, and slow requests trigger a quiet check. Errors still reach the caller unchanged.
 */
export function watchBackend(
  client: AxiosInstance,
  service: BackendService,
  store: () => BackendStatusStore = backendStatus,
  slowMs = SLOW_REQUEST_MS,
): void {
  const clear = (config: Timed | undefined) => {
    if (config?._slowTimer !== undefined) {
      clearTimeout(config._slowTimer);
      delete config._slowTimer;
    }
  };
  client.interceptors.request.use((config: Timed) => {
    clear(config); // a retried request reuses its config
    config._slowTimer = setTimeout(() => void store().suspect(service), slowMs);
    return config;
  });
  client.interceptors.response.use(
    (response) => {
      clear(response.config as Timed);
      return response;
    },
    (error: unknown) => {
      clear(axios.isAxiosError(error) ? (error.config as Timed | undefined) : undefined);
      const status = failureStatus(error);
      if (status >= 0 && isBackendTrouble(status)) store().report(service);
      return Promise.reject(error);
    },
  );
}
