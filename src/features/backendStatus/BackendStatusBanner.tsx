import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { queryClient } from '@/api/queryClient';
import { BOOKING_ENABLED, LOGIN_PROVIDER } from '@/config/login';
import { useResolvedTheme } from '@/theme/useResolvedTheme';
import { backendStatus } from './monitor';
import { type BackendService, type Tone, bannerContent } from './store';

const TONES: Record<'light' | 'dark', Record<Tone, { bg: string; fg: string; border: string }>> = {
  light: {
    amber: { bg: '#fffbeb', fg: '#78350f', border: '#fcd34d' },
    red: { bg: '#fef2f2', fg: '#7f1d1d', border: '#fca5a5' },
    grey: { bg: '#f1f5f9', fg: '#1e293b', border: '#cbd5e1' },
    green: { bg: '#ecfdf5', fg: '#064e3b', border: '#6ee7b7' },
  },
  dark: {
    amber: { bg: '#451a03', fg: '#fef3c7', border: '#b45309' },
    red: { bg: '#450a0a', fg: '#fee2e2', border: '#991b1b' },
    grey: { bg: '#1e293b', fg: '#e2e8f0', border: '#475569' },
    green: { bg: '#022c22', fg: '#d1fae5', border: '#047857' },
  },
};

/** Away from the app at least this long: check quietly on return (a backend may have slept or crashed). */
export const RETURN_CHECK_AFTER_MS = 2 * 60 * 1000;

/**
 * Shows, for each backend, whether it is waking up (with a countdown), down, unreachable because the phone is
 * offline, or back. Sits at the top of every screen (RootNavigator).
 */
export function BackendStatusBanner() {
  const store = backendStatus();
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const scheme = useResolvedTheme();
  const insets = useSafeAreaInsets();
  const waking = Object.values(snapshot).some((x) => x.phase === 'waking');
  const now = useNow(waking);
  useCheckOnReturn();

  const rows = (Object.keys(snapshot) as BackendService[])
    .map((service) => ({ service, content: bannerContent(service, snapshot[service], now) }))
    .filter((r) => r.content !== null);
  if (rows.length === 0) return null;

  return (
    <View
      style={[styles.wrap, { top: insets.top }]}
      accessibilityLiveRegion="polite"
      pointerEvents="box-none"
    >
      {rows.map(({ service, content }) => {
        const c = TONES[scheme][content!.tone];
        const phase = snapshot[service].phase;
        return (
          <View
            key={service}
            testID={`backend-status-${service}`}
            style={[styles.row, { backgroundColor: c.bg, borderColor: c.border }]}
          >
            <Text style={[styles.text, { color: c.fg }]}>
              <Text style={styles.title}>{content!.title} </Text>
              {content!.detail}
            </Text>
            {(phase === 'down' || phase === 'offline') && (
              <Action label="Check now" color={c.fg} onPress={() => store.recheck(service)} />
            )}
            {phase === 'ready' && (
              <Action
                label="Try again"
                color={c.fg}
                onPress={() => {
                  store.dismiss(service);
                  void queryClient.refetchQueries({ type: 'active' });
                }}
              />
            )}
            {phase !== 'waking' && (
              <Pressable
                onPress={() => store.dismiss(service)}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={12}
                style={styles.close}
              >
                <Text style={[styles.closeText, { color: c.fg }]}>✕</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

function Action({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.action, { borderColor: color }]}
      hitSlop={6}
    >
      <Text style={[styles.actionText, { color }]}>{label}</Text>
    </Pressable>
  );
}

/**
 * Covers "it went down while the app was in the background": no polling while idle (that would keep the free
 * backends awake and use up their hours), just one quiet check when the person comes back after a while.
 */
function useCheckOnReturn() {
  useEffect(() => {
    let leftAt: number | null = null;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        leftAt = Date.now();
      } else if (state === 'active' && leftAt !== null) {
        const away = Date.now() - leftAt;
        leftAt = null;
        if (away < RETURN_CHECK_AFTER_MS) return;
        void backendStatus().suspect('raillens');
        if (LOGIN_PROVIDER === 'railops' || BOOKING_ENABLED)
          void backendStatus().suspect('railops');
      }
    });
    return () => sub.remove();
  }, []);
}

/** Current time, ticking every second only while a countdown is on screen. */
function useNow(ticking: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!ticking) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [ticking]);
  return now;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, zIndex: 1000, elevation: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  text: { flex: 1, fontSize: 13, lineHeight: 18 },
  title: { fontWeight: '700' },
  action: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  actionText: { fontSize: 12, fontWeight: '600' },
  close: { padding: 4 },
  closeText: { fontSize: 14, opacity: 0.8 },
});
