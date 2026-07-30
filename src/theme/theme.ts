import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

/**
 * Colors pulled directly from train-db-frontend/app/globals.css's CSS
 * variables (--primary / --background / --card, light and dark) so the
 * mobile app reads as the same brand, not just a functionally-equivalent
 * app with different colors. Web's primary is blue (logo mark, links,
 * focus rings); orange-600 is the separate CTA/accent color used for
 * primary action buttons and highlight badges (AuthNavLinks' Register
 * button, DashboardHeader's "Search Trains" button, greeting badge, etc.)
 * - both are carried over here rather than collapsing to one brand color.
 */
const BRAND_ACCENT = '#ea580c'; // Tailwind orange-600, matches web's CTA buttons

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
