import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Divider, HelperText, List, Text, TextInput } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  changePassword,
  deleteAccount,
  getCurrentUser,
  logout as logoutRequest,
} from '@/features/auth/api';
import {
  changePasswordSchema,
  ChangePasswordFormValues,
  deleteAccountSchema,
  DeleteAccountFormValues,
} from '@/features/auth/schemas';
import { getApiErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/authStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import { usePopularityStore } from '@/features/home/popularityStore';
import { usePopularSearchStore } from '@/features/home/popularSearchStore';
import { useToastStore } from '@/store/toastStore';
import { StationAutocomplete } from '@/components/StationAutocomplete';
import { BRAND } from '@/theme/theme';
import type { AccountStackParamList } from '@/navigation/types';
type Props = NativeStackScreenProps<AccountStackParamList, 'Account'>;
export default function AccountScreen({ navigation }: Props) {
  const session = useAuthStore((s) => s.session);
  const logoutStore = useAuthStore((s) => s.logout);
  const {
    defaultFromStationCode,
    defaultFromStationName,
    setDefaultFromStation,
    clearDefaultFromStation,
  } = usePreferencesStore();
  const popularity = usePopularityStore();
  const popularSearches = usePopularSearchStore();
  const [activityCleared, setActivityCleared] = useState(false);
  const trackedActivityCount =
    Object.keys(popularity.trains).length +
    Object.keys(popularity.stations).length +
    Object.keys(popularSearches.trains).length +
    Object.keys(popularSearches.stations).length;
  const { data } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    enabled: !!session,
  });
  const handleLogout = async () => {
    if (session?.refreshToken) {
      await logoutRequest(session.refreshToken).catch(() => undefined);
    }
    await logoutStore();
  };
  return (
    <View style={styles.container}>
      {session ? (
        <>
          <Text variant="titleLarge">{data?.username ?? session.username}</Text>
          <Text style={styles.email}>{data?.email ?? session.email}</Text>
          <Button mode="outlined" onPress={handleLogout} style={styles.authAction}>
            Sign out
          </Button>
        </>
      ) : (
        <>
          <Text variant="titleLarge">You're not signed in</Text>
          <Text style={styles.email}>
            Sign in to manage your profile, or continue browsing without an account.
          </Text>
          <Button
            mode="contained"
            buttonColor={BRAND.accent}
            onPress={() => navigation.navigate('Login')}
            style={styles.authAction}
          >
            Sign in
          </Button>
          <Button onPress={() => navigation.navigate('Register')}>Create an account</Button>
        </>
      )}

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={styles.sectionTitle}>
        Preferences
      </Text>
      <StationAutocomplete
        label="Default 'From' station"
        initialLabel={
          defaultFromStationCode && defaultFromStationName
            ? `${defaultFromStationCode} · ${defaultFromStationName}`
            : undefined
        }
        onSelect={(station) => {
          if (station) setDefaultFromStation(station.stationCode, station.stationName);
          else clearDefaultFromStation();
        }}
      />
      <Text style={styles.hint}>Pre-fills the From station on the journey planner.</Text>

      <Divider style={styles.divider} />

      <Text variant="titleMedium" style={styles.sectionTitle}>
        On-device activity
      </Text>
      <Text style={styles.hint}>
        RailLens tracks which trains/stations you view and search most often on this device only, to
        power the "Popular" sections on Home - nothing is sent to a server. Clearing it resets those
        sections without touching your favorites, history, or saved journeys.
      </Text>
      <Button
        mode="outlined"
        disabled={trackedActivityCount === 0}
        onPress={() => {
          usePopularityStore.getState().clear();
          usePopularSearchStore.getState().clear();
          setActivityCleared(true);
        }}
        style={styles.authAction}
      >
        {trackedActivityCount === 0 ? 'Nothing to clear' : 'Clear on-device activity'}
      </Button>
      {activityCleared && trackedActivityCount === 0 && (
        <Text style={styles.clearedNote}>Cleared.</Text>
      )}

      {session && (
        <>
          <Divider style={styles.divider} />
          <ChangePasswordSection />

          <Divider style={styles.divider} />
          <DeleteAccountSection onDeleted={logoutStore} />
        </>
      )}

      <Divider style={styles.divider} />

      <List.Item
        title="Favorites"
        left={(p) => <List.Icon {...p} icon="star-outline" />}
        onPress={() => navigation.navigate('Favorites')}
      />
      <List.Item
        title="Search history"
        left={(p) => <List.Icon {...p} icon="history" />}
        onPress={() => navigation.navigate('History')}
      />
      <List.Item
        title="Settings"
        left={(p) => <List.Icon {...p} icon="cog-outline" />}
        onPress={() => navigation.navigate('Settings')}
      />
      <List.Item
        title="Admin portal"
        left={(p) => <List.Icon {...p} icon="shield-outline" />}
        onPress={() => navigation.navigate('Admin')}
      />
      <List.Item
        title="Developers"
        left={(p) => <List.Icon {...p} icon="code-tags" />}
        onPress={() => navigation.navigate('Developers')}
      />
    </View>
  );
}
function ChangePasswordSection() {
  const [success, setSuccess] = useState(false);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });
  const mutation = useMutation({
    mutationFn: (values: ChangePasswordFormValues) =>
      changePassword(values.currentPassword, values.newPassword),
    onSuccess: () => {
      reset();
      setSuccess(true);
      useToastStore.getState().show('Password changed.');
    },
    onError: () => setSuccess(false),
  });
  return (
    <View>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Change password
      </Text>

      <Controller
        control={control}
        name="currentPassword"
        render={({ field }) => (
          <TextInput
            label="Current password"
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            value={field.value ?? ''}
            onChangeText={field.onChange}
            style={styles.input}
          />
        )}
      />
      <HelperText type="error" visible={!!errors.currentPassword}>
        {errors.currentPassword?.message}
      </HelperText>

      <Controller
        control={control}
        name="newPassword"
        render={({ field }) => (
          <TextInput
            label="New password"
            secureTextEntry
            autoComplete="password-new"
            textContentType="newPassword"
            value={field.value ?? ''}
            onChangeText={field.onChange}
            style={styles.input}
          />
        )}
      />
      <HelperText type={errors.newPassword ? 'error' : 'info'} visible>
        {errors.newPassword?.message ?? 'At least 8 characters, with a letter and a number.'}
      </HelperText>

      {mutation.isError && (
        <HelperText type="error" visible>
          {getApiErrorMessage(mutation.error, 'Failed to change password. Please try again.')}
        </HelperText>
      )}

      <Button
        mode="contained"
        buttonColor={BRAND.accent}
        loading={mutation.isPending}
        onPress={handleSubmit((values) => {
          setSuccess(false);
          mutation.mutate(values);
        })}
        style={styles.authAction}
      >
        {mutation.isPending ? 'Saving...' : 'Change password'}
      </Button>
      {success && <Text style={styles.clearedNote}>Password changed.</Text>}
    </View>
  );
}
function DeleteAccountSection({ onDeleted }: { onDeleted: () => Promise<void> }) {
  const [confirming, setConfirming] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DeleteAccountFormValues>({ resolver: zodResolver(deleteAccountSchema) });
  const mutation = useMutation({
    mutationFn: (values: DeleteAccountFormValues) => deleteAccount(values.password),
    onSuccess: async () => {
      await onDeleted();
      useToastStore.getState().show('Account deleted.');
    },
  });
  return (
    <View>
      <Text variant="titleMedium" style={[styles.sectionTitle, styles.dangerTitle]}>
        Delete account
      </Text>
      <Text style={styles.hint}>This permanently deletes your account. This cannot be undone.</Text>

      {!confirming ? (
        <Button
          mode="outlined"
          textColor="#dc2626"
          onPress={() => setConfirming(true)}
          style={styles.authAction}
        >
          Delete my account
        </Button>
      ) : (
        <View>
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <TextInput
                label="Confirm your password"
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                value={field.value ?? ''}
                onChangeText={field.onChange}
                style={styles.input}
              />
            )}
          />
          <HelperText type="error" visible={!!errors.password}>
            {errors.password?.message}
          </HelperText>

          {mutation.isError && (
            <HelperText type="error" visible>
              {getApiErrorMessage(mutation.error, 'Failed to delete account. Please try again.')}
            </HelperText>
          )}

          <View style={styles.row}>
            <Button
              mode="contained"
              buttonColor="#dc2626"
              loading={mutation.isPending}
              onPress={handleSubmit((values) => mutation.mutate(values))}
              style={styles.rowButton}
            >
              Confirm delete
            </Button>
            <Button
              mode="outlined"
              disabled={mutation.isPending}
              onPress={() => setConfirming(false)}
              style={styles.rowButton}
            >
              Cancel
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  email: { opacity: 0.7, marginBottom: 16 },
  authAction: { marginBottom: 8 },
  divider: { marginVertical: 16 },
  sectionTitle: { marginBottom: 8 },
  dangerTitle: { color: '#dc2626' },
  hint: { fontSize: 12, opacity: 0.6, marginBottom: 4 },
  clearedNote: { fontSize: 12, color: '#16a34a', marginTop: 4 },
  input: { marginBottom: 4 },
  row: { flexDirection: 'row', gap: 8 },
  rowButton: { flex: 1 },
});
