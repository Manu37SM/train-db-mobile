import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, HelperText, List, Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { listBookings } from './api';
import { CLASS_NAMES, formatInr, STATUS_LABELS } from './format';
import { getApiErrorMessage } from '@/lib/apiError';
import type { BookingSummary } from './types';

export default function BookingsScreen({
  navigation,
}: {
  navigation: { navigate: (s: 'Booking', p: { pnr: string }) => void };
}) {
  const [items, setItems] = useState<BookingSummary[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (next: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const page = await listBookings(next);
      setItems((old) => [...(next ? (old ?? []) : []), ...page.items]);
      setCursor(page.nextCursor ?? null);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Couldn’t load your bookings.'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Fresh each time the screen is shown: statuses change (paid, charted, cancelled).
  useFocusEffect(
    useCallback(() => {
      load(null);
    }, [load]),
  );

  return (
    <View style={styles.container}>
      {error && (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      )}
      {items?.length === 0 && (
        <Text style={styles.empty}>No bookings yet. Open a train and use “Book this train”.</Text>
      )}
      <FlatList
        data={items ?? []}
        keyExtractor={(b) => b.pnr}
        refreshing={loading && !cursor}
        onRefresh={() => load(null)}
        renderItem={({ item: b }) => (
          <List.Item
            title={`PNR ${b.pnr}`}
            description={`${b.runDate} · ${CLASS_NAMES[b.classCode] ?? b.classCode} · ${formatInr(b.totalFare)}\n${STATUS_LABELS[b.status] ?? b.status}`}
            descriptionNumberOfLines={2}
            left={(p) => <List.Icon {...p} icon="ticket-outline" />}
            onPress={() => navigation.navigate('Booking', { pnr: b.pnr })}
          />
        )}
        ListFooterComponent={
          cursor && !loading ? (
            <Button onPress={() => load(cursor)}>Show older bookings</Button>
          ) : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { padding: 16 },
});
