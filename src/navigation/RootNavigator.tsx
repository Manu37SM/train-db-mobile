import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DefaultTheme as NavigationLightTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { AssistantFab } from '@/features/assistant/AssistantFab';
import { useResolvedTheme } from '@/theme/useResolvedTheme';
import { lightTheme, darkTheme } from '@/theme/theme';
import MainTabNavigator from './MainTabNavigator';
import { navigationRef } from './navigationRef';

/**
 * Always renders the main tabs - the web app never gates the whole site
 * behind login (Trains/Stations/Journeys/Explore, and even Favorites/
 * History since those are local-device only, all work signed out). Only
 * the Account screen itself behaves differently based on session state
 * (see AccountScreen.tsx), matching web's /account -> /login redirect
 * being a property of that one page, not the app shell.
 *
 * Session is still hydrated from Keychain here at the root so every
 * screen that cares (AccountScreen, the api client's refresh interceptor)
 * has it ready as early as possible.
 */
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

  // React Navigation ships its own light/dark theme, entirely separate from
  // the Paper theme App.tsx passes to PaperProvider - without this, native
  // stack headers and the bottom tab bar stayed on Navigation's default
  // light colors no matter what the user picked in Settings > Appearance,
  // while every Paper-rendered screen (Card, List.Item, etc.) went dark.
  // That light-chrome/dark-content mismatch is what got reported as mobile
  // "theme flicker" on 2026-08-05.
  const navigationTheme = {
    ...(resolvedScheme === 'dark' ? NavigationDarkTheme : NavigationLightTheme),
    colors: {
      ...(resolvedScheme === 'dark' ? NavigationDarkTheme.colors : NavigationLightTheme.colors),
      primary: resolvedScheme === 'dark' ? darkTheme.colors.primary : lightTheme.colors.primary,
      background: resolvedScheme === 'dark' ? darkTheme.colors.background : lightTheme.colors.background,
      card: resolvedScheme === 'dark' ? darkTheme.colors.surface : lightTheme.colors.surface,
    },
  };

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <MainTabNavigator />
      </NavigationContainer>
      {/* Mounted as a sibling overlay, not a screen, so it's reachable from
          every tab - mirrors web's AssistantFab being fixed-positioned
          across the whole app rather than living on one page. */}
      <AssistantFab />
    </View>
  );
}
