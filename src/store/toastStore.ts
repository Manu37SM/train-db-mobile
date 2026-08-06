import { create } from 'zustand';

interface ToastState {
  message: string | null;
  show: (message: string) => void;
  hide: () => void;
}

/**
 * Ephemeral, unpersisted (unlike preferencesStore/authStore, nothing here
 * should survive an app restart) global toast queue - one message at a
 * time, which is all this app currently needs. Global rather than local
 * to whichever screen triggers it because the screen that triggers a toast
 * (e.g. LoginScreen on successful sign-in) often navigates away in the
 * same action, and a Snackbar owned by that screen would unmount with it
 * before the user ever saw it - reported 2026-08-06 as login succeeding
 * with no feedback. Rendered once, globally, by GlobalToast.tsx.
 */
export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  hide: () => set({ message: null }),
}));
