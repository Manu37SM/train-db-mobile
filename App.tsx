import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient } from '@/api/queryClient';
import { queryPersister, QUERY_PERSIST_MAX_AGE, shouldPersistQuery } from '@/api/queryPersister';
import { lightTheme, darkTheme } from '@/theme/theme';
import { useResolvedTheme } from '@/theme/useResolvedTheme';
import RootNavigator from '@/navigation/RootNavigator';
import ErrorBoundary from '@/components/ErrorBoundary';
import { wakeRailOps } from '@/features/railops/wake';
export default function App() {
  const resolvedScheme = useResolvedTheme();
  const theme = resolvedScheme === 'dark' ? darkTheme : lightTheme;
  // Wake the RailOps services (free plan: asleep after 15 idle minutes) when the app opens or comes back.
  useEffect(() => {
    wakeRailOps();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') wakeRailOps();
    });
    return () => sub.remove();
  }, []);
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: QUERY_PERSIST_MAX_AGE,
        dehydrateOptions: { shouldDehydrateQuery: shouldPersistQuery },
      }}
    >
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <ErrorBoundary>
            <RootNavigator />
          </ErrorBoundary>
        </PaperProvider>
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}
