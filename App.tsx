import React from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import { lightTheme, darkTheme } from '@/theme/theme';
import { usePreferencesStore } from '@/store/preferencesStore';
import RootNavigator from '@/navigation/RootNavigator';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function App() {
  const systemScheme = useColorScheme();
  const themePreference = usePreferencesStore((s) => s.theme);

  const resolvedScheme = themePreference === 'system' ? systemScheme : themePreference;
  const theme = resolvedScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <ErrorBoundary>
            <RootNavigator />
          </ErrorBoundary>
        </PaperProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
