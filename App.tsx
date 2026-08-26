import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient } from '@/api/queryClient';
import { queryPersister, QUERY_PERSIST_MAX_AGE } from '@/api/queryPersister';
import { lightTheme, darkTheme } from '@/theme/theme';
import { useResolvedTheme } from '@/theme/useResolvedTheme';
import RootNavigator from '@/navigation/RootNavigator';
import ErrorBoundary from '@/components/ErrorBoundary';
export default function App() {
  const resolvedScheme = useResolvedTheme();
  const theme = resolvedScheme === 'dark' ? darkTheme : lightTheme;
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister, maxAge: QUERY_PERSIST_MAX_AGE }}
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
