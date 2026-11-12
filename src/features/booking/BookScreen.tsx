import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Checkbox,
  HelperText,
  IconButton,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createBooking, getRun } from './api';
import { newIdempotencyKey } from './config';
import {
  CLASS_NAMES,
  formatIst,
  MAX_PASSENGERS,
  PassengerRow,
  PHONE_PATTERN,
  validatePassengers,
} from './format';
import { getApiErrorMessage } from '@/lib/apiError';
import { AuthFailure } from '@/lib/apiError';
import { useAuthStore } from '@/store/authStore';
import { BRAND } from '@/theme/theme';
import type { TrainsStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<TrainsStackParamList, 'Book'>;
const EMPTY: PassengerRow = { name: '', age: '', gender: '' };

export default function BookScreen({ route, navigation }: Props) {
  const { runId, fromSeq, toSeq, travelClass } = route.params;
  const email = useAuthStore((s) => s.session?.email ?? '');
  const run = useQuery({ queryKey: ['booking', 'run', runId], queryFn: () => getRun(runId) });
  const [passengers, setPassengers] = useState<PassengerRow[]>([{ ...EMPTY }]);
  const [phone, setPhone] = useState('');
  const [contactEmail, setContactEmail] = useState(email);
  const [onlyIfConfirmed, setOnlyIfConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One key per attempt: a retry after a timeout returns the same booking instead of a second one.
  const attemptKey = useRef<string | null>(null);

  const fromStop = run.data?.stops.find((s) => s.seq === fromSeq);
  const toStop = run.data?.stops.find((s) => s.seq === toSeq);

  function update(i: number, patch: Partial<PassengerRow>) {
    attemptKey.current = null; // changed details = a new attempt
    setPassengers((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  async function submit() {
    const problem =
      validatePassengers(passengers) ??
      (PHONE_PATTERN.test(phone.trim()) ? null : 'Enter a mobile number of 10 to 16 digits.');
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setSubmitting(true);
    attemptKey.current ??= newIdempotencyKey();
    try {
      const booking = await createBooking(
        {
          trainRunId: runId,
          fromStopSeq: fromSeq,
          toStopSeq: toSeq,
          travelClass,
          quota: 'GN',
          passengers: passengers.map((p) => ({
            name: p.name.trim(),
            age: Number(p.age),
            gender: p.gender as 'M' | 'F' | 'T',
          })),
          onlyIfConfirmed,
          contactPhone: phone.trim(),
          contactEmail: contactEmail.trim() || null,
        },
        attemptKey.current,
      );
      navigation.replace('Booking', { pnr: booking.pnr });
    } catch (e) {
      if (
        e instanceof AuthFailure &&
        e.status >= 400 &&
        e.status < 500 &&
        e.code !== 'IDEM_IN_PROGRESS'
      ) {
        attemptKey.current = null; // refused for good: the next try is a new attempt
      }
      setError(getApiErrorMessage(e, 'Booking failed. Please try again.'));
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text variant="titleLarge">Train {run.data?.trainNo ?? route.params.trainNo}</Text>
      {fromStop && toStop && (
        <Text style={styles.sub}>
          {fromStop.stationCode} ({formatIst(fromStop.departure)}) → {toStop.stationCode} (
          {formatIst(toStop.arrival)})
        </Text>
      )}
      <Text style={styles.sub}>
        {CLASS_NAMES[travelClass]} ({travelClass}), general quota
      </Text>

      <Text variant="titleMedium" style={styles.section}>
        Passengers
      </Text>
      {passengers.map((p, i) => (
        <View key={i} style={styles.passenger}>
          <View style={styles.passengerHead}>
            <Text variant="labelLarge">Passenger {i + 1}</Text>
            {passengers.length > 1 && (
              <IconButton
                icon="delete-outline"
                accessibilityLabel={`Remove passenger ${i + 1}`}
                onPress={() => setPassengers((rows) => rows.filter((_, j) => j !== i))}
              />
            )}
          </View>
          <TextInput
            label="Name"
            value={p.name}
            maxLength={60}
            onChangeText={(t) => update(i, { name: t })}
            style={styles.input}
          />
          <TextInput
            label="Age"
            value={p.age}
            keyboardType="number-pad"
            onChangeText={(t) => update(i, { age: t.replace(/\D/g, '').slice(0, 3) })}
            style={styles.input}
          />
          <SegmentedButtons
            value={p.gender}
            onValueChange={(v) => update(i, { gender: v as PassengerRow['gender'] })}
            buttons={[
              { value: 'F', label: 'Female' },
              { value: 'M', label: 'Male' },
              { value: 'T', label: 'Trans' },
            ]}
          />
        </View>
      ))}
      {passengers.length < MAX_PASSENGERS && (
        <Button icon="plus" onPress={() => setPassengers((rows) => [...rows, { ...EMPTY }])}>
          Add passenger
        </Button>
      )}

      <Text variant="titleMedium" style={styles.section}>
        Contact for this trip
      </Text>
      <TextInput
        label="Mobile number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        style={styles.input}
      />
      <TextInput
        label="Email (optional)"
        keyboardType="email-address"
        autoCapitalize="none"
        value={contactEmail}
        onChangeText={setContactEmail}
        style={styles.input}
      />
      <Checkbox.Item
        label="Book only if every passenger gets a confirmed berth"
        status={onlyIfConfirmed ? 'checked' : 'unchecked'}
        onPress={() => setOnlyIfConfirmed((v) => !v)}
      />

      {error && (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      )}
      <Button
        mode="contained"
        buttonColor={BRAND.accent}
        onPress={submit}
        loading={submitting}
        disabled={submitting}
        style={styles.button}
      >
        Hold seats for 10 minutes
      </Button>
      <Text variant="bodySmall" style={styles.sub}>
        You’ll see the fare and pay on the next screen.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  sub: { opacity: 0.75, marginTop: 2 },
  section: { marginTop: 20, marginBottom: 8 },
  passenger: { marginBottom: 16 },
  passengerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { marginBottom: 8 },
  button: { marginTop: 16, marginBottom: 8 },
});
