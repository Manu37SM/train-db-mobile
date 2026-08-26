import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.card}>
      <Text variant="titleLarge">{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8884',
    borderRadius: 10,
    padding: 12,
  },
  label: { opacity: 0.6, fontSize: 12, marginTop: 2 },
});
