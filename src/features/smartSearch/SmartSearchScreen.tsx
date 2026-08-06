import React, { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { ActivityIndicator, Button, Chip, List, Text, TextInput } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { smartSearch } from './api';

// Mirrors train-db-frontend's SmartSearchClient EXAMPLES list exactly (same
// four example queries) - mobile only had a static, non-interactive hint
// line, no tappable shortcuts, reported 2026-08-06 as a gap vs. the website.
// Tapping one both fills the input and runs the search immediately, same
// one-tap behavior as web's example chips.
const EXAMPLES = [
  'trains that stop at both NDLS and HWH',
  'trains from NDLS to HWH',
  'trains longer than 1000km',
  'trains with more than 20 halts',
];

/**
 * Mirrors train-db-frontend's /smart-search page - same fixed query
 * grammar (see FEATURE.md "Smart Search"), same endpoint, no client-side
 * NLP duplication. `recognized` distinguishes "understood the query but
 * found zero matches" from "couldn't parse this query at all" - the
 * backend's SmartSearchResponse (not `query`/`interpretation`, an earlier
 * pass here guessed those field names wrong).
 */
// Defensive cap, same reasoning as AchievementsScreen's PREVIEW_COUNT and
// web's SmartSearchClient: the backend already limits this, but a loosely-
// matching query ("trains longer than 20 hours") is exactly the kind of
// thing that could return a large slice of the ~14,000-train dataset.
// Rendering that unbounded into a ScrollView on a phone (much less headroom
// than a desktop browser tab) is worth guarding against directly.
const PREVIEW_COUNT = 50;

export default function SmartSearchScreen() {
  const navigation = useNavigation<any>();
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState('');

  const { data, isFetching, isError } = useQuery({
    queryKey: ['smart-search', submitted],
    queryFn: () => smartSearch(submitted),
    enabled: submitted.trim().length > 0,
  });

  return (
    <ScrollView style={styles.container}>
      <Text variant="titleMedium" style={styles.hint}>
        Try: "Trains that stop at both NDLS and HWH" or "Trains longer than 20 hours"
      </Text>
      <TextInput
        label="Ask about trains or routes"
        value={input}
        onChangeText={setInput}
        onSubmitEditing={() => setSubmitted(input)}
        style={styles.input}
      />
      <Button mode="contained" onPress={() => setSubmitted(input)}>
        Search
      </Button>

      <View style={styles.exampleRow}>
        {EXAMPLES.map((example) => (
          <Chip
            key={example}
            style={styles.exampleChip}
            onPress={() => {
              setInput(example);
              setSubmitted(example);
            }}
          >
            {example}
          </Chip>
        ))}
      </View>

      {isFetching && <ActivityIndicator style={styles.loader} />}
      {isError && <Text style={styles.error}>Something went wrong. Please try again.</Text>}

      {data && !data.recognized && (
        <Text style={styles.error}>Couldn't understand that query. Try one of the phrasings above.</Text>
      )}

      {data && data.recognized && (
        <View style={styles.results}>
          {data.interpretedAs && <Text style={styles.interpretation}>{data.interpretedAs}</Text>}
          <Text style={styles.matchCount}>
            {data.matchCount} match{data.matchCount === 1 ? '' : 'es'}
          </Text>
          {data.trains.slice(0, PREVIEW_COUNT).map((t) => (
            <List.Item
              key={t.trainNumber}
              title={t.trainNumber}
              description={t.trainName}
              onPress={() => navigation.navigate('TrainsTab', { screen: 'TrainDetails', params: { trainNumber: t.trainNumber } })}
            />
          ))}
          {data.trains.length > PREVIEW_COUNT && (
            <Text style={styles.matchCount}>
              Showing {PREVIEW_COUNT} of {data.trains.length}. Try a more specific query to narrow this down.
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  hint: { marginBottom: 8, opacity: 0.7 },
  input: { marginBottom: 8 },
  exampleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  exampleChip: { marginBottom: 4 },
  loader: { marginTop: 16 },
  error: { marginTop: 16, opacity: 0.7 },
  results: { marginTop: 16 },
  interpretation: { fontStyle: 'italic', marginBottom: 4 },
  matchCount: { opacity: 0.6, marginBottom: 8, fontSize: 12 },
});
