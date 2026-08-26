import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { ActivityIndicator, Card, Chip, IconButton, List, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getStation, getStationIntelligence } from './api';
import { useFavoritesStore } from '@/features/favorites/store';
import { usePopularityStore } from '@/features/home/popularityStore';
import type { StationsStackParamList } from '@/navigation/types';
type Props = NativeStackScreenProps<StationsStackParamList, 'StationDetails'>;
type Filter = 'all' | 'originating' | 'terminating' | 'passing';
export default function StationDetailsScreen({ route }: Props) {
  const { stationCode } = route.params;
  const favorites = useFavoritesStore();
  const navigation = useNavigation<any>();
  const isFavorite = favorites.stations.includes(stationCode);
  const recordStationView = usePopularityStore((s) => s.recordStationView);
  const [filter, setFilter] = useState<Filter>('all');
  const stationQuery = useQuery({
    queryKey: ['stations', stationCode],
    queryFn: () => getStation(stationCode),
  });
  const intelligenceQuery = useQuery({
    queryKey: ['stations', stationCode, 'intelligence'],
    queryFn: () => getStationIntelligence(stationCode),
  });
  useEffect(() => {
    if (stationQuery.data) {
      recordStationView(stationQuery.data.stationCode, stationQuery.data.stationName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationQuery.data?.stationCode]);
  const counts = useMemo(() => {
    const trains = stationQuery.data?.trains ?? [];
    return {
      all: trains.length,
      originating: trains.filter((t) => t.origin).length,
      terminating: trains.filter((t) => t.destination).length,
      passing: trains.filter((t) => !t.origin && !t.destination).length,
    };
  }, [stationQuery.data]);
  const filteredTrains = useMemo(() => {
    const trains = stationQuery.data?.trains ?? [];
    switch (filter) {
      case 'originating':
        return trains.filter((t) => t.origin);
      case 'terminating':
        return trains.filter((t) => t.destination);
      case 'passing':
        return trains.filter((t) => !t.origin && !t.destination);
      default:
        return trains;
    }
  }, [stationQuery.data, filter]);
  if (stationQuery.isLoading) return <ActivityIndicator style={styles.loader} />;
  if (stationQuery.isError || !stationQuery.data) {
    return <Text style={styles.error}>Could not load this station.</Text>;
  }
  const station = stationQuery.data;
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge">
          {station.stationCode} · {station.stationName}
        </Text>
        <IconButton
          icon={isFavorite ? 'star' : 'star-outline'}
          onPress={() => favorites.toggleStation(stationCode)}
        />
      </View>
      <Text style={styles.subtitle}>{station.totalTrains} trains</Text>

      {intelligenceQuery.data && (
        <Card style={styles.card}>
          <Card.Title title="Station Intelligence" />
          <Card.Content>
            <Text>Network rank: {intelligenceQuery.data.networkRank ?? '—'}</Text>
            <Text>Connectivity: {intelligenceQuery.data.connectivityScore.toFixed(2)}</Text>
            <Text>Betweenness: {intelligenceQuery.data.betweennessCentrality.toFixed(3)}</Text>
            <Text>Closeness: {intelligenceQuery.data.closenessCentrality.toFixed(3)}</Text>
            <Text>Degree: {intelligenceQuery.data.degree}</Text>
            <Text>
              Origin {intelligenceQuery.data.originPercent.toFixed(1)}% · Destination{' '}
              {intelligenceQuery.data.destinationPercent.toFixed(1)}% · Transit{' '}
              {intelligenceQuery.data.transitPercent.toFixed(1)}%
            </Text>
            <Text>Average halt: {intelligenceQuery.data.averageHaltMinutes.toFixed(1)} min</Text>
            {intelligenceQuery.data.averageTrainSpeedKmh != null && (
              <Text>
                Average train speed: {intelligenceQuery.data.averageTrainSpeedKmh.toFixed(1)} km/h
              </Text>
            )}
            <Text>
              Importance score: {intelligenceQuery.data.stationImportanceScore.toFixed(2)}
            </Text>
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Title title="Trains Passing Through" />
        <Card.Content>
          <View style={styles.filterRow}>
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'originating', label: 'Originating' },
                { key: 'terminating', label: 'Terminating' },
                { key: 'passing', label: 'Passing Through' },
              ] as const
            ).map((f) => (
              <Chip
                key={f.key}
                selected={filter === f.key}
                onPress={() => setFilter(f.key)}
                style={styles.filterChip}
              >
                {f.label} ({counts[f.key]})
              </Chip>
            ))}
          </View>

          {filteredTrains.length === 0 ? (
            <Text style={styles.empty}>No trains found.</Text>
          ) : (
            filteredTrains.map((t) => (
              <List.Item
                key={t.trainNumber}
                title={`${t.trainNumber} · ${t.trainName}`}
                description={`Arr ${t.arrivalTime ?? '—'} · Dep ${t.departureTime ?? '—'}${t.origin ? ' · Originates here' : ''}${t.destination ? ' · Terminates here' : ''}`}
                onPress={() =>
                  navigation.navigate('TrainsTab', {
                    screen: 'TrainDetails',
                    params: { trainNumber: t.trainNumber },
                  })
                }
              />
            ))
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subtitle: { opacity: 0.7, marginBottom: 12 },
  card: { marginBottom: 12 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  filterChip: { marginBottom: 4 },
  empty: { opacity: 0.6, textAlign: 'center', paddingVertical: 16 },
  loader: { marginTop: 40 },
  error: { textAlign: 'center', marginTop: 40 },
});
