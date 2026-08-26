import React, { useMemo, useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { ActivityIndicator, Button, Card, IconButton, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { searchJourneys } from './api';
import { useHistoryStore } from '@/features/history/store';
import { usePreferencesStore } from '@/store/preferencesStore';
import { StationAutocomplete } from '@/components/StationAutocomplete';
import ExportButton from '@/components/ExportButton';
import { toCsv } from '@/lib/csvExport';
import type { JourneysStackParamList } from '@/navigation/types';
import type { JourneyTrainResponse } from '@/types/api';
type Props = NativeStackScreenProps<JourneysStackParamList, 'JourneySearch'>;
type SortMode = 'fastest' | 'slowest';
function totalMinutes(train: JourneyTrainResponse): number {
  return train.movingMinutes + train.haltedMinutes;
}
export default function JourneySearchScreen({ route }: Props) {
  const navigation = useNavigation<any>();
  const defaultFromStationCode = usePreferencesStore((s) => s.defaultFromStationCode);
  const defaultFromStationName = usePreferencesStore((s) => s.defaultFromStationName);
  const [from, setFrom] = useState(route.params?.from ?? defaultFromStationCode ?? '');
  const [to, setTo] = useState(route.params?.to ?? '');
  const [fromLabel, setFromLabel] = useState(
    route.params?.from ??
      (defaultFromStationCode && defaultFromStationName
        ? `${defaultFromStationCode} · ${defaultFromStationName}`
        : ''),
  );
  const [toLabel, setToLabel] = useState(route.params?.to ?? '');
  const [swapCount, setSwapCount] = useState(0);
  const [sortMode, setSortMode] = useState<SortMode>('fastest');
  const [submitted, setSubmitted] = useState<{
    from: string;
    to: string;
  } | null>(
    route.params?.from && route.params?.to
      ? { from: route.params.from, to: route.params.to }
      : null,
  );
  const record = useHistoryStore((s) => s.record);
  const { data, isFetching, isError } = useQuery({
    queryKey: ['journeys', submitted?.from, submitted?.to],
    queryFn: () => searchJourneys(submitted!.from, submitted!.to),
    enabled: !!submitted,
  });
  const sortedTrains = useMemo(() => {
    if (!data) return [];
    const sorted = [...data.trains].sort((a, b) => totalMinutes(a) - totalMinutes(b));
    return sortMode === 'fastest' ? sorted : sorted.reverse();
  }, [data, sortMode]);
  const runSearch = () => {
    if (!from.trim() || !to.trim()) return;
    const query = { from: from.trim().toUpperCase(), to: to.trim().toUpperCase() };
    setSubmitted(query);
    record({ type: 'journey', query: `${query.from}-${query.to}` });
  };
  const handleSwap = () => {
    if (!from && !to) return;
    const nextFrom = to;
    const nextTo = from;
    setFrom(nextFrom);
    setTo(nextTo);
    setFromLabel(toLabel);
    setToLabel(fromLabel);
    setSwapCount((c) => c + 1);
  };
  return (
    <View style={styles.container}>
      <View style={styles.fieldRow}>
        <View style={styles.fieldGrow}>
          <StationAutocomplete
            key={`from-${swapCount}`}
            label="From"
            initialLabel={fromLabel || undefined}
            onSelect={(station) => {
              setFrom(station?.stationCode ?? '');
              setFromLabel(station ? `${station.stationCode} · ${station.stationName}` : '');
            }}
          />
        </View>
        <IconButton
          icon="swap-vertical"
          mode="outlined"
          onPress={handleSwap}
          style={styles.swapButton}
          accessibilityLabel="Swap stations"
        />
      </View>
      <StationAutocomplete
        key={`to-${swapCount}`}
        label="To"
        initialLabel={toLabel || undefined}
        onSelect={(station) => {
          setTo(station?.stationCode ?? '');
          setToLabel(station ? `${station.stationCode} · ${station.stationName}` : '');
        }}
      />
      <Button mode="contained" onPress={runSearch} style={styles.button}>
        Search journeys
      </Button>

      {isFetching && <ActivityIndicator style={styles.loader} />}
      {isError && <Text style={styles.error}>No journeys found between these stations.</Text>}
      {data && data.trains.length === 0 && (
        <Text style={styles.error}>No direct trains found between these stations.</Text>
      )}

      {data && data.trains.length > 0 && (
        <View style={styles.sortRow}>
          <Text style={styles.resultCount}>
            {data.totalTrains} train{data.totalTrains === 1 ? '' : 's'} found
          </Text>
          <View style={styles.sortRowActions}>
            <ExportButton
              filename={`journeys_${submitted?.from}_to_${submitted?.to}`}
              csv={toCsv(sortedTrains, [
                { key: 'trainNumber', header: 'Train Number' },
                { key: 'trainName', header: 'Train Name' },
                { key: 'departureTime', header: 'Departure' },
                { key: 'arrivalTime', header: 'Arrival' },
                { key: 'duration', header: 'Duration' },
                { key: 'distance', header: 'Distance (km)' },
                { key: 'numHalts', header: 'Halts' },
              ])}
            />
            <Button
              compact
              mode="outlined"
              icon="sort"
              onPress={() => setSortMode((prev) => (prev === 'fastest' ? 'slowest' : 'fastest'))}
            >
              {sortMode === 'fastest' ? 'Fastest first' : 'Slowest first'}
            </Button>
          </View>
        </View>
      )}

      <FlatList
        data={sortedTrains}
        keyExtractor={(item) => item.trainNumber}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() =>
              navigation.navigate('TrainsTab', {
                screen: 'TrainDetails',
                params: { trainNumber: item.trainNumber },
              })
            }
          >
            <Card.Title title={`${item.trainNumber} · ${item.trainName}`} />
            <Card.Content>
              <Text>
                {item.departureTime ?? '—'} → {item.arrivalTime ?? '—'} · {item.duration} ·{' '}
                {item.distance ?? '—'} km
              </Text>
              <Text>
                {item.numHalts} halt{item.numHalts === 1 ? '' : 's'}
                {item.averageMovingSpeedKmh != null
                  ? ` · ${item.averageMovingSpeedKmh.toFixed(1)} km/h avg`
                  : ''}
              </Text>
              {item.nightTravelPercent != null && item.nightTravelPercent > 0 && (
                <Text>{item.nightTravelPercent.toFixed(0)}% overnight</Text>
              )}
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fieldGrow: { flex: 1 },
  swapButton: { marginTop: 4 },
  button: { marginBottom: 12 },
  card: { marginBottom: 10 },
  loader: { marginTop: 16 },
  error: { textAlign: 'center', marginTop: 16, opacity: 0.7 },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sortRowActions: { flexDirection: 'row', alignItems: 'center' },
  resultCount: { opacity: 0.7, fontSize: 12 },
});
