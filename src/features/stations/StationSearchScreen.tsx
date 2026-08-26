import React, { useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { ActivityIndicator, Chip, List, Searchbar, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { searchStations } from './api';
import { useHistoryStore } from '@/features/history/store';
import {
  getPopularStationSearches,
  usePopularSearchStore,
} from '@/features/home/popularSearchStore';
import type { StationsStackParamList } from '@/navigation/types';
type Props = NativeStackScreenProps<StationsStackParamList, 'StationSearch'>;
export default function StationSearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const record = useHistoryStore((s) => s.record);
  const recordStationSearch = usePopularSearchStore((s) => s.recordStationSearch);
  usePopularSearchStore();
  const popularSearches = getPopularStationSearches(5);
  const { data, isFetching } = useQuery({
    queryKey: ['stations', 'search', query],
    queryFn: () => searchStations(query),
    enabled: query.trim().length > 0,
  });
  function submitSearch(value: string) {
    if (!value.trim()) return;
    record({ type: 'station', query: value });
    recordStationSearch(value);
  }
  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search by station code or name"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => submitSearch(query)}
        style={styles.searchbar}
      />

      {popularSearches.length > 0 && (
        <View style={styles.chipRow}>
          {popularSearches.map((entry) => (
            <Chip
              key={entry.query}
              icon="fire"
              onPress={() => setQuery(entry.displayQuery)}
              style={styles.chip}
            >
              {entry.displayQuery}
            </Chip>
          ))}
        </View>
      )}

      {isFetching && <ActivityIndicator style={styles.loader} />}

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.stationCode}
        renderItem={({ item }) => (
          <List.Item
            title={`${item.stationCode} · ${item.stationName}`}
            onPress={() => {
              submitSearch(item.stationCode);
              navigation.navigate('StationDetails', { stationCode: item.stationCode });
            }}
          />
        )}
        ListEmptyComponent={
          !isFetching && query.trim().length > 0 ? (
            <Text style={styles.empty}>No stations found for "{query}".</Text>
          ) : null
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1 },
  searchbar: { margin: 12 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  chip: { marginBottom: 4 },
  loader: { marginTop: 16 },
  empty: { textAlign: 'center', marginTop: 24, opacity: 0.6 },
});
