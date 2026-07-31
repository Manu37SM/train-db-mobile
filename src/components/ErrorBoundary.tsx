import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { BRAND } from '@/theme/theme';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level crash net for the whole app (see App.tsx, which wraps
 * RootNavigator with this) - without it, any uncaught render-time
 * exception anywhere in the screen tree white-screens the entire app with
 * no recovery path and nothing on screen to explain what happened. That's
 * a bigger deal here than it would be on the web: this is distributed as a
 * sideloaded APK with no crash-reporting/APM service wired up (see
 * RequestIdFilter's equivalent reasoning on the backend), so a white
 * screen is completely undiagnosable for whoever hit it.
 *
 * Deliberately a plain class component with hardcoded colors, not styled
 * via react-native-paper's theme - this needs to render correctly even if
 * the crash originated inside PaperProvider's own subtree, so it can't
 * depend on any context that might be part of what broke. "Try again"
 * just resets local state to re-mount the children; it can't guarantee
 * recovery (a crash on every render of the same screen will just
 * re-trigger this same boundary), but it's a real chance for anything
 * transient rather than forcing a full app kill-and-reopen.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // No crash-reporting service configured (zero-budget demo project) -
    // console.error is still useful for anyone connected via `adb logcat`
    // or a Metro debug session, which is the only diagnostic path
    // available for a sideloaded build.
    console.error('Unhandled error caught by ErrorBoundary:', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Icon name="alert-circle-outline" size={48} color={BRAND.accent} />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            RailLens ran into an unexpected error. Try again, or fully close and reopen the app
            if the problem continues.
          </Text>
          <Text style={styles.retry} onPress={this.handleRetry}>
            Try again
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1220',
    paddingHorizontal: 32,
  },
  title: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  retry: {
    marginTop: 24,
    fontSize: 15,
    fontWeight: '600',
    color: '#ea580c',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#ea580c',
    borderRadius: 8,
    overflow: 'hidden',
  },
});
