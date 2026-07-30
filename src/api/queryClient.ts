import { QueryClient } from '@tanstack/react-query';

/**
 * One shared TanStack Query client for the whole app. Query keys are
 * defined per feature module (features/*\/api.ts) rather than centralized
 * here, so each feature owns its own caching/staleness decisions.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});
