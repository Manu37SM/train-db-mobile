import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
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
