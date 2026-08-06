import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { ActivityIndicator, List, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { getRankings } from './api';

/** Mirrors train-db-frontend's /rankings page (RankingsGrid). */
export default function RankingsScreen() {
  const { data, isLoading } = useQuery({ queryKey: ['stats', 'rankings'], queryFn: getRankings });
  const navigation = useNavigation<any>();

  if (isLoading || !data) return <ActivityIndicator style={styles.loader} />;

  const openTrain = (trainNumber: string) =>
    navigation.navigate('TrainsTab', { screen: 'TrainDetails', params: { trainNumber } });

  const openStation = (stationCode: string) =>
    navigation.navigate('StationsTab', { screen: 'StationDetails', params: { stationCode } });

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Section title="Most halts">
        {data.mostHaltsTrains.map((t) => (
          <List.Item
            key={t.trainNumber}
            title={`${t.trainNumber} · ${t.trainName}`}
            description={`${t.haltCount} halts`}
            onPress={() => openTrain(t.trainNumber)}
          />
        ))}
      </Section>

      <Section title="Fewest halts">
        {data.fewestHaltsTrains.map((t) => (
          <List.Item
            key={t.trainNumber}
            title={`${t.trainNumber} · ${t.trainName}`}
            description={`${t.haltCount} halts`}
            onPress={() => openTrain(t.trainNumber)}
          />
        ))}
      </Section>

      <Section title="Longest halts">
        {data.longestHalts.map((h, i) => (
          <List.Item
            key={`${h.trainNumber}-${h.stationCode}-${i}`}
            title={`${h.trainNumber} · ${h.trainName}`}
            description={`${h.stationCode} · ${h.stationName} — ${h.minutes} min`}
            onPress={() => openTrain(h.trainNumber)}
          />
        ))}
      </Section>

      <Section title="Shortest halts">
        {data.shortestHalts.map((h, i) => (
          <List.Item
            key={`${h.trainNumber}-${h.stationCode}-${i}`}
            title={`${h.trainNumber} · ${h.trainName}`}
            description={`${h.stationCode} · ${h.stationName} — ${h.minutes} min`}
            onPress={() => openTrain(h.trainNumber)}
          />
        ))}
      </Section>

      <Section title="Most popular origin stations">
        {data.mostPopularOriginStations.map((s) => (
          <List.Item
            key={s.stationCode}
            title={`${s.stationCode} · ${s.stationName}`}
            description={`${s.count} trains originate here`}
            onPress={() => openStation(s.stationCode)}
          />
        ))}
      </Section>

      <Section title="Most connected stations">
        {data.mostConnectedStations.map((s) => (
          <List.Item
            key={s.stationCode}
            title={`${s.stationCode} · ${s.stationName}`}
            description={`${s.count} connections`}
            onPress={() => openStation(s.stationCode)}
          />
        ))}
      </Section>
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
});
