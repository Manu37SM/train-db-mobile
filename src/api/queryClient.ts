import { QueryClient } from '@tanstack/react-query';
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      retry: 1,
      gcTime: 7 * 24 * 60 * 60 * 1000,
    },
  },
});
