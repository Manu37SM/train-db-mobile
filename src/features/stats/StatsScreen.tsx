import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { ActivityIndicator, List, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { getStats } from './api';
import { StatCard } from '@/components/StatCard';
export default function StatsScreen() {
  const { data, isLoading } = useQuery({ queryKey: ['stats'], queryFn: getStats });
  if (isLoading || !data) return <ActivityIndicator style={styles.loader} />;
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.grid}>
        <StatCard label="Total trains" value={data.totalTrains} />
        <StatCard label="Total stations" value={data.totalStations} />
      </View>

      {data.longestRoute && (
        <Section title="Longest route">
          <Text>
            {data.longestRoute.trainNumber} · {data.longestRoute.trainName} —{' '}
            {data.longestRoute.distanceKm} km
          </Text>
        </Section>
      )}

      {data.shortestRoute && (
        <Section title="Shortest route">
          <Text>
            {data.shortestRoute.trainNumber} · {data.shortestRoute.trainName} —{' '}
            {data.shortestRoute.distanceKm} km
          </Text>
        </Section>
      )}

      {data.busiestStation && (
        <Section title="Busiest station">
          <Text>
            {data.busiestStation.stationCode} · {data.busiestStation.stationName} —{' '}
            {data.busiestStation.trainCount} trains
          </Text>
        </Section>
      )}

      <Section title="Busiest stations">
        {data.busiestStations.map((s) => (
          <List.Item
            key={s.stationCode}
            title={`${s.stationCode} · ${s.stationName}`}
            description={`${s.trainCount} trains`}
          />
        ))}
      </Section>

      <Section title="Fastest trains">
        {data.fastestTrains.map((t) => (
          <List.Item
            key={t.trainNumber}
            title={`${t.trainNumber} · ${t.trainName}`}
            description={`${t.averageSpeedKmh.toFixed(1)} km/h · ${t.distanceKm} km`}
          />
        ))}
      </Section>

      <Section title="Slowest trains">
        {data.slowestTrains.map((t) => (
          <List.Item
            key={t.trainNumber}
            title={`${t.trainNumber} · ${t.trainName}`}
            description={`${t.averageSpeedKmh.toFixed(1)} km/h · ${t.distanceKm} km`}
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
  grid: { flexDirection: 'row', gap: 10 },
  section: { gap: 4 },
  sectionTitle: { marginBottom: 4 },
  loader: { marginTop: 40 },
});
