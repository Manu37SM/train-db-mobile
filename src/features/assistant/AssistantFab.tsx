import React, { useState } from 'react';
import { FAB, Portal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AssistantDialog } from './AssistantDialog';
const TAB_BAR_HEIGHT = 56;
const FAB_MARGIN_ABOVE_TAB_BAR = 16;
export function AssistantFab() {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  return (
    <Portal>
      <FAB
        icon="message-question-outline"
        style={[styles.fab, { bottom: TAB_BAR_HEIGHT + FAB_MARGIN_ABOVE_TAB_BAR + insets.bottom }]}
        onPress={() => setOpen(true)}
        visible={!open}
      />
      <AssistantDialog visible={open} onDismiss={() => setOpen(false)} />
    </Portal>
  );
}
const styles = {
  fab: { position: 'absolute' as const, right: 16 },
};
