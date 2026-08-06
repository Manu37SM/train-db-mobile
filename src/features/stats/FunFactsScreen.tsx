import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { ActivityIndicator, Card, Chip, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { getFunStats } from './api';

const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

/** Mirrors train-db-frontend's /fun-facts page (FunFactsGrid). */
export default function FunFactsScreen() {
  const { data, isLoading } = useQuery({ queryKey: ['stats', 'fun-facts'], queryFn: getFunStats });
  const navigation = useNavigation<any>();

  if (isLoading || !data) return <ActivityIndicator style={styles.loader} />;

  const openStation = (stationCode: string) =>
    navigation.navigate('StationsTab', { screen: 'StationDetails', params: { stationCode } });

  const openTrain = (trainNumber: string) =>
    navigation.navigate('TrainsTab', { screen: 'TrainDetails', params: { trainNumber } });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {data.longestStationName && (
        <FactCard title="Longest station name">
          <Text style={styles.link} onPress={() => openStation(data.longestStationName!.stationCode)}>
            {data.longestStationName.stationName} ({data.longestStationName.stationCode}) — {data.longestStationName.length} characters
          </Text>
        </FactCard>
      )}

      {data.shortestStationName && (
        <FactCard title="Shortest station name">
          <Text style={styles.link} onPress={() => openStation(data.shortestStationName!.stationCode)}>
            {data.shortestStationName.stationName} ({data.shortestStationName.stationCode}) — {data.shortestStationName.length}{' '}
            characters
          </Text>
        </FactCard>
      )}

      {data.mostCommonStationNameWord && (
        <FactCard title="Most common word in station names">
          <Text>
            "{data.mostCommonStationNameWord.word}" appears {data.mostCommonStationNameWord.count} times
          </Text>
        </FactCard>
      )}

      {data.trainWithMostUniqueStations && (
        <FactCard title="Train with most unique stations">
          <Text style={styles.link} onPress={() => openTrain(data.trainWithMostUniqueStations!.trainNumber)}>
            {data.trainWithMostUniqueStations.trainNumber} · {data.trainWithMostUniqueStations.trainName} —{' '}
            {data.trainWithMostUniqueStations.uniqueStationCount} stations
          </Text>
        </FactCard>
      )}

      {/* Letter counts only - the backend doesn't return which stations
          make up each count, and StationSearch has no "initial letter"
          param to filter by, so there's nowhere to send a tap yet. Would
          need a backend field (e.g. a station-code list per letter) or a
          new search param before this can link anywhere. */}
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
              <Chip key={code} onPress={() => openStation(code)}>
                {code}
              </Chip>
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

// Only the four single-fact sections (longest/shortest station name, most
// common word, train with most unique stations) get a Card - each one was
// a title plus a single line of text with nothing to visually distinguish
// it from the next, reading as one long undifferentiated list (reported
// 2026-08-06). "Stations by first letter" and "Palindrome station codes"
// are already their own distinct grid/chip-block layouts (Section, above)
// and don't have that problem, so they're deliberately left alone rather
// than wrapped for the sake of consistency alone.
function FactCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card style={styles.section}>
      <Card.Title title={title} />
      <Card.Content>{children}</Card.Content>
    </Card>
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
  link: { color: '#2563eb' },
});
