import React, { useEffect, useState } from 'react';
import { AppState, ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { getSeatMap } from './api';
import { BERTH_NAMES } from './format';
import type { SeatMap, TravelClass } from './types';

export const SEAT_MAP_REFRESH_MS = 15000;

const COLORS = {
  FREE: { backgroundColor: '#d1fae5', borderColor: '#6ee7b7' },
  RAC_HALF: { backgroundColor: '#fef3c7', borderColor: '#fcd34d' },
  TAKEN: { backgroundColor: '#e2e8f0', borderColor: '#cbd5e1' },
} as const;
const WORDS = { FREE: 'free', RAC_HALF: 'half taken (RAC)', TAKEN: 'taken' } as const;

interface Props {
  runId: number;
  travelClass: TravelClass;
  fromSeq: number;
  toSeq: number;
}

/** Phase 6: which berths are free for this journey right now, refreshed while the app is open. */
export default function SeatMapView({ runId, travelClass, fromSeq, toSeq }: Props) {
  const [map, setMap] = useState<SeatMap | null>(null);
  const [coach, setCoach] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      getSeatMap(runId, travelClass, fromSeq, toSeq)
        .then((m) => alive && setMap(m))
        .catch(() => undefined);
    void load();
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') void load();
    }, SEAT_MAP_REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [runId, travelClass, fromSeq, toSeq]);

  const shown = map?.coaches.find((c) => c.label === coach) ?? map?.coaches[0];
  if (!map || !shown) return null;

  return (
    <View style={styles.wrap}>
      <Text variant="titleMedium">Seats right now</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coaches}>
        {map.coaches.map((c) => (
          <Chip
            key={c.label}
            selected={c.label === shown.label}
            onPress={() => setCoach(c.label)}
            style={styles.chip}
          >
            {`${c.label} · ${c.free} free`}
          </Chip>
        ))}
      </ScrollView>
      <View style={styles.grid}>
        {shown.berths.map((b) => (
          <View
            key={b.no}
            testID={`berth-${shown.label}-${b.no}`}
            accessibilityLabel={`${shown.label} ${b.no}, ${BERTH_NAMES[b.type] ?? b.type}, ${WORDS[b.state]}`}
            style={[styles.cell, COLORS[b.state]]}
          >
            <Text style={[styles.no, b.state === 'TAKEN' && styles.taken]}>{b.no}</Text>
            <Text style={[styles.type, b.state === 'TAKEN' && styles.taken]}>{b.type}</Text>
          </View>
        ))}
      </View>
      <Text variant="bodySmall" style={styles.legend}>
        Green free · amber half taken (RAC) · grey taken. RailOps picks the exact berth when it
        holds your seats, using each passenger’s preference where it can. RailOps’ own bookings, not
        Indian Railways’.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
  coaches: { marginVertical: 8 },
  chip: { marginRight: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  no: { fontSize: 12, fontWeight: '600', color: '#0f172a' },
  type: { fontSize: 10, color: '#0f172a' },
  taken: { color: '#94a3b8', textDecorationLine: 'line-through' },
  legend: { marginTop: 8, opacity: 0.7 },
});
