import React, { useState } from 'react';
import { FAB, Portal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AssistantDialog } from './AssistantDialog';

// Approximate height of React Navigation's bottom tab bar (its own default,
// undocumented but stable across RN/react-navigation versions - ~49pt on
// iOS, a couple points taller on Android with labels) plus a margin above
// it. AssistantFab is mounted as a sibling of the tab navigator (see
// RootNavigator), not inside one of its screens, so it can't call
// react-navigation's useBottomTabBarHeight() hook to measure this exactly.
const TAB_BAR_HEIGHT = 56;
const FAB_MARGIN_ABOVE_TAB_BAR = 16;

/**
 * Mobile equivalent of train-db-frontend's AssistantFab.tsx + the Cmd/Ctrl+K
 * shortcut (FEATURE.md "Keyboard Shortcuts" - explicitly called out as
 * something to replace with an appropriate mobile interaction, not skip).
 * A persistent floating button is the natural mobile analogue: always
 * reachable, no keyboard shortcut concept on a touch device.
 *
 * `bottom` used to be a flat 24 - measured from the very bottom of the
 * screen, which is also where the bottom tab bar sits, so this FAB sat
 * directly on top of the last tab (Account), fully covering its icon and
 * label. Since Settings (and its theme picker) is one tap beyond the
 * Account tab, this is what got reported 2026-08-05 as "no way to change
 * theme in mobile" - the tab wasn't broken, it just couldn't be tapped.
 * Offsetting by the tab bar's height plus the device's safe-area inset
 * clears it.
 */
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
