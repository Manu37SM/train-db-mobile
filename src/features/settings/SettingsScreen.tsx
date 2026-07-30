import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, RadioButton, Text } from 'react-native-paper';
import { usePreferencesStore, ThemePreference } from '@/store/preferencesStore';

/**
 * Mirrors train-db-frontend's theme selection (ThemeToggle, lib/theme.ts).
 * Web's keyboard shortcuts (`/`, Cmd+K) have no mobile equivalent to
 * configure here - see MOBILE_FEATURE_PARITY.md for the accepted
 * replacement (persistent search tab).
 */
export default function SettingsScreen() {
  const { theme, setTheme } = usePreferencesStore();

  const options: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: 'Match system' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.heading}>
        Appearance
      </Text>
      <RadioButton.Group onValueChange={(v) => setTheme(v as ThemePreference)} value={theme}>
        {options.map((opt) => (
          <List.Item
            key={opt.value}
            title={opt.label}
            onPress={() => setTheme(opt.value)}
            right={() => <RadioButton value={opt.value} />}
          />
        ))}
      </RadioButton.Group>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { marginBottom: 8 },
});
