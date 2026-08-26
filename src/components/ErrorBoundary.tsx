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
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
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
            RailLens ran into an unexpected error. Try again, or fully close and reopen the app if
            the problem continues.
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
