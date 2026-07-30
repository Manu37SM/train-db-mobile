import React, { useState } from 'react';
import { FAB, Portal } from 'react-native-paper';
import { AssistantDialog } from './AssistantDialog';

/**
 * Mobile equivalent of train-db-frontend's AssistantFab.tsx + the Cmd/Ctrl+K
 * shortcut (FEATURE.md "Keyboard Shortcuts" - explicitly called out as
 * something to replace with an appropriate mobile interaction, not skip).
 * A persistent floating button is the natural mobile analogue: always
 * reachable, no keyboard shortcut concept on a touch device.
 */
export function AssistantFab() {
  const [open, setOpen] = useState(false);

  return (
    <Portal>
      <FAB icon="message-question-outline" style={styles.fab} onPress={() => setOpen(true)} visible={!open} />
      <AssistantDialog visible={open} onDismiss={() => setOpen(false)} />
    </Portal>
  );
}

const styles = {
  fab: { position: 'absolute' as const, right: 16, bottom: 24 },
};
