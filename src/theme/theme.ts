import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
const BRAND_ACCENT = '#ea580c';
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2563eb',
    secondary: BRAND_ACCENT,
    background: '#f8fafc',
    surface: '#ffffff',
    error: '#dc2626',
  },
};
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#3b82f6',
    secondary: BRAND_ACCENT,
    background: '#0b1220',
    surface: '#0f172a',
    error: '#ef4444',
  },
};
export const BRAND = {
  accent: BRAND_ACCENT,
};
