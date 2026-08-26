import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  IconButton,
  Text,
  TextInput,
  TouchableRipple,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { compareTrains, getTrainDetails, getTrainIntelligence } from './api';
import { useFavoritesStore } from '@/features/favorites/store';
import { usePopularityStore } from '@/features/home/popularityStore';
import { useSavedJourneysStore } from '@/features/savedJourneys/store';
import { computePartialJourney, formatPartialDuration } from '@/lib/partialJourney';
import { toCsv } from '@/lib/csvExport';
import ExportButton from '@/components/ExportButton';
import ShareButton from '@/components/ShareButton';
import type { RouteStopResponse } from '@/types/api';
import type { TrainsStackParamList } from '@/navigation/types';
type Props = NativeStackScreenProps<TrainsStackParamList, 'TrainDetails'>;
function formatDuration(minutes: number | null): string {
  if (minutes == null) return '—';
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
export default function TrainDetailsScreen({ route }: Props) {
  const { trainNumber } = route.params;
  const navigation = useNavigation<any>();
  const favorites = useFavoritesStore();
  const isFavorite = favorites.trains.includes(trainNumber);
  const recordTrainView = usePopularityStore((s) => s.recordTrainView);
  const savedJourneys = useSavedJourneysStore();
  const [compareWith, setCompareWith] = useState('');
  const [compareTarget, setCompareTarget] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [boardStop, setBoardStop] = useState<RouteStopResponse | null>(null);
  const [deboardStop, setDeboardStop] = useState<RouteStopResponse | null>(null);
  const detailsQuery = useQuery({
    queryKey: ['trains', trainNumber],
    queryFn: () => getTrainDetails(trainNumber),
  });
  const intelligenceQuery = useQuery({
    queryKey: ['trains', trainNumber, 'intelligence'],
    queryFn: () => getTrainIntelligence(trainNumber),
  });
  const comparisonQuery = useQuery({
    queryKey: ['trains', trainNumber, 'compare', compareTarget],
    queryFn: () => compareTrains(trainNumber, compareTarget!),
    enabled: !!compareTarget,
  });
  useEffect(() => {
    if (detailsQuery.data) {
      recordTrainView(detailsQuery.data.trainNumber, detailsQuery.data.trainName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailsQuery.data?.trainNumber]);
  function toggleSelectMode() {
    setSelectMode((prev) => !prev);
    setBoardStop(null);
    setDeboardStop(null);
  }
  function handleSelectStop(stop: RouteStopResponse) {
    if (!boardStop) {
      setBoardStop(stop);
      return;
    }
    if (!deboardStop) {
      if (stop.sequenceNo === boardStop.sequenceNo) {
        setBoardStop(null);
        return;
      }
      setDeboardStop(stop);
      return;
    }
    setBoardStop(stop);
    setDeboardStop(null);
  }
  if (detailsQuery.isLoading) return <ActivityIndicator style={styles.loader} />;
  if (detailsQuery.isError || !detailsQuery.data) {
    return <Text style={styles.error}>Could not load this train.</Text>;
  }
  const train = detailsQuery.data;
  const segment = boardStop && deboardStop ? computePartialJourney(boardStop, deboardStop) : null;
  const [orderedFrom, orderedTo] =
    boardStop && deboardStop
      ? boardStop.sequenceNo <= deboardStop.sequenceNo
        ? [boardStop, deboardStop]
        : [deboardStop, boardStop]
      : [null, null];
  const alreadySaved =
    orderedFrom && orderedTo
      ? savedJourneys.isSaved(trainNumber, orderedFrom.stationCode, orderedTo.stationCode)
      : false;
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleLarge">
          {train.trainNumber} · {train.trainName}
        </Text>
        <View style={styles.headerActions}>
          <ShareButton
            title={`${train.trainNumber} · ${train.trainName}`}
            text={`${train.sourceStationName} → ${train.destinationStationName} on RailLens`}
            path={`/trains/${train.trainNumber}`}
          />
          <IconButton
            icon={isFavorite ? 'star' : 'star-outline'}
            onPress={() => favorites.toggleTrain(trainNumber)}
          />
        </View>
      </View>
      <Text style={styles.subtitle}>
        {train.sourceStationName} → {train.destinationStationName}
      </Text>
      <View style={styles.statChips}>
        <Chip compact>{train.journeyDistance ?? '—'} km</Chip>
        <Chip compact>{formatDuration(train.journeyMinutes)}</Chip>
        <Chip compact>{train.totalStops} stops</Chip>
        <Chip compact>{train.averageSpeed ?? '—'} km/h avg</Chip>
      </View>

      {intelligenceQuery.data && (
        <Card style={styles.card}>
          <Card.Title title="Train Intelligence" />
          <Card.Content>
            <Text>Route complexity: {intelligenceQuery.data.routeComplexityScore.toFixed(2)}</Text>
            <Text>Uniqueness: {intelligenceQuery.data.trainUniquenessScore.toFixed(2)}</Text>
            <Text>
              Expressness: {intelligenceQuery.data.expressnessScoreKmPerHalt.toFixed(1)} km/halt
            </Text>
            <Text>Night travel: {intelligenceQuery.data.nightTravelPercent.toFixed(1)}%</Text>
            <Text>Day travel: {intelligenceQuery.data.dayTravelPercent.toFixed(1)}%</Text>
            {intelligenceQuery.data.longestNonStopSegmentKm != null && (
              <Text>
                Longest non-stop segment: {intelligenceQuery.data.longestNonStopSegmentKm} km (
                {intelligenceQuery.data.longestNonStopSegmentFromStation} →{' '}
                {intelligenceQuery.data.longestNonStopSegmentToStation})
              </Text>
            )}
            <Text>Average halt: {intelligenceQuery.data.averageHaltMinutes.toFixed(1)} min</Text>
            <Text>
              Journey efficiency index: {intelligenceQuery.data.journeyEfficiencyIndex.toFixed(2)}
            </Text>
            {intelligenceQuery.data.isCircularRoute && <Text>Circular route</Text>}
            {intelligenceQuery.data.possiblySkippedStations.length > 0 && (
              <Text>
                Possibly skipped: {intelligenceQuery.data.possiblySkippedStations.join(', ')}
              </Text>
            )}
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Title title="Compare with another train" />
        <Card.Content>
          <TextInput
            label="Other train number"
            value={compareWith}
            onChangeText={setCompareWith}
            keyboardType="number-pad"
            style={styles.compareInput}
          />
          <Button
            mode="contained-tonal"
            onPress={() => setCompareTarget(compareWith.trim())}
            disabled={!compareWith.trim()}
          >
            Compare routes
          </Button>

          {comparisonQuery.isFetching && <ActivityIndicator style={styles.loader} />}
          {comparisonQuery.data && (
            <View style={styles.compareResult}>
              <Text>
                Route similarity: {comparisonQuery.data.routeSimilarityPercent.toFixed(1)}%
              </Text>
              <Text>Shared stations: {comparisonQuery.data.sharedStationCount}</Text>
              <Text>Divergence point: {comparisonQuery.data.divergencePoint ?? '—'}</Text>
              <Text>Convergence point: {comparisonQuery.data.convergencePoint ?? '—'}</Text>
              <Text>Reverse route: {comparisonQuery.data.isReverseRoute ? 'Yes' : 'No'}</Text>
              <Text>Same route: {comparisonQuery.data.isSameRoute ? 'Yes' : 'No'}</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title
          title="Journey Timetable"
          right={() => (
            <View style={styles.timetableActions}>
              <ExportButton
                filename={`${train.trainNumber}_timetable`}
                csv={toCsv(train.route, [
                  { key: 'sequenceNo', header: 'Seq' },
                  { key: 'stationCode', header: 'Station Code' },
                  { key: 'stationName', header: 'Station Name' },
                  { key: 'arrivalTime', header: 'Arrival' },
                  { key: 'departureTime', header: 'Departure' },
                  { key: 'haltMinutes', header: 'Halt (min)' },
                  { key: 'journeyDay', header: 'Day' },
                  { key: 'distance', header: 'Distance (km)' },
                ])}
              />
              <Button
                compact
                mode={selectMode ? 'contained-tonal' : 'outlined'}
                onPress={toggleSelectMode}
                style={styles.selectModeButton}
              >
                {selectMode ? 'Selecting…' : 'Plan a partial journey'}
              </Button>
            </View>
          )}
        />
        <Card.Content>
          {selectMode && !boardStop && <Text style={styles.hint}>Tap where you'll board.</Text>}
          {selectMode && boardStop && !deboardStop && (
            <Text style={styles.hint}>Now tap where you'll get off.</Text>
          )}

          {segment && orderedFrom && orderedTo && (
            <View style={styles.summaryBar}>
              <Text style={styles.summaryText}>
                {orderedFrom.stationCode} → {orderedTo.stationCode} · {segment.distanceKm} km ·{' '}
                {formatPartialDuration(segment.durationMinutes)}
              </Text>
              <View style={styles.summaryActions}>
                <Button
                  compact
                  icon={alreadySaved ? 'bookmark' : 'bookmark-outline'}
                  onPress={() =>
                    savedJourneys.toggle({
                      trainNumber,
                      trainName: train.trainName,
                      boardingStationCode: orderedFrom.stationCode,
                      boardingStationName: orderedFrom.stationName,
                      deboardingStationCode: orderedTo.stationCode,
                      deboardingStationName: orderedTo.stationName,
                      distanceKm: segment.distanceKm,
                      durationMinutes: segment.durationMinutes,
                    })
                  }
                >
                  {alreadySaved ? 'Saved' : 'Save'}
                </Button>
                <Button
                  compact
                  icon="close"
                  onPress={() => {
                    setBoardStop(null);
                    setDeboardStop(null);
                  }}
                >
                  Clear
                </Button>
              </View>
            </View>
          )}

          {train.route.map((stop, index) => {
            const role =
              boardStop?.sequenceNo === stop.sequenceNo
                ? 'board'
                : deboardStop?.sequenceNo === stop.sequenceNo
                  ? 'deboard'
                  : null;
            const isOrigin = index === 0;
            const isDestination = index === train.route.length - 1;
            return (
              <TouchableRipple
                key={stop.sequenceNo}
                onPress={
                  selectMode
                    ? () => handleSelectStop(stop)
                    : () =>
                        navigation.navigate('StationsTab', {
                          screen: 'StationDetails',
                          params: { stationCode: stop.stationCode },
                        })
                }
                style={[
                  styles.stopRow,
                  role === 'board'
                    ? styles.boardRow
                    : role === 'deboard'
                      ? styles.deboardRow
                      : undefined,
                ]}
              >
                <View style={styles.stopRowInner}>
                  <View style={styles.stopBadge}>
                    {role ? (
                      <IconButton
                        icon={role === 'board' ? 'human-male-board' : 'human-male-board-poll'}
                        size={16}
                        iconColor="#1e293b"
                        style={styles.stopBadgeIcon}
                      />
                    ) : (
                      <Text style={styles.stopBadgeText}>{stop.sequenceNo}</Text>
                    )}
                  </View>

                  <View style={styles.stopMain}>
                    <View style={styles.stopTitleRow}>
                      <Text
                        style={[
                          styles.stopStationCode,
                          role ? styles.stopTextOnLightRow : undefined,
                        ]}
                      >
                        {stop.stationCode}
                      </Text>
                      <Text
                        style={[
                          styles.stopStationName,
                          role ? styles.stopTextOnLightRow : undefined,
                        ]}
                        numberOfLines={1}
                      >
                        {stop.stationName}
                      </Text>
                    </View>

                    <View style={styles.stopBadgeRow}>
                      {isOrigin && (
                        <Chip
                          compact
                          style={styles.originChip}
                          textStyle={[styles.chipText, styles.originChipText]}
                        >
                          Origin
                        </Chip>
                      )}
                      {isDestination && (
                        <Chip
                          compact
                          style={styles.destinationChip}
                          textStyle={[styles.chipText, styles.destinationChipText]}
                        >
                          Destination
                        </Chip>
                      )}
                      {!!stop.haltMinutes && stop.haltMinutes > 0 && (
                        <Chip
                          compact
                          style={styles.haltChip}
                          textStyle={[styles.chipText, styles.haltChipText]}
                        >
                          Halt {stop.haltMinutes}m
                        </Chip>
                      )}
                    </View>

                    <Text style={[styles.stopMeta, role ? styles.stopTextOnLightRow : undefined]}>
                      Arr {stop.arrivalTime ?? '--'} · Dep {stop.departureTime ?? '--'} · Day{' '}
                      {stop.journeyDay} · {stop.distance ?? '--'} km
                    </Text>
                  </View>
                </View>
              </TouchableRipple>
            );
          })}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  timetableActions: { flexDirection: 'row', alignItems: 'center' },
  subtitle: { opacity: 0.7, marginBottom: 8 },
  statChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  card: { marginBottom: 12 },
  loader: { marginTop: 40 },
  error: { textAlign: 'center', marginTop: 40 },
  compareInput: { marginBottom: 8 },
  compareResult: { marginTop: 12 },
  selectModeButton: { marginRight: 8 },
  hint: { opacity: 0.6, fontSize: 12, marginBottom: 8 },
  summaryBar: {
    backgroundColor: '#ffedd5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryText: { flexShrink: 1, color: '#9a3412', fontWeight: '500' },
  summaryActions: { flexDirection: 'row' },
  boardRow: { backgroundColor: '#dcfce7' },
  deboardRow: { backgroundColor: '#fee2e2' },
  stopRow: { borderRadius: 8 },
  stopRowInner: { flexDirection: 'row', gap: 12, paddingVertical: 10, paddingHorizontal: 4 },
  stopBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8882',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBadgeText: { fontSize: 12, fontWeight: '600' },
  stopBadgeIcon: { margin: 0 },
  stopMain: { flex: 1, gap: 2 },
  stopTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  stopStationCode: { fontWeight: '700' },
  stopStationName: { flexShrink: 1, opacity: 0.8 },
  stopBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chipText: { fontSize: 11, lineHeight: 14 },
  originChip: { backgroundColor: '#dcfce7' },
  originChipText: { color: '#166534' },
  destinationChip: { backgroundColor: '#fee2e2' },
  destinationChipText: { color: '#991b1b' },
  haltChip: { backgroundColor: '#dbeafe' },
  haltChipText: { color: '#1e40af' },
  stopTextOnLightRow: { color: '#1e293b' },
  stopMeta: { fontSize: 12, opacity: 0.7, marginTop: 2 },
});
