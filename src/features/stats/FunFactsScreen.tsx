import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { ActivityIndicator, Chip, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { getFunStats } from './api';

const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

/** Mirrors train-db-frontend's /fun-facts page (FunFactsGrid). */
export default function FunFactsScreen() {
  const { data, isLoading } = useQuery({ queryKey: ['stats', 'fun-facts'], queryFn: getFunStats });

  if (isLoading || !data) return <ActivityIndicator style={styles.loader} />;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {data.longestStationName && (
        <Section title="Longest station name">
          <Text>
            {data.longestStationName.stationName} ({data.longestStationName.stationCode}) — {data.longestStationName.length} characters
          </Text>
        </Section>
      )}

      {data.shortestStationName && (
        <Section title="Shortest station name">
          <Text>
            {data.shortestStationName.stationName} ({data.shortestStationName.stationCode}) — {data.shortestStationName.length}{' '}
            characters
          </Text>
        </Section>
      )}

      {data.mostCommonStationNameWord && (
        <Section title="Most common word in station names">
          <Text>
            "{data.mostCommonStationNameWord.word}" appears {data.mostCommonStationNameWord.count} times
          </Text>
        </Section>
      )}

      {data.trainWithMostUniqueStations && (
        <Section title="Train with most unique stations">
          <Text>
            {data.trainWithMostUniqueStations.trainNumber} · {data.trainWithMostUniqueStations.trainName} —{' '}
            {data.trainWithMostUniqueStations.uniqueStationCount} stations
          </Text>
        </Section>
      )}

      <Section title="Stations by first letter">
        <View style={styles.letterGrid}>
          {ALPHABET.map((letter) => (
            <View key={letter} style={styles.letterCell}>
              <Text variant="titleMedium">{letter}</Text>
              <Text style={styles.letterCount}>{data.stationCountByFirstLetter[letter] ?? 0}</Text>
            </View>
          ))}
        </View>
      </Section>

      {data.palindromeStationCodes.length > 0 && (
        <Section title="Palindrome station codes">
          <View style={styles.chipRow}>
            {data.palindromeStationCodes.map((code) => (
              <Chip key={code}>{code}</Chip>
            ))}
          </View>
        </Section>
      )}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 20 },
  section: { gap: 4 },
  sectionTitle: { marginBottom: 4 },
  loader: { marginTop: 40 },
  letterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  letterCell: {
    width: 52,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8884',
    borderRadius: 8,
    paddingVertical: 8,
  },
  letterCount: { opacity: 0.6, fontSize: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
