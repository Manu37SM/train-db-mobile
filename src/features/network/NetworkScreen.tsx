import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { ActivityIndicator, Button, List, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { getNetworkStats } from './api';
import { StatCard } from '@/components/StatCard';

/** Mirrors train-db-frontend's /network page (NetworkStatsGrid). */
export default function NetworkScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['network', 'stats'],
    queryFn: getNetworkStats,
  });

  if (isLoading) return <ActivityIndicator style={styles.loader} />;

  // Without this, a failed/errored request (e.g. a cold Render instance
  // timing out) left `data` undefined forever while `isLoading` had
  // already settled to false - the `isLoading || !data` guard this
  // replaced treated that identically to "still loading", so the screen
  // just spun forever instead of surfacing the failure. Reported
  // 2026-08-06 as "Railway Network page keeps loading".
  if (isError || !data) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>Couldn't load network stats.</Text>
        <Button mode="outlined" onPress={() => refetch()} loading={isRefetching}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.grid}>
        <StatCard label="Stations" value={data.totalStations} />
        <StatCard label="Trains" value={data.totalTrains} />
        <StatCard label="Connections" value={data.totalEdges} />
        <StatCard label="Route density" value={data.routeDensity.toFixed(3)} />
        <StatCard label="Connected components" value={data.connectedComponentCount} />
        <StatCard label="Largest component" value={data.largestComponentSize} />
        <StatCard label="Network diameter" value={data.networkDiameter} />
      </View>

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Most central stations
        </Text>
        {data.mostCentralStations.map((s) => (
          <List.Item
            key={s.stationCode}
            title={`${s.stationCode} · ${s.stationName}`}
            description={`Betweenness ${s.betweennessCentrality.toFixed(3)} · Closeness ${s.closenessCentrality.toFixed(3)} · Degree ${s.degree}`}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  section: { gap: 4 },
  sectionTitle: { marginBottom: 4 },
  loader: { marginTop: 40, alignItems: 'center', gap: 12 },
  errorText: { opacity: 0.7 },
});
