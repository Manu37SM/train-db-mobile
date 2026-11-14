import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, DataTable, HelperText, Text } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import {
  cancelBooking,
  cancellationQuote,
  getBooking,
  getRun,
  paymentIntent,
  paySimulated,
} from './api';
import { isAllowedCheckoutUrl, newIdempotencyKey, paymentMode } from './config';
import { CLASS_NAMES, formatInr, formatIst, STATUS_LABELS } from './format';
import { getTrainDetails } from '@/features/trains/api';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/apiError';
import { BRAND } from '@/theme/theme';
import type { BookingView, CancellationView } from './types';

/** After paying, the status changes a few seconds later (payment → event → booking). Poll this long, then stop. */
export const POLL_INTERVAL_MS = 2000;
export const POLL_LIMIT = 20;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function useSecondsLeft(until: string | null | undefined): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [until]);
  return until ? Math.max(0, Math.floor((new Date(until).getTime() - now) / 1000)) : null;
}

/** Used in both the Trains and Account stacks. */
export default function BookingScreen({ route }: { route: { params: { pnr: string } } }) {
  const { pnr } = route.params;
  const [booking, setBooking] = useState<BookingView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [quote, setQuote] = useState<CancellationView | null>(null);
  const cancelKey = useRef<string | null>(null);
  const alive = useRef(true);

  const load = useCallback(async () => {
    const b = await getBooking(pnr);
    if (alive.current) setBooking(b);
    return b;
  }, [pnr]);

  useEffect(() => {
    alive.current = true;
    load().catch(
      (e) => alive.current && setError(getApiErrorMessage(e, 'Couldn’t load this booking.')),
    );
    return () => {
      alive.current = false;
    };
  }, [load]);

  const run = useQuery({
    queryKey: ['booking', 'run', booking?.trainRunId],
    queryFn: () => getRun(booking!.trainRunId),
    enabled: !!booking,
  });
  // Station names from RailLens' public route data; codes are shown if it can't be reached.
  const names = useQuery({
    queryKey: ['trains', run.data?.trainNo],
    queryFn: () => getTrainDetails(run.data!.trainNo),
    enabled: !!run.data,
  });
  const nameOf = (code: string) =>
    names.data?.route.find((s) => s.stationCode === code)?.stationName ?? code;

  // Razorpay mode: payment happens in the browser. When the person comes back to the app, check the booking.
  const sentToGateway = useRef(false);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && sentToGateway.current) {
        sentToGateway.current = false;
        void waitForStatusChange();
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const secondsLeft = useSecondsLeft(
    booking?.status === 'PENDING_PAYMENT' ? booking.holdExpiresAt : null,
  );

  async function waitForStatusChange() {
    setWaiting(true);
    try {
      for (let i = 0; i < POLL_LIMIT && alive.current; i++) {
        await sleep(POLL_INTERVAL_MS);
        if ((await load()).status !== 'PENDING_PAYMENT') return;
      }
      setError(
        'Payment is taking longer than usual. Pull down or come back in a minute to see the result.',
      );
    } finally {
      setWaiting(false);
    }
  }

  async function pay(outcome: 'SUCCESS' | 'FAILURE') {
    setError(null);
    setBusy(true);
    try {
      if (paymentMode() === 'razorpay') {
        await payAtGateway();
        return;
      }
      await paySimulated(pnr, outcome);
      if (outcome === 'FAILURE') {
        // A failed payment doesn't change the booking: RailOps keeps the seats held so the passenger can retry.
        // Waiting for a status change here would time out with a misleading "taking longer" message.
        await load();
        setError(
          'The payment failed (simulated). Your seats are still held: you can pay again before the hold runs out.',
        );
        return;
      }
      await waitForStatusChange();
    } catch (e) {
      if (getApiErrorCode(e) === 'RES_SIMULATED_PAYMENTS_OFF') {
        await payAtGateway();
      } else {
        setError(getApiErrorMessage(e, 'Payment didn’t start. Please try again.'));
      }
    } finally {
      setBusy(false);
    }
  }

  /** A real payment gateway (not in the demo): open its checkout only on an allow-listed https host. */
  async function payAtGateway() {
    const intent = await paymentIntent(pnr);
    if (!isAllowedCheckoutUrl(intent.checkoutUrl)) {
      setError(
        'The payment page address looked wrong, so we didn’t open it. Please contact support.',
      );
      return;
    }
    sentToGateway.current = true;
    await Linking.openURL(intent.checkoutUrl);
  }

  async function showCancel() {
    setError(null);
    setBusy(true);
    try {
      setQuote(await cancellationQuote(pnr));
    } catch (e) {
      setError(getApiErrorMessage(e, 'Couldn’t check the refund. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  async function confirmCancel() {
    setError(null);
    setBusy(true);
    cancelKey.current ??= newIdempotencyKey(); // a retry never asks for a second refund
    try {
      await cancelBooking(pnr, cancelKey.current);
      setQuote(null);
      await load();
    } catch (e) {
      setError(getApiErrorMessage(e, 'Cancellation failed. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  if (!booking) {
    return (
      <View style={styles.container}>
        {error ? (
          <HelperText type="error" visible>
            {error}
          </HelperText>
        ) : (
          <Text>Loading…</Text>
        )}
      </View>
    );
  }

  const fromStop = run.data?.stops.find((s) => s.seq === booking.fromSeq);
  const toStop = run.data?.stops.find((s) => s.seq === booking.toSeq);
  const payable = booking.status === 'PENDING_PAYMENT' && (secondsLeft ?? 1) > 0;
  const cancellable = ['PENDING_PAYMENT', 'CONFIRMED', 'PARTIALLY_CANCELLED'].includes(
    booking.status,
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="labelMedium">PNR</Text>
      <Text variant="headlineSmall" selectable style={styles.pnr}>
        {booking.pnr}
      </Text>
      <Text variant="titleMedium" testID="booking-status">
        {STATUS_LABELS[booking.status] ?? booking.status}
      </Text>

      <View style={styles.block}>
        <Text>
          Train {run.data?.trainNo ?? '…'} on {booking.runDate}
        </Text>
        {fromStop && toStop && (
          <Text>
            {nameOf(fromStop.stationCode)} ({formatIst(fromStop.departure)}) →{' '}
            {nameOf(toStop.stationCode)} ({formatIst(toStop.arrival)})
          </Text>
        )}
        <Text>
          {CLASS_NAMES[booking.classCode] ?? booking.classCode} ({booking.classCode})
        </Text>
        <Text variant="titleMedium" style={styles.fare}>
          Fare {formatInr(booking.totalFare)}
        </Text>
      </View>

      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Passenger</DataTable.Title>
          <DataTable.Title numeric>Age</DataTable.Title>
          <DataTable.Title>Status</DataTable.Title>
        </DataTable.Header>
        {booking.passengers.map((p) => (
          <DataTable.Row key={p.seqNo}>
            <DataTable.Cell>{p.name}</DataTable.Cell>
            <DataTable.Cell numeric>{p.age}</DataTable.Cell>
            <DataTable.Cell>{p.currentStatus}</DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>

      {payable && (
        <Card style={styles.block}>
          <Card.Content>
            <Text>
              Seats held for {Math.floor((secondsLeft ?? 0) / 60)}:
              {String((secondsLeft ?? 0) % 60).padStart(2, '0')}.{' '}
              {paymentMode() === 'razorpay'
                ? 'You’ll pay on Razorpay’s page in test mode (test card or UPI ID, no real money), then come back here.'
                : 'This is a demo: the payment is simulated and no money moves.'}
            </Text>
            <Button
              mode="contained"
              buttonColor={BRAND.accent}
              style={styles.button}
              loading={waiting}
              disabled={busy || waiting}
              onPress={() => pay('SUCCESS')}
            >
              {waiting
                ? 'Confirming…'
                : paymentMode() === 'razorpay'
                  ? `Pay ${formatInr(booking.totalFare)} on Razorpay (test)`
                  : `Pay ${formatInr(booking.totalFare)} (simulated)`}
            </Button>
            {paymentMode() === 'simulated' && (
              <Button disabled={busy || waiting} onPress={() => pay('FAILURE')}>
                Try a failed payment
              </Button>
            )}
          </Card.Content>
        </Card>
      )}

      {booking.status === 'PENDING_PAYMENT' && !payable && (
        <Text style={styles.block}>
          The seat hold has run out. Book again from the train’s page.
        </Text>
      )}

      {cancellable && !quote && (
        <Button
          textColor="#dc2626"
          disabled={busy || waiting}
          onPress={showCancel}
          style={styles.block}
        >
          Cancel booking…
        </Button>
      )}

      {quote && (
        <Card style={styles.block}>
          <Card.Content>
            <Text>
              Cancel the whole booking? Paid {formatInr(quote.totalPaid)}, charge{' '}
              {formatInr(quote.totalCharge)}, refund {formatInr(quote.refundAmount)} (simulated).
            </Text>
            <Button
              mode="contained"
              buttonColor="#dc2626"
              style={styles.button}
              loading={busy}
              disabled={busy}
              onPress={confirmCancel}
            >
              Yes, cancel
            </Button>
            <Button disabled={busy} onPress={() => setQuote(null)}>
              Keep it
            </Button>
          </Card.Content>
        </Card>
      )}

      {error && (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 48 },
  pnr: { fontFamily: 'monospace', letterSpacing: 2 },
  block: { marginTop: 16 },
  fare: { marginTop: 8 },
  button: { marginTop: 12 },
});
