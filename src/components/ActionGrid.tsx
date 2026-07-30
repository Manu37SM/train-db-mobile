import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export interface ActionGridItem {
  key: string;
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}

/**
 * Mobile equivalent of train-db-frontend's DashboardGrid + QuickAccessCard
 * (components/home/DashboardGrid.tsx) - a grid of tappable cards, each
 * linking to a real screen. Used by HomeScreen's Search/Explore/Railway
 * Insights sections.
 */
export function ActionGrid({ items }: { items: ActionGridItem[] }) {
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <Card key={item.key} style={styles.card} onPress={item.onPress} mode="outlined">
          <Card.Content>
            <Icon name={item.icon} size={28} style={styles.icon} />
            <Text variant="titleMedium">{item.title}</Text>
            <Text variant="bodySmall" style={styles.description}>
              {item.description}
            </Text>
          </Card.Content>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { flexBasis: '47%', flexGrow: 1 },
  icon: { marginBottom: 6 },
  description: { opacity: 0.7, marginTop: 2 },
});
