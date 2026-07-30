import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { ActivityIndicator, List, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { getAchievements } from './api';

/**
 * Mirrors train-db-frontend's /achievements page (AchievementsGrid). Web
 * shows the full top-100 lists; mobile caps the initial render to the top
 * 20 per section to keep the screen scannable on a small screen without a
 * separate pagination UI - same data source, same ordering, just a
 * shorter default slice (a "show more" control is a reasonable follow-up,
 * not a data gap).
 */
const PREVIEW_COUNT = 20;

export default function AchievementsScreen() {
  const { data, isLoading } = useQuery({ queryKey: ['stats', 'achievements'], queryFn: getAchievements });

  if (isLoading || !data) return <ActivityIndicator style={styles.loader} />;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Section title={`Longest routes (top ${Math.min(PREVIEW_COUNT, data.longestRoutes.length)} of ${data.longestRoutes.length})`}>
        {data.longestRoutes.slice(0, PREVIEW_COUNT).map((r) => (
          <List.Item key={r.trainNumber} title={`${r.trainNumber} · ${r.trainName}`} description={`${r.distanceKm ?? '—'} km`} />
        ))}
      </Section>

      <Section title={`Fastest trains (top ${Math.min(PREVIEW_COUNT, data.fastestTrains.length)} of ${data.fastestTrains.length})`}>
        {data.fastestTrains.slice(0, PREVIEW_COUNT).map((t) => (
          <List.Item
            key={t.trainNumber}
            title={`${t.trainNumber} · ${t.trainName}`}
            description={`${t.averageSpeedKmh.toFixed(1)} km/h`}
          />
        ))}
      </Section>

      <Section title="Mega routes (>3000 km)">
        {data.megaRoutes.map((r) => (
          <List.Item key={r.trainNumber} title={`${r.trainNumber} · ${r.trainName}`} description={`${r.distanceKm ?? '—'} km`} />
        ))}
      </Section>

      <Section title="Super express rankings">
        {data.superExpressRankings.slice(0, PREVIEW_COUNT).map((t) => (
          <List.Item
            key={t.trainNumber}
            title={`${t.trainNumber} · ${t.trainName}`}
            description={`${t.kmPerHalt.toFixed(1)} km/halt`}
          />
        ))}
      </Section>

      <Section title="Rare routes">
        {data.rareRoutes.slice(0, PREVIEW_COUNT).map((t) => (
          <List.Item
            key={t.trainNumber}
            title={`${t.trainNumber} · ${t.trainName}`}
            description={`${t.averageTrainsPerHop.toFixed(2)} trains/hop avg`}
          />
        ))}
      </Section>

      <Section title="Hidden gems">
        {data.hiddenGems.map((t) => (
          <List.Item
            key={t.trainNumber}
            title={`${t.trainNumber} · ${t.trainName}`}
            description={`${t.distanceKm} km · ${t.averageSpeedKmh.toFixed(1)} km/h`}
          />
        ))}
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 20 },
  section: { gap: 4 },
  sectionTitle: { marginBottom: 4 },
  loader: { marginTop: 40 },
});
