import React, { useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { ActivityIndicator, Button, Card, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { searchJourneys } from './api';
import { useHistoryStore } from '@/features/history/store';
import { usePreferencesStore } from '@/store/preferencesStore';
import { StationAutocomplete } from '@/components/StationAutocomplete';
import type { JourneysStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<JourneysStackParamList, 'JourneySearch'>;

/**
 * Mirrors train-db-frontend's /journeys page (JourneySearchForm +
 * JourneyResults / JourneyResultRow): direct trains, distance, total
 * travel time, and Journey Analysis fields (moving/halted time, avg speed,
 * night/day %), all from JourneyTrainResponse via GET /journeys. Each
 * result row opens that train's details, same as web's Link - there's no
 * "save" affordance here on web (that's TrainDetailsScreen's separate
 * "plan a partial journey" feature, see savedJourneys/), an earlier pass
 * of this screen incorrectly added one.
 *
 * `duration` and `distance` come pre-formatted/nullable straight off
 * JourneyTrainResponse (duration is a backend-formatted string, not a
 * number of minutes to reformat client-side).
 */
export default function JourneySearchScreen({ route }: Props) {
  const navigation = useNavigation<any>();
  const defaultFromStationCode = usePreferencesStore((s) => s.defaultFromStationCode);
  const defaultFromStationName = usePreferencesStore((s) => s.defaultFromStationName);

  // Optional from/to params let the Assistant (and any other deep link)
  // jump straight to a journey search pre-filled, same as web's
  // /journeys?from=&to= query string.
  const [from, setFrom] = useState(route.params?.from ?? defaultFromStationCode ?? '');
  const [to, setTo] = useState(route.params?.to ?? '');
  const [submitted, setSubmitted] = useState<{ from: string; to: string } | null>(
    route.params?.from && route.params?.to ? { from: route.params.from, to: route.params.to } : null,
  );
  const record = useHistoryStore((s) => s.record);

  const { data, isFetching, isError } = useQuery({
    queryKey: ['journeys', submitted?.from, submitted?.to],
    queryFn: () => searchJourneys(submitted!.from, submitted!.to),
    enabled: !!submitted,
  });

  const runSearch = () => {
    if (!from.trim() || !to.trim()) return;
    const query = { from: from.trim().toUpperCase(), to: to.trim().toUpperCase() };
    setSubmitted(query);
    record({ type: 'journey', query: `${query.from}-${query.to}` });
  };

  return (
    <View style={styles.container}>
      <StationAutocomplete
        label="From"
        initialLabel={
          defaultFromStationCode && defaultFromStationName
            ? `${defaultFromStationCode} · ${defaultFromStationName}`
            : undefined
        }
        onSelect={(station) => setFrom(station?.stationCode ?? '')}
      />
      <StationAutocomplete label="To" onSelect={(station) => setTo(station?.stationCode ?? '')} />
      <Button mode="contained" onPress={runSearch} style={styles.button}>
        Search journeys
      </Button>

      {isFetching && <ActivityIndicator style={styles.loader} />}
      {isError && <Text style={styles.error}>No journeys found between these stations.</Text>}
      {data && data.trains.length === 0 && <Text style={styles.error}>No direct trains found between these stations.</Text>}

      <FlatList
        data={data?.trains ?? []}
        keyExtractor={(item) => item.trainNumber}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => navigation.navigate('TrainsTab', { screen: 'TrainDetails', params: { trainNumber: item.trainNumber } })}
          >
            <Card.Title title={`${item.trainNumber} · ${item.trainName}`} />
            <Card.Content>
              <Text>
                {item.departureTime ?? '—'} → {item.arrivalTime ?? '—'} · {item.duration} · {item.distance ?? '—'} km
              </Text>
              <Text>
                {item.numHalts} halt{item.numHalts === 1 ? '' : 's'}
                {item.averageMovingSpeedKmh != null ? ` · ${item.averageMovingSpeedKmh.toFixed(1)} km/h avg` : ''}
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
  button: { marginBottom: 12 },
  card: { marginBottom: 10 },
  loader: { marginTop: 16 },
  error: { textAlign: 'center', marginTop: 16, opacity: 0.7 },
});
