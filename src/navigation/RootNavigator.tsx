import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import {
  NavigationContainer,
  DefaultTheme as NavigationLightTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { AssistantFab } from '@/features/assistant/AssistantFab';
import GlobalToast from '@/components/GlobalToast';
import { useResolvedTheme } from '@/theme/useResolvedTheme';
import { lightTheme, darkTheme } from '@/theme/theme';
import MainTabNavigator from './MainTabNavigator';
import { navigationRef } from './navigationRef';
export default function RootNavigator() {
  const { hydrated, hydrate } = useAuthStore();
  const resolvedScheme = useResolvedTheme();
  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);
  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  const navigationTheme = {
    ...(resolvedScheme === 'dark' ? NavigationDarkTheme : NavigationLightTheme),
    colors: {
      ...(resolvedScheme === 'dark' ? NavigationDarkTheme.colors : NavigationLightTheme.colors),
      primary: resolvedScheme === 'dark' ? darkTheme.colors.primary : lightTheme.colors.primary,
      background:
        resolvedScheme === 'dark' ? darkTheme.colors.background : lightTheme.colors.background,
      card: resolvedScheme === 'dark' ? darkTheme.colors.surface : lightTheme.colors.surface,
    },
  };
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <MainTabNavigator />
      </NavigationContainer>

      <AssistantFab />
      <GlobalToast />
    </View>
  );
}
