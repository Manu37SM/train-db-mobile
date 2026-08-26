import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { ActivityIndicator, Card, List } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { getAchievements } from './api';
const PREVIEW_COUNT = 20;
export default function AchievementsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['stats', 'achievements'],
    queryFn: getAchievements,
  });
  const navigation = useNavigation<any>();
  if (isLoading || !data) return <ActivityIndicator style={styles.loader} />;
  const openTrain = (trainNumber: string) =>
    navigation.navigate('TrainsTab', { screen: 'TrainDetails', params: { trainNumber } });
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Section
        title={`Longest routes (top ${Math.min(PREVIEW_COUNT, data.longestRoutes.length)} of ${data.longestRoutes.length})`}
      >
        {data.longestRoutes.slice(0, PREVIEW_COUNT).map((r) => (
          <List.Item
            key={r.trainNumber}
            title={`${r.trainNumber} · ${r.trainName}`}
            description={`${r.distanceKm ?? '—'} km`}
            onPress={() => openTrain(r.trainNumber)}
          />
        ))}
      </Section>

      <Section
        title={`Fastest trains (top ${Math.min(PREVIEW_COUNT, data.fastestTrains.length)} of ${data.fastestTrains.length})`}
      >
        {data.fastestTrains.slice(0, PREVIEW_COUNT).map((t) => (
          <List.Item
            key={t.trainNumber}
            title={`${t.trainNumber} · ${t.trainName}`}
            description={`${t.averageSpeedKmh.toFixed(1)} km/h`}
            onPress={() => openTrain(t.trainNumber)}
          />
        ))}
      </Section>

      <Section title="Mega routes (>3000 km)">
        {data.megaRoutes.map((r) => (
          <List.Item
            key={r.trainNumber}
            title={`${r.trainNumber} · ${r.trainName}`}
            description={`${r.distanceKm ?? '—'} km`}
            onPress={() => openTrain(r.trainNumber)}
          />
        ))}
      </Section>

      <Section title="Super express rankings">
        {data.superExpressRankings.slice(0, PREVIEW_COUNT).map((t) => (
          <List.Item
            key={t.trainNumber}
            title={`${t.trainNumber} · ${t.trainName}`}
            description={`${t.kmPerHalt.toFixed(1)} km/halt`}
            onPress={() => openTrain(t.trainNumber)}
          />
        ))}
      </Section>

      <Section title="Rare routes">
        {data.rareRoutes.slice(0, PREVIEW_COUNT).map((t) => (
          <List.Item
            key={t.trainNumber}
            title={`${t.trainNumber} · ${t.trainName}`}
            description={`${t.averageTrainsPerHop.toFixed(2)} trains/hop avg`}
            onPress={() => openTrain(t.trainNumber)}
          />
        ))}
      </Section>

      <Section title="Hidden gems">
        {data.hiddenGems.map((t) => (
          <List.Item
            key={t.trainNumber}
            title={`${t.trainNumber} · ${t.trainName}`}
            description={`${t.distanceKm} km · ${t.averageSpeedKmh.toFixed(1)} km/h`}
            onPress={() => openTrain(t.trainNumber)}
          />
        ))}
      </Section>
    </ScrollView>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card style={styles.section}>
      <Card.Title title={title} titleNumberOfLines={2} />
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}
const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  section: { gap: 4 },
  loader: { marginTop: 40 },
});
