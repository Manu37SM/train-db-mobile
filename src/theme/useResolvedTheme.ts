import { useColorScheme } from 'react-native';
import { usePreferencesStore } from '@/store/preferencesStore';
export type ResolvedScheme = 'light' | 'dark';
export function useResolvedTheme(): ResolvedScheme {
  const systemScheme = useColorScheme();
  const themePreference = usePreferencesStore((s) => s.theme);
  if (themePreference === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return themePreference;
}
