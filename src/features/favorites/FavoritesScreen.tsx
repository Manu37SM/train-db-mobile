import React, { useState } from 'react';
import { SectionList, View, StyleSheet } from 'react-native';
import { Button, IconButton, List, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useFavoritesStore } from './store';
type FavoriteRow =
  | {
      kind: 'train';
      trainNumber: string;
    }
  | {
      kind: 'station';
      stationCode: string;
    }
  | {
      kind: 'route';
      from: string;
      to: string;
      key: string;
    };
export default function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const { trains, stations, routes, toggleTrain, toggleStation, toggleRoute } = useFavoritesStore();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const total = trains.length + stations.length + routes.length;
  const sections: {
    title: string;
    icon: string;
    data: FavoriteRow[];
  }[] = [
    {
      title: 'Trains',
      icon: 'train',
      data: trains.map((t): FavoriteRow => ({ kind: 'train', trainNumber: t })),
    },
    {
      title: 'Stations',
      icon: 'domain',
      data: stations.map((s): FavoriteRow => ({ kind: 'station', stationCode: s })),
    },
    {
      title: 'Routes',
      icon: 'map-marker-path',
      data: routes.map((r): FavoriteRow => {
        const [from, to] = r.split('-');
        return { kind: 'route', from, to, key: r };
      }),
    },
  ];
  function rowTitle(row: FavoriteRow): string {
    if (row.kind === 'train') return row.trainNumber;
    if (row.kind === 'station') return row.stationCode;
    return `${row.from} → ${row.to}`;
  }
  function rowKey(row: FavoriteRow): string {
    if (row.kind === 'train') return `train-${row.trainNumber}`;
    if (row.kind === 'station') return `station-${row.stationCode}`;
    return `route-${row.key}`;
  }
  function openRow(row: FavoriteRow) {
    if (row.kind === 'train') {
      navigation.navigate('TrainsTab', {
        screen: 'TrainDetails',
        params: { trainNumber: row.trainNumber },
      });
    } else if (row.kind === 'station') {
      navigation.navigate('StationsTab', {
        screen: 'StationDetails',
        params: { stationCode: row.stationCode },
      });
    } else {
      navigation.navigate('JourneysTab', {
        screen: 'JourneySearch',
        params: { from: row.from, to: row.to },
      });
    }
  }
  function removeRow(row: FavoriteRow) {
    if (row.kind === 'train') toggleTrain(row.trainNumber);
    else if (row.kind === 'station') toggleStation(row.stationCode);
    else toggleRoute(row.key);
  }
  function clearAll() {
    trains.forEach(toggleTrain);
    stations.forEach(toggleStation);
    routes.forEach(toggleRoute);
    setConfirmingClear(false);
  }
  if (total === 0) {
    return (
      <View style={styles.empty}>
        <Text variant="titleMedium">No favorites yet</Text>
        <Text style={styles.emptyDescription}>
          Save trains or stations from their detail pages to access them quickly here.
        </Text>
        <Button onPress={() => navigation.navigate('TrainsTab', { screen: 'TrainSearch' })}>
          Browse trains
        </Button>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.clearRow}>
        {confirmingClear ? (
          <>
            <Text style={styles.confirmText}>Remove all {total}?</Text>
            <Button compact mode="contained" buttonColor="#dc2626" onPress={clearAll}>
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

      <SectionList
        sections={sections}
        keyExtractor={rowKey}
        renderSectionHeader={({ section }) => (
          <List.Subheader>
            {section.title} ({section.data.length})
          </List.Subheader>
        )}
        renderItem={({ item, section }) => (
          <List.Item
            title={rowTitle(item)}
            left={(p) => <List.Icon {...p} icon={section.icon} />}
            right={(p) => <IconButton {...p} icon="close" onPress={() => removeRow(item)} />}
            onPress={() => openRow(item)}
          />
        )}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? <Text style={styles.sectionEmpty}>None yet</Text> : null
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  clearRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 8,
    gap: 4,
  },
  confirmText: { marginRight: 4 },
  sectionEmpty: { paddingHorizontal: 16, paddingBottom: 12, opacity: 0.5 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
  emptyDescription: { textAlign: 'center', opacity: 0.6 },
});
