import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { AssistantFab } from '@/features/assistant/AssistantFab';
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

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        <MainTabNavigator />
      </NavigationContainer>
      {/* Mounted as a sibling overlay, not a screen, so it's reachable from
          every tab - mirrors web's AssistantFab being fixed-positioned
          across the whole app rather than living on one page. */}
      <AssistantFab />
    </View>
  );
}
