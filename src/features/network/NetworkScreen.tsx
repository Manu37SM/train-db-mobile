import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { ActivityIndicator, List, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { getNetworkStats } from './api';
import { StatCard } from '@/components/StatCard';

/** Mirrors train-db-frontend's /network page (NetworkStatsGrid). */
export default function NetworkScreen() {
  const { data, isLoading } = useQuery({ queryKey: ['network', 'stats'], queryFn: getNetworkStats });

  if (isLoading || !data) return <ActivityIndicator style={styles.loader} />;

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
  loader: { marginTop: 40 },
});
