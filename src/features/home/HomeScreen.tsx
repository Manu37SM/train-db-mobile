import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Button, Text, List, Chip, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ActionGrid, ActionGridItem } from '@/components/ActionGrid';
import { useFavoritesStore } from '@/features/favorites/store';
import { useHistoryStore } from '@/features/history/store';
import { BRAND } from '@/theme/theme';
import { usePreferencesStore, ThemePreference } from '@/store/preferencesStore';
import { usePopularityStore, getPopularTrains, getPopularStations } from './popularityStore';
const THEME_CYCLE: Record<ThemePreference, ThemePreference> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};
const THEME_ICON: Record<ThemePreference, string> = {
  light: 'weather-sunny',
  dark: 'weather-night',
  system: 'theme-light-dark',
};
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}
export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { theme: themePreference, setTheme } = usePreferencesStore();
  const { trains, stations, routes } = useFavoritesStore();
  const { recent } = useHistoryStore();
  usePopularityStore();
  const favoriteCount = trains.length + stations.length + routes.length;
  const popularTrains = getPopularTrains(5);
  const popularStations = getPopularStations(5);
  const searchActions: ActionGridItem[] = [
    {
      key: 'trains',
      title: 'Train Search',
      description: 'Find trains by name or train number.',
      icon: 'train',
      onPress: () => navigation.navigate('TrainsTab', { screen: 'TrainSearch' }),
    },
    {
      key: 'journeys',
      title: 'Journey Search',
      description: 'Search trains between two stations.',
      icon: 'map-marker-path',
      onPress: () => navigation.navigate('JourneysTab', { screen: 'JourneySearch' }),
    },
    {
      key: 'stations',
      title: 'Station Search',
      description: 'Explore stations and departures.',
      icon: 'domain',
      onPress: () => navigation.navigate('StationsTab', { screen: 'StationSearch' }),
    },
  ];
  const exploreActions: ActionGridItem[] = [
    {
      key: 'browse-trains',
      title: 'Browse All Trains',
      description: 'Search the full list of trains by number or name.',
      icon: 'train-variant',
      onPress: () => navigation.navigate('TrainsTab', { screen: 'TrainSearch' }),
    },
    {
      key: 'major-stations',
      title: 'Major Stations',
      description: 'Search stations and see every train that stops there.',
      icon: 'office-building-outline',
      onPress: () => navigation.navigate('StationsTab', { screen: 'StationSearch' }),
    },
    {
      key: 'plan-journey',
      title: 'Plan a Journey',
      description: 'Find trains running between any two stations.',
      icon: 'map-outline',
      onPress: () => navigation.navigate('JourneysTab', { screen: 'JourneySearch' }),
    },
    {
      key: 'stats',
      title: 'Statistics',
      description: 'Longest/shortest routes, busiest station and more.',
      icon: 'chart-bar',
      onPress: () => navigation.navigate('ExploreTab', { screen: 'Stats' }),
    },
  ];
  const insightActions: ActionGridItem[] = [
    {
      key: 'network',
      title: 'Railway Network',
      description: 'Connectivity, density, and the most central stations.',
      icon: 'graph-outline',
      onPress: () => navigation.navigate('ExploreTab', { screen: 'Network' }),
    },
    {
      key: 'train-intelligence',
      title: 'Train Intelligence',
      description: 'Route complexity, uniqueness, and efficiency scores.',
      icon: 'brain',
      onPress: () => navigation.navigate('TrainsTab', { screen: 'TrainSearch' }),
    },
    {
      key: 'rankings',
      title: 'Rankings',
      description: 'Leaderboards for halts, halt durations, and connectivity.',
      icon: 'trophy-outline',
      onPress: () => navigation.navigate('ExploreTab', { screen: 'Rankings' }),
    },
    {
      key: 'fun-facts',
      title: 'Fun Facts',
      description: 'Station name trivia, palindrome codes, and more.',
      icon: 'sparkles',
      onPress: () => navigation.navigate('ExploreTab', { screen: 'FunFacts' }),
    },
    {
      key: 'achievements',
      title: 'Achievements',
      description: 'Longest routes, fastest trains, rare routes, and more.',
      icon: 'medal-outline',
      onPress: () => navigation.navigate('ExploreTab', { screen: 'Achievements' }),
    },
    {
      key: 'smart-search',
      title: 'Smart Search',
      description: 'Query trains in plain language.',
      icon: 'magnify',
      onPress: () => navigation.navigate('ExploreTab', { screen: 'SmartSearch' }),
    },
  ];
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Chip style={styles.greetingChip} textStyle={styles.greetingChipText} compact>
          👋 {getGreeting()}
        </Chip>

        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <Icon name="train" size={20} color="#fff" />
          </View>
          <Text variant="headlineMedium" style={[styles.heroTitle, styles.heroTitleGrow]}>
            RailLens
          </Text>
          <IconButton
            icon={THEME_ICON[themePreference]}
            mode="outlined"
            onPress={() => setTheme(THEME_CYCLE[themePreference])}
            accessibilityLabel={`Theme: ${themePreference}. Tap to change.`}
          />
        </View>
        <Text style={styles.heroSubtitle}>
          Your personal railway dashboard for searching trains, exploring stations and continuing
          your journeys.
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconBox}>
              <Icon name="heart-outline" size={20} color={BRAND.accent} />
            </View>
            <View>
              <Text variant="titleLarge">{favoriteCount}</Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconBox}>
              <Icon name="clock-outline" size={20} color={BRAND.accent} />
            </View>
            <View>
              <Text variant="titleLarge">{recent.length}</Text>
              <Text style={styles.statLabel}>Recent Searches</Text>
            </View>
          </View>
        </View>

        <View style={styles.ctaRow}>
          <Button
            mode="contained"
            buttonColor={BRAND.accent}
            icon="train"
            onPress={() => navigation.navigate('TrainsTab', { screen: 'TrainSearch' })}
          >
            Search Trains
          </Button>
          <Button
            mode="outlined"
            icon="map-marker-path"
            onPress={() => navigation.navigate('JourneysTab', { screen: 'JourneySearch' })}
          >
            Plan Journey
          </Button>
          <Button
            mode="outlined"
            icon="domain"
            onPress={() => navigation.navigate('StationsTab', { screen: 'StationSearch' })}
          >
            Explore Stations
          </Button>
        </View>
      </View>

      <Section title="Quick Access" description="Your saved items and recent activity.">
        <View style={styles.row}>
          <Chip
            icon="star-outline"
            onPress={() => navigation.navigate('AccountTab', { screen: 'Favorites' })}
          >
            {favoriteCount} favorite{favoriteCount === 1 ? '' : 's'}
          </Chip>
          <Chip
            icon="history"
            onPress={() => navigation.navigate('AccountTab', { screen: 'History' })}
          >
            {recent.length} recent search{recent.length === 1 ? '' : 'es'}
          </Chip>
        </View>
      </Section>

      <Section title="Search" description="Choose a railway search service.">
        <ActionGrid items={searchActions} />
      </Section>

      <Section title="Explore" description="Discover railway services and destinations.">
        <ActionGrid items={exploreActions} />
      </Section>

      <Section title="Popular" description="What you've been looking at on this device.">
        <View style={styles.popularRow}>
          <List.Section style={styles.popularColumn}>
            <List.Subheader>Trains you view often</List.Subheader>
            {popularTrains.length === 0 ? (
              <Text style={styles.empty}>Trains you look up will show up here.</Text>
            ) : (
              popularTrains.map((t) => (
                <List.Item
                  key={t.code}
                  title={t.name}
                  description={`${t.code} · viewed ${t.views}×`}
                  onPress={() =>
                    navigation.navigate('TrainsTab', {
                      screen: 'TrainDetails',
                      params: { trainNumber: t.code },
                    })
                  }
                />
              ))
            )}
          </List.Section>

          <List.Section style={styles.popularColumn}>
            <List.Subheader>Stations you view often</List.Subheader>
            {popularStations.length === 0 ? (
              <Text style={styles.empty}>Stations you look up will show up here.</Text>
            ) : (
              popularStations.map((s) => (
                <List.Item
                  key={s.code}
                  title={s.name}
                  description={`${s.code} · viewed ${s.views}×`}
                  onPress={() =>
                    navigation.navigate('StationsTab', {
                      screen: 'StationDetails',
                      params: { stationCode: s.code },
                    })
                  }
                />
              ))
            )}
          </List.Section>
        </View>
      </Section>

      <Section title="Railway Insights" description="Analytics computed entirely from the dataset.">
        <ActionGrid items={insightActions} />
      </Section>
    </ScrollView>
  );
}
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text variant="titleLarge">{title}</Text>
      <Text variant="bodyMedium" style={styles.sectionDescription}>
        {description}
      </Text>
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 24 },
  section: { gap: 12 },
  sectionDescription: { opacity: 0.7 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  popularRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  popularColumn: { flexBasis: '47%', flexGrow: 1 },
  empty: { opacity: 0.6, paddingHorizontal: 16, paddingBottom: 8 },
  hero: { gap: 12, marginBottom: 8 },
  greetingChip: { alignSelf: 'flex-start', backgroundColor: '#ffedd5' },
  greetingChipText: { color: '#c2410c' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontWeight: '700' },
  heroTitleGrow: { flex: 1 },
  heroSubtitle: { opacity: 0.7 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8884',
    borderRadius: 10,
    padding: 12,
  },
  statIconBox: { backgroundColor: '#ffedd5', borderRadius: 8, padding: 8 },
  statLabel: { opacity: 0.6, fontSize: 12 },
  ctaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
});
