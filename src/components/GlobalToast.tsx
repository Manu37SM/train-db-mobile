import React from 'react';
import { Snackbar } from 'react-native-paper';
import { useToastStore } from '@/store/toastStore';
export default function GlobalToast() {
  const message = useToastStore((s) => s.message);
  const hide = useToastStore((s) => s.hide);
  return (
    <Snackbar
      visible={!!message}
      onDismiss={hide}
      duration={3000}
      style={styles.snackbar}
      theme={{
        colors: {
          inverseSurface: '#1e293b',
          inverseOnSurface: '#f8fafc',
          inversePrimary: '#93c5fd',
        },
      }}
    >
      {message}
    </Snackbar>
  );
}
const styles = {
  snackbar: { marginBottom: 72 },
};
