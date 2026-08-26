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
    onSuccess: async (data) => {
      await setSession(data);
      useToastStore.getState().show(`Signed in as ${data.username}.`);
      navigation.navigate('Account');
    },
    onError: (error) =>
      setServerError(getApiErrorMessage(error, 'Invalid username/email or password.')),
  });
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Sign in to RailLens
      </Text>

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
