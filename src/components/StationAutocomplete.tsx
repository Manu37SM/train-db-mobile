import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { List, TextInput } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { searchStations } from '@/features/stations/api';
import type { StationSearchResponse } from '@/types/api';
export function StationAutocomplete({
  label,
  initialLabel,
  onSelect,
}: {
  label: string;
  initialLabel?: string;
  onSelect: (station: StationSearchResponse | null) => void;
}) {
  const [query, setQuery] = useState(initialLabel ?? '');
  const [focused, setFocused] = useState(false);
  const { data } = useQuery({
    queryKey: ['stations', 'search', query],
    queryFn: () => searchStations(query),
    enabled: focused && query.trim().length > 0,
  });
  return (
    <View style={styles.container}>
      <TextInput
        label={label}
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          if (text.trim().length === 0) onSelect(null);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
      />

      {focused && (data?.length ?? 0) > 0 && (
        <View style={styles.dropdown}>
          {data!.slice(0, 8).map((station) => (
            <List.Item
              key={station.stationCode}
              title={`${station.stationCode} · ${station.stationName}`}
              onPress={() => {
                setQuery(`${station.stationCode} · ${station.stationName}`);
                setFocused(false);
                onSelect(station);
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  dropdown: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#8884', borderRadius: 4 },
});
