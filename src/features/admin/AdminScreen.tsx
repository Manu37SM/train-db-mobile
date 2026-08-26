import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Button, Card, IconButton, List, Text, TextInput } from 'react-native-paper';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clearCache, getAdminStats, getDatasetHealth, triggerImport } from './api';
import { useAdminKeyStore } from './store';
import { StatCard } from '@/components/StatCard';
import type { DatasetHealthResponse } from '@/types/api';
const HEALTH_CHECKS: {
  key: keyof DatasetHealthResponse & string;
  samplesKey: keyof DatasetHealthResponse & string;
  label: string;
}[] = [
  {
    key: 'duplicateScheduleRowCount',
    samplesKey: 'duplicateScheduleRowSamples',
    label: 'Duplicate schedule rows',
  },
  { key: 'missingTimingCount', samplesKey: 'missingTimingSamples', label: 'Missing timings' },
  {
    key: 'distanceInconsistencyCount',
    samplesKey: 'distanceInconsistencySamples',
    label: 'Distance inconsistencies',
  },
  { key: 'impossibleSpeedCount', samplesKey: 'impossibleSpeedSamples', label: 'Impossible speeds' },
  { key: 'haltAnomalyCount', samplesKey: 'haltAnomalySamples', label: 'Halt anomalies' },
  { key: 'orphanStationCount', samplesKey: 'orphanStationSamples', label: 'Orphan stations' },
  { key: 'invalidRouteCount', samplesKey: 'invalidRouteSamples', label: 'Invalid routes' },
];
export default function AdminScreen() {
  const { key, hydrated, hydrate, setKey, clearKey } = useAdminKeyStore();
  const [input, setInput] = useState('');
  const [confirmingImport, setConfirmingImport] = useState(false);
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);
  const statsQuery = useQuery({
    queryKey: ['admin', 'stats', key],
    queryFn: () => getAdminStats(key!),
    enabled: !!key,
  });
  const healthQuery = useQuery({
    queryKey: ['admin', 'health', key],
    queryFn: () => getDatasetHealth(key!),
    enabled: !!key,
  });
  const clearCacheMutation = useMutation({
    mutationFn: () => clearCache(key!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });
  const importMutation = useMutation({
    mutationFn: () => triggerImport(key!),
    onSuccess: (result) => {
      setConfirmingImport(false);
      if (result.success) queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: () => setConfirmingImport(false),
  });
  if (!key) {
    return (
      <View style={styles.container}>
        <TextInput
          label="Admin key"
          value={input}
          onChangeText={setInput}
          secureTextEntry
          style={styles.input}
        />
        <Button mode="contained" onPress={() => setKey(input)}>
          Unlock admin portal
        </Button>
      </View>
    );
  }
  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text variant="titleLarge">Admin Portal</Text>
        <Button icon="logout" compact onPress={() => clearKey()}>
          Forget key
        </Button>
      </View>

      {statsQuery.error && (
        <Text style={styles.errorText}>Could not load admin stats. Check the admin key.</Text>
      )}

      {statsQuery.data && (
        <View style={styles.grid}>
          <StatCard label="Total trains" value={statsQuery.data.totalTrains} />
          <StatCard label="Total stations" value={statsQuery.data.totalStations} />
          <StatCard label="Schedule rows" value={statsQuery.data.totalScheduleRows} />
        </View>
      )}

      <Card style={styles.card}>
        <Card.Title
          title="Import railway dataset"
          subtitle="Re-reads the bundled CSV and replaces schedule data. Cannot be undone."
          subtitleNumberOfLines={2}
          right={(props) => (
            <IconButton
              {...props}
              icon="refresh"
              onPress={() => queryClient.invalidateQueries({ queryKey: ['admin', 'stats', key] })}
            />
          )}
        />
        <Card.Content>
          {confirmingImport ? (
            <View style={styles.confirmRow}>
              <Text style={styles.confirmText}>
                Run the import now? This will overwrite existing schedule data.
              </Text>
              <View style={styles.confirmButtons}>
                <Button
                  mode="contained"
                  buttonColor="#dc2626"
                  loading={importMutation.isPending}
                  disabled={importMutation.isPending}
                  onPress={() => importMutation.mutate()}
                >
                  Confirm import
                </Button>
                <Button
                  disabled={importMutation.isPending}
                  onPress={() => setConfirmingImport(false)}
                >
                  Cancel
                </Button>
              </View>
            </View>
          ) : (
            <Button mode="contained" onPress={() => setConfirmingImport(true)}>
              Run import
            </Button>
          )}

          {importMutation.isError && (
            <Text style={styles.errorText}>Import failed. Please try again.</Text>
          )}

          {importMutation.data && (
            <View
              style={[
                styles.resultBox,
                importMutation.data.success ? styles.resultSuccess : styles.resultFailure,
              ]}
            >
              <Text
                style={
                  importMutation.data.success ? styles.resultSuccessText : styles.resultFailureText
                }
              >
                {importMutation.data.message}
                {'\n'}
                {importMutation.data.rowsImported} imported, {importMutation.data.rowsFailed} failed
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {healthQuery.data && (
        <Card style={styles.card}>
          <Card.Title
            title={`Dataset Health — ${healthQuery.data.totalIssues} issue${healthQuery.data.totalIssues === 1 ? '' : 's'}`}
          />
          <Card.Content>
            {HEALTH_CHECKS.map(({ key: countKey, samplesKey, label }) => {
              const count = healthQuery.data![countKey] as number;
              const samples = healthQuery.data![samplesKey] as string[];
              return (
                <List.Accordion key={countKey} title={label} description={`${count} found`}>
                  {samples.length === 0 ? (
                    <Text style={styles.noIssues}>None found.</Text>
                  ) : (
                    samples.map((s, i) => <List.Item key={i} title={s} />)
                  )}
                </List.Accordion>
              );
            })}
          </Card.Content>
        </Card>
      )}

      <Button
        mode="outlined"
        loading={clearCacheMutation.isPending}
        onPress={() => clearCacheMutation.mutate()}
        style={styles.button}
      >
        Clear cache
      </Button>
      {clearCacheMutation.isSuccess && <Text style={styles.successText}>Cache cleared.</Text>}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: { marginBottom: 12 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  card: { marginBottom: 12 },
  noIssues: { padding: 12, opacity: 0.6 },
  button: { marginVertical: 12 },
  errorText: { color: '#dc2626', marginBottom: 8 },
  successText: { color: '#16a34a', marginBottom: 12 },
  confirmRow: { gap: 8 },
  confirmText: { fontSize: 13 },
  confirmButtons: { flexDirection: 'row', gap: 8 },
  resultBox: { marginTop: 12, padding: 10, borderRadius: 8 },
  resultSuccess: { backgroundColor: '#dcfce7' },
  resultFailure: { backgroundColor: '#fee2e2' },
  resultSuccessText: { color: '#166534' },
  resultFailureText: { color: '#991b1b' },
});
