import React from 'react';
import { Linking, ScrollView, View, StyleSheet } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';
import { API_BASE_URL } from '@/config/env';

interface Endpoint {
  method: string;
  path: string;
  description: string;
  example: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/trains/search?q={query}',
    description: 'Search trains by number or name. Falls back to a typo-tolerant fuzzy match if there are no exact results.',
    example: `${API_BASE_URL}/trains/search?q=rajdhani`,
  },
  {
    method: 'GET',
    path: '/trains/{trainNumber}',
    description: 'Full route for one train: every stop with arrival/departure time, distance, and halt duration.',
    example: `${API_BASE_URL}/trains/12301`,
  },
  {
    method: 'GET',
    path: '/stations/search?q={query}',
    description: 'Search stations by code or name, same fuzzy-match fallback as train search.',
    example: `${API_BASE_URL}/stations/search?q=new+delhi`,
  },
  {
    method: 'GET',
    path: '/stations/{stationCode}',
    description: "A station's originating, terminating, and passing-through trains, with arrival/departure times.",
    example: `${API_BASE_URL}/stations/NDLS`,
  },
  {
    method: 'GET',
    path: '/journeys?from={code}&to={code}',
    description: 'Every direct train between two stations, sorted fastest-first, with distance and duration for each.',
    example: `${API_BASE_URL}/journeys?from=NDLS&to=HWH`,
  },
  {
    method: 'GET',
    path: '/stats',
    description: 'Dataset-wide statistics: total trains/stations, longest/shortest routes, fastest/slowest trains, and busiest stations.',
    example: `${API_BASE_URL}/stats`,
  },
];

const SWAGGER_URL = `${API_BASE_URL.replace(/\/api\/v1\/?$/, '')}/swagger-ui.html`;

/**
 * Mobile port of train-db-frontend's /developers page - same public
 * read-only REST API this app itself calls, same endpoint list. Reachable
 * from the footer on web (low-traffic page); here it's one tap from
 * Account, matching that "secondary navigation" placement rather than
 * cluttering a primary tab.
 */
export default function DevelopersScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text variant="titleLarge">Developers</Text>
      <Text style={styles.intro}>
        RailLens's train/station/journey search data is available as a public, read-only REST API — the same one this
        app itself calls.
      </Text>

      <View style={styles.infoRow}>
        <Chip icon="link-variant" style={styles.infoChip}>
          {API_BASE_URL}
        </Chip>
        <Chip icon="key-outline" style={styles.infoChip}>
          No auth required for reads
        </Chip>
        <Chip icon="speedometer" style={styles.infoChip}>
          120 req/min per IP
        </Chip>
      </View>

      <Text style={styles.swaggerLink} onPress={() => Linking.openURL(SWAGGER_URL)}>
        Open the full OpenAPI/Swagger spec →
      </Text>

      <Text variant="titleMedium" style={styles.endpointsTitle}>
        Endpoints
      </Text>

      {ENDPOINTS.map((endpoint) => (
        <Card key={endpoint.path} style={styles.card}>
          <Card.Content>
            <View style={styles.methodRow}>
              <Chip compact style={styles.methodChip}>
                {endpoint.method}
              </Chip>
              <Text style={styles.path}>{endpoint.path}</Text>
            </View>
            <Text style={styles.description}>{endpoint.description}</Text>
            <Text style={styles.example} onPress={() => Linking.openURL(endpoint.example)}>
              {endpoint.example}
            </Text>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  intro: { opacity: 0.7 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  infoChip: { marginBottom: 4 },
  swaggerLink: { color: '#2563eb', marginTop: 4 },
  endpointsTitle: { marginTop: 8 },
  card: { marginBottom: 8 },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  methodChip: { backgroundColor: '#dcfce7' },
  path: { fontFamily: 'monospace', fontWeight: '600' },
  description: { opacity: 0.7, marginBottom: 8 },
  example: { fontFamily: 'monospace', fontSize: 12, color: '#2563eb' },
});
