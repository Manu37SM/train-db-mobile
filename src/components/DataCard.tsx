import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';

/**
 * Generic "dump a JSON-ish response as readable rows" card. Used as a
 * Phase 2 placeholder on the Explore-tab screens (Rankings/FunFacts/
 * Achievements/Network/Stats/Admin) before those got bespoke UI matching
 * web's dedicated grid components (RankingsGrid, FunFactsGrid,
 * AchievementsGrid, NetworkStatsGrid, StatsGrid) - see those screens under
 * src/features/stats, src/features/network, src/features/admin for the
 * current implementation. No longer used anywhere; kept around as a quick
 * option for ad-hoc debugging of a new endpoint's raw shape before
 * building real UI for it.
 */
export function DataCard({ title, data }: { title: string; data: Record<string, unknown> }) {
  return (
    <Card style={styles.card}>
      <Card.Title title={title} />
      <Card.Content>
        {Object.entries(data).map(([key, value]) => (
          <Text key={key} style={styles.row}>
            {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </Text>
        ))}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { margin: 12 },
  row: { marginBottom: 4 },
});
