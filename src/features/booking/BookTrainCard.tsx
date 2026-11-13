import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, HelperText, Text } from 'react-native-paper';
import { availabilityLabel, CLASS_NAMES, nextDatesIst, shortDate } from './format';
import { bookingEnabled } from './config';
import { findRun, getAvailability } from './api';
import { getApiErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/authStore';
import type { RouteStopResponse } from '@/types/api';
import type { PoolAvailability, TravelClass } from './types';

export interface BookParams {
  runId: number;
  trainNo: string;
  fromSeq: number;
  toSeq: number;
  travelClass: TravelClass;
}

interface Props {
  trainNumber: string;
  route: RouteStopResponse[];
  /** Stops picked with "Select stops" on the route; whole route otherwise. */
  boardStop: RouteStopResponse | null;
  deboardStop: RouteStopResponse | null;
  onBook: (params: BookParams) => void;
  onSignIn: () => void;
}

interface Result {
  runId: number;
  fromSeq: number;
  toSeq: number;
  pools: PoolAvailability[];
}

/** Phase 5B: seats on a date for the chosen stops, then "Book". Hidden unless booking is switched on. */
export default function BookTrainCard({
  trainNumber,
  route,
  boardStop,
  deboardStop,
  onBook,
  onSignIn,
}: Props) {
  const signedIn = useAuthStore((s) => !!s.session);
  const [dates] = useState(() => nextDatesIst(14));
  const [date, setDate] = useState(dates[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  if (!bookingEnabled() || route.length < 2) return null;
  const from = boardStop ?? route[0];
  const to = deboardStop ?? route[route.length - 1];

  async function check() {
    setError(null);
    setResult(null);
    if (from.sequenceNo >= to.sequenceNo) {
      setError('Choose a boarding station before the destination.');
      return;
    }
    setBusy(true);
    try {
      const run = await findRun(trainNumber, date);
      // RailOps numbers stops its own way: match by station code, never by RailLens' numbering.
      const f = run.stops.find((s) => s.stationCode === from.stationCode);
      const t = run.stops.find((s) => s.stationCode === to.stationCode);
      if (!f || !t || f.seq >= t.seq) {
        setError('This train doesn’t sell tickets between those two stations.');
        return;
      }
      const availability = await getAvailability(run.runId, f.seq, t.seq);
      setResult({
        runId: run.runId,
        fromSeq: f.seq,
        toSeq: t.seq,
        pools: availability.pools.filter((p) => p.quotaCode === 'GN'),
      });
    } catch (e) {
      setError(getApiErrorMessage(e, 'Couldn’t check seats. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={styles.card}>
      <Card.Title title="Book this train" subtitle="Demo: payment is simulated, no money moves" />
      <Card.Content>
        <Text variant="bodyMedium">
          {from.stationName} → {to.stationName}
        </Text>
        <Text variant="bodySmall" style={styles.hint}>
          To change stations, use “Select stops” on the route below.
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dates}>
          {dates.map((d) => (
            <Chip key={d} selected={d === date} onPress={() => setDate(d)} style={styles.dateChip}>
              {shortDate(d)}
            </Chip>
          ))}
        </ScrollView>
        <Button mode="contained" onPress={check} loading={busy} disabled={busy}>
          Check seats
        </Button>
        {error && (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        )}
        {result && result.pools.length === 0 && (
          <Text style={styles.hint}>No classes are on sale for this journey.</Text>
        )}
        {result?.pools.map((p) => {
          const label = availabilityLabel(p.display);
          return (
            <View key={p.classCode} style={styles.row}>
              <View style={styles.rowText}>
                <Text variant="titleSmall">
                  {CLASS_NAMES[p.classCode] ?? p.classCode} ({p.classCode})
                </Text>
                <Text variant="bodySmall">{label.text}</Text>
              </View>
              {label.bookable &&
                (signedIn ? (
                  <Button
                    mode="outlined"
                    accessibilityLabel={`Book ${p.classCode}`}
                    onPress={() =>
                      onBook({
                        runId: result.runId,
                        trainNo: trainNumber,
                        fromSeq: result.fromSeq,
                        toSeq: result.toSeq,
                        travelClass: p.classCode,
                      })
                    }
                  >
                    Book
                  </Button>
                ) : (
                  <Button onPress={onSignIn}>Sign in to book</Button>
                ))}
            </View>
          );
        })}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  hint: { marginTop: 4, marginBottom: 8, opacity: 0.7 },
  dates: { marginBottom: 12 },
  dateChip: { marginRight: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  rowText: { flex: 1 },
});
