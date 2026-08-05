import { useColorScheme } from 'react-native';
import { usePreferencesStore } from '@/store/preferencesStore';

export type ResolvedScheme = 'light' | 'dark';

/**
 * Single source of truth for "is the app currently light or dark", shared
 * by App.tsx (drives PaperProvider's theme) and RootNavigator.tsx (drives
 * NavigationContainer's theme). Before this existed, only App.tsx resolved
 * the preference, so React Navigation's own chrome (native stack headers,
 * the bottom tab bar background/labels) stayed on its default light theme
 * regardless of what the user picked in Settings - Paper-rendered content
 * went dark while the header/tab bar stayed light, which reads as the
 * theme "flickering"/fighting itself on every screen, not just on launch.
 * Reported 2026-08-05 alongside "no way to change theme" (the Account tab
 * being covered by AssistantFab - see that component's fix) as "theme
 * flicker is happening in mobile also".
 */
export function useResolvedTheme(): ResolvedScheme {
  const systemScheme = useColorScheme();
  const themePreference = usePreferencesStore((s) => s.theme);

  if (themePreference === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }

  return themePreference;
}
