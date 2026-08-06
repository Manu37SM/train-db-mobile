import React from 'react';
import { Snackbar } from 'react-native-paper';
import { useToastStore } from '@/store/toastStore';

/**
 * Rendered once at the root (see RootNavigator) so any screen can call
 * useToastStore.getState().show(message) and have it appear regardless of
 * navigation happening in the same action - see toastStore's doc comment.
 *
 * Colors are fixed (not theme-derived) rather than relying on Paper's
 * default Snackbar surface, which the halt/origin/destination chip bug
 * earlier the same day (see TrainDetailsScreen) already showed can't be
 * trusted to stay readable across both themes here - a toast needs to be
 * legible against *both* a light and a dark screen behind it regardless,
 * so it deliberately doesn't try to blend in with either.
 */
export default function GlobalToast() {
  const message = useToastStore((s) => s.message);
  const hide = useToastStore((s) => s.hide);

  return (
    <Snackbar
      visible={!!message}
      onDismiss={hide}
      duration={3000}
      style={styles.snackbar}
      theme={{ colors: { inverseSurface: '#1e293b', inverseOnSurface: '#f8fafc', inversePrimary: '#93c5fd' } }}
    >
      {message}
    </Snackbar>
  );
}

const styles = {
  snackbar: { marginBottom: 72 },
};
