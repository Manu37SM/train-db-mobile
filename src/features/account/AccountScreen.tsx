import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Divider, List, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getCurrentUser, logout as logoutRequest } from '@/features/auth/api';
import { useAuthStore } from '@/store/authStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { usePopularityStore } from '@/features/home/popularityStore';
import { usePopularSearchStore } from '@/features/home/popularSearchStore';
import { StationAutocomplete } from '@/components/StationAutocomplete';
import { BRAND } from '@/theme/theme';
import type { AccountStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AccountStackParamList, 'Account'>;

/**
 * Mirrors train-db-frontend's /account page (AccountClient) plus its
 * AuthNavLinks behavior: the page itself requires a session on web (it
 * redirects to /login), but that's a property of the Account *page*, not
 * of the whole app - Trains/Stations/Journeys/Explore stay public. Mobile
 * matches that exactly: this screen shows a sign-in prompt when logged
 * out instead of the app-wide gate the Phase 2 scaffold had.
 *
 * Favorites/History are local-device only (no backend account tie), so
 * they're offered either way, same as clicking those pages directly on
 * web works without a session.
 */
export default function AccountScreen({ navigation }: Props) {
  const session = useAuthStore((s) => s.session);
  const logoutStore = useAuthStore((s) => s.logout);
  const { defaultFromStationCode, defaultFromStationName, setDefaultFromStation, clearDefaultFromStation } =
    usePreferencesStore();
  const popularity = usePopularityStore();
  const popularSearches = usePopularSearchStore();
  const [activityCleared, setActivityCleared] = useState(false);

  const trackedActivityCount =
    Object.keys(popularity.trains).length +
    Object.keys(popularity.stations).length +
    Object.keys(popularSearches.trains).length +
    Object.keys(popularSearches.stations).length;

  const { data } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    enabled: !!session,
  });

  const handleLogout = async () => {
    if (session?.refreshToken) {
      await logoutRequest(session.refreshToken).catch(() => undefined);
    }
    await logoutStore();
  };

  return (
    <View style={styles.container}>
      {session ? (
        <>
          <Text variant="titleLarge">{data?.username ?? session.username}</Text>
          <Text style={styles.email}>{data?.email ?? session.email}</Text>
          <Button mode="outlined" onPress={handleLogout} style={styles.authAction}>
            Sign out
          </Button>
        </>
      ) : (
        <>
          <Text variant="titleLarge">You're not signed in</Text>
          <Text style={styles.email}>Sign in to manage your profile, or continue browsing without an account.</Text>
          <Button mode="contained" buttonColor={BRAND.accent} onPress={() => navigation.navigate('Login')} style={styles.authAction}>
            Sign in
          </Button>
          <Button onPress={() => navigation.navigate('Register')}>Create an account</Button>
        </>
      )}

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Preferences
      </Text>
      <StationAutocomplete
        label="Default 'From' station"
        initialLabel={
          defaultFromStationCode && defaultFromStationName
            ? `${defaultFromStationCode} · ${defaultFromStationName}`
            : undefined
        }
        onSelect={(station) => {
          if (station) setDefaultFromStation(station.stationCode, station.stationName);
          else clearDefaultFromStation();
        }}
      />
      <Text style={styles.hint}>Pre-fills the From station on the journey planner.</Text>

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={styles.sectionTitle}>
        On-device activity
      </Text>
      <Text style={styles.hint}>
        RailLens tracks which trains/stations you view and search most often on this device only, to power the
        "Popular" sections on Home - nothing is sent to a server. Clearing it resets those sections without
        touching your favorites, history, or saved journeys.
      </Text>
      <Button
        mode="outlined"
        disabled={trackedActivityCount === 0}
        onPress={() => {
          usePopularityStore.getState().clear();
          usePopularSearchStore.getState().clear();
          setActivityCleared(true);
        }}
        style={styles.authAction}
      >
        {trackedActivityCount === 0 ? 'Nothing to clear' : 'Clear on-device activity'}
      </Button>
      {activityCleared && trackedActivityCount === 0 && <Text style={styles.clearedNote}>Cleared.</Text>}

      <Divider style={styles.divider} />

      <List.Item title="Favorites" left={(p) => <List.Icon {...p} icon="star-outline" />} onPress={() => navigation.navigate('Favorites')} />
      <List.Item title="Search history" left={(p) => <List.Icon {...p} icon="history" />} onPress={() => navigation.navigate('History')} />
      <List.Item title="Settings" left={(p) => <List.Icon {...p} icon="cog-outline" />} onPress={() => navigation.navigate('Settings')} />
      <List.Item title="Admin portal" left={(p) => <List.Icon {...p} icon="shield-outline" />} onPress={() => navigation.navigate('Admin')} />
      <List.Item title="Developers" left={(p) => <List.Icon {...p} icon="code-tags" />} onPress={() => navigation.navigate('Developers')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  email: { opacity: 0.7, marginBottom: 16 },
  authAction: { marginBottom: 8 },
  divider: { marginVertical: 16 },
  sectionTitle: { marginBottom: 8 },
  hint: { fontSize: 12, opacity: 0.6, marginBottom: 4 },
  clearedNote: { fontSize: 12, color: '#16a34a', marginTop: 4 },
});
