import React, { useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { Button, IconButton, List, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useHistoryStore } from './store';

const ICONS: Record<'train' | 'station' | 'journey', string> = {
  train: 'train',
  station: 'domain',
  journey: 'map-marker-path',
};

/** Mirrors train-db-frontend's /history page (SearchHistoryList). */
export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const { recent, remove, clearRecent } = useHistoryStore();
  const [confirmingClear, setConfirmingClear] = useState(false);

  function openEntry(entry: (typeof recent)[number]) {
    if (entry.type === 'train') {
      navigation.navigate('TrainsTab', { screen: 'TrainDetails', params: { trainNumber: entry.query } });
    } else if (entry.type === 'station') {
      navigation.navigate('StationsTab', { screen: 'StationDetails', params: { stationCode: entry.query } });
    } else {
      const [from, to] = entry.query.split('-');
      navigation.navigate('JourneysTab', { screen: 'JourneySearch', params: { from, to } });
    }
  }

  if (recent.length === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="titleMedium">No search history yet</Text>
        <Text style={styles.emptyDescription}>
          Trains, stations and journeys you search for will show up here, so you can quickly get back to them later.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.clearRow}>
        {confirmingClear ? (
          <>
            <Text style={styles.confirmText}>Clear all {recent.length}?</Text>
            <Button compact mode="contained" buttonColor="#dc2626" onPress={() => { clearRecent(); setConfirmingClear(false); }}>
              Confirm
            </Button>
            <Button compact onPress={() => setConfirmingClear(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button compact icon="trash-can-outline" onPress={() => setConfirmingClear(true)}>
            Clear all
          </Button>
        )}
      </View>

      <FlatList
        data={recent}
        keyExtractor={(item, index) => `${item.type}-${item.query}-${index}`}
        renderItem={({ item }) => (
          <List.Item
            title={item.query}
            description={`${item.type} · ${new Date(item.timestamp).toLocaleString()}`}
            left={(p) => <List.Icon {...p} icon={ICONS[item.type]} />}
            right={(p) => <IconButton {...p} icon="close" onPress={() => remove(item)} />}
            onPress={() => openEntry(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  clearRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', padding: 8, gap: 4 },
  confirmText: { marginRight: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
  emptyDescription: { textAlign: 'center', opacity: 0.6 },
});
