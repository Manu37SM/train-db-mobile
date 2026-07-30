import React, { useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { ActivityIndicator, Chip, List, Searchbar, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { searchTrains } from './api';
import { useHistoryStore } from '@/features/history/store';
import { getPopularTrainSearches, usePopularSearchStore } from '@/features/home/popularSearchStore';
import type { TrainsStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<TrainsStackParamList, 'TrainSearch'>;

/**
 * Mirrors train-db-frontend's /trains page (TrainSearchClient +
 * TrainList/TrainCard + PopularSearchChips): search by number/name with
 * the same /trains/search?q= endpoint, fuzzy fallback handled server-side
 * so no client-side duplication.
 */
export default function TrainSearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const record = useHistoryStore((s) => s.record);
  const recordTrainSearch = usePopularSearchStore((s) => s.recordTrainSearch);
  usePopularSearchStore(); // subscribe so the chip row re-renders after a search
  const popularSearches = getPopularTrainSearches(5);

  const { data, isFetching } = useQuery({
    queryKey: ['trains', 'search', query],
    queryFn: () => searchTrains(query),
    enabled: query.trim().length > 0,
  });

  function submitSearch(value: string) {
    if (!value.trim()) return;
    record({ type: 'train', query: value });
    recordTrainSearch(value);
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search by train number or name"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => submitSearch(query)}
        style={styles.searchbar}
      />

      {popularSearches.length > 0 && (
        <View style={styles.chipRow}>
          {popularSearches.map((entry) => (
            <Chip key={entry.query} icon="fire" onPress={() => setQuery(entry.displayQuery)} style={styles.chip}>
              {entry.displayQuery}
            </Chip>
          ))}
        </View>
      )}

      {isFetching && <ActivityIndicator style={styles.loader} />}

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.trainNumber}
        renderItem={({ item }) => (
          <List.Item
            title={item.trainNumber}
            description={item.trainName}
            onPress={() => {
              submitSearch(item.trainNumber);
              navigation.navigate('TrainDetails', { trainNumber: item.trainNumber });
            }}
          />
        )}
        ListEmptyComponent={
          !isFetching && query.trim().length > 0 ? (
            <Text style={styles.empty}>No trains found for "{query}".</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchbar: { margin: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingBottom: 8 },
  chip: { marginBottom: 4 },
  loader: { marginTop: 16 },
  empty: { textAlign: 'center', marginTop: 24, opacity: 0.6 },
});
