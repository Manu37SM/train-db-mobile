import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, TextInput, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { login } from './api';
import { loginSchema, LoginFormValues } from './schemas';
import { getApiErrorMessage } from '@/lib/apiError';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { BRAND } from '@/theme/theme';
import type { AuthNavigation } from '@/navigation/types';

interface Props {
  navigation: AuthNavigation;
}

export default function LoginScreen({ navigation }: Props) {
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const mutation = useMutation({
    mutationFn: (values: LoginFormValues) => login(values.usernameOrEmail, values.password),
    // Previously just called setSession() and stopped - the screen never
    // navigated anywhere and gave no confirmation, so a successful login
    // looked identical to the form silently doing nothing until the user
    // happened to tap the Account tab themselves. Reported 2026-08-06.
    onSuccess: async (data) => {
      await setSession(data);
      useToastStore.getState().show(`Signed in as ${data.username}.`);
      navigation.navigate('Account');
    },
    // Surfaces the backend's actual error text (e.g. AuthService's account-lockout
    // message, HTTP 423) instead of always showing the same generic wrong-
    // password copy - a locked-out user needs "try again later", not "check
    // your password", since retrying the correct password won't help either
    // way until the lockout window passes.
    onError: (error) =>
      setServerError(getApiErrorMessage(error, 'Invalid username/email or password.')),
  });

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Sign in to RailLens
      </Text>

      {/* autoComplete/textContentType weren't set at all before - with no
          autofill hint, Android has no way to know this is a credential
          field, so a keyboard's own inline suggestion strip (e.g. Samsung
          Keyboard) can end up racing its insert against the IME's pending
          composing span for whatever the user had just typed, instead of
          the system Autofill Framework replacing the field atomically.
          Reported 2026-08-06: typing one letter then accepting a Samsung
          Keyboard autofill suggestion left that letter appended after the
          filled value ("ling465yao@gmail.coml"). autoCorrect={false} also
          removes autocorrect's own competing composing-span suggestions
          from the same field. */}
      <Controller
        control={control}
        name="usernameOrEmail"
        render={({ field }) => (
          <TextInput
            label="Username or email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="username"
            autoComplete="email"
            value={field.value}
            onChangeText={field.onChange}
            style={styles.input}
          />
        )}
      />
      <HelperText type="error" visible={!!errors.usernameOrEmail}>
        {errors.usernameOrEmail?.message}
      </HelperText>

      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextInput
            label="Password"
            secureTextEntry
            textContentType="password"
            autoComplete="password"
            value={field.value}
            onChangeText={field.onChange}
            style={styles.input}
          />
        )}
      />
      <HelperText type="error" visible={!!errors.password}>
        {errors.password?.message}
      </HelperText>

      {serverError && (
        <HelperText type="error" visible>
          {serverError}
        </HelperText>
      )}

      <Button
        mode="contained"
        buttonColor={BRAND.accent}
        loading={mutation.isPending}
        onPress={handleSubmit((values) => {
          setServerError(null);
          mutation.mutate(values);
        })}
        style={styles.button}
      >
        Sign in
      </Button>

      <Button onPress={() => navigation.navigate('Register')}>Create an account</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { marginBottom: 24, textAlign: 'center' },
  input: { marginBottom: 4 },
  button: { marginTop: 16, marginBottom: 8 },
});
