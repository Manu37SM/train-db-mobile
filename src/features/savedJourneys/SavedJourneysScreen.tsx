import React, { useState } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { Button, IconButton, List, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSavedJourneysStore } from './store';
import { formatPartialDuration } from '@/lib/partialJourney';

/**
 * Mirrors train-db-frontend's /saved-journeys page (SavedJourneysList):
 * boarding→deboarding segments saved from a train's route (see
 * TrainDetailsScreen's "Plan a partial journey" mode), not a from/to
 * search - tapping a row opens that train, same as web's Link.
 */
export default function SavedJourneysScreen() {
  const navigation = useNavigation<any>();
  const { journeys, remove, clear } = useSavedJourneysStore();
  const [confirmingClear, setConfirmingClear] = useState(false);

  return (
    <View style={styles.container}>
      {journeys.length > 0 && (
        <View style={styles.clearRow}>
          {confirmingClear ? (
            <>
              <Text style={styles.confirmText}>Remove all {journeys.length}?</Text>
              <Button compact mode="contained" buttonColor="#dc2626" onPress={() => { clear(); setConfirmingClear(false); }}>
                Confirm
              </Button>
              <Button compact onPress={() => setConfirmingClear(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button compact icon="trash-can-outline" onPress={() => setConfirmingClear(true)}>
              Clear all
            </Button>
          )}
        </View>
      )}

      <FlatList
        data={journeys}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <List.Item
            title={`${item.boardingStationCode} → ${item.deboardingStationCode}`}
            description={`${item.trainNumber} · ${item.trainName} · ${item.distanceKm} km · ${formatPartialDuration(item.durationMinutes)}`}
            left={(p) => <List.Icon {...p} icon="map-marker-path" />}
            right={(p) => <IconButton {...p} icon="close" onPress={() => remove(item.id)} />}
            onPress={() => navigation.navigate('TrainsTab', { screen: 'TrainDetails', params: { trainNumber: item.trainNumber } })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="titleMedium">No saved journeys yet</Text>
            <Text style={styles.emptyDescription}>
              Open a train, tap "Plan a partial journey," pick your boarding and de-boarding stops, then save it here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  clearRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', padding: 8, gap: 4 },
  confirmText: { marginRight: 4 },
  empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 },
  emptyDescription: { textAlign: 'center', opacity: 0.6, marginTop: 8 },
});
