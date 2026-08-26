import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, TextInput, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { register as registerRequest } from './api';
import { getApiErrorMessage } from '@/lib/apiError';
import { registerSchema, RegisterFormValues } from './schemas';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { BRAND } from '@/theme/theme';
import type { AuthNavigation } from '@/navigation/types';
interface Props {
  navigation: AuthNavigation;
}
const AUTOFILL: Record<
  'username' | 'email' | 'password' | 'confirmPassword',
  {
    textContentType: React.ComponentProps<typeof TextInput>['textContentType'];
    autoComplete: React.ComponentProps<typeof TextInput>['autoComplete'];
    keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  }
> = {
  username: { textContentType: 'username', autoComplete: 'username' },
  email: { textContentType: 'emailAddress', autoComplete: 'email', keyboardType: 'email-address' },
  password: { textContentType: 'newPassword', autoComplete: 'password-new' },
  confirmPassword: { textContentType: 'newPassword', autoComplete: 'password-new' },
};
export default function RegisterScreen({ navigation }: Props) {
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });
  const mutation = useMutation({
    mutationFn: (values: RegisterFormValues) =>
      registerRequest(values.username, values.email, values.password),
    onSuccess: async (data) => {
      await setSession(data);
      useToastStore.getState().show(`Account created. Welcome, ${data.username}.`);
      navigation.navigate('Account');
    },
    onError: (error) =>
      setServerError(
        getApiErrorMessage(
          error,
          'Could not create account. Username or email may already be taken.',
        ),
      ),
  });
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Create your account
      </Text>

      {(['username', 'email', 'password', 'confirmPassword'] as const).map((name) => (
        <View key={name}>
          <Controller
            control={control}
            name={name}
            render={({ field }) => (
              <TextInput
                label={name === 'confirmPassword' ? 'Confirm password' : name}
                secureTextEntry={name.toLowerCase().includes('password')}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType={AUTOFILL[name].textContentType}
                autoComplete={AUTOFILL[name].autoComplete}
                keyboardType={AUTOFILL[name].keyboardType}
                value={field.value}
                onChangeText={field.onChange}
                style={styles.input}
              />
            )}
          />
          <HelperText type="error" visible={!!errors[name]}>
            {errors[name]?.message as string}
          </HelperText>
        </View>
      ))}

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
        Create account
      </Button>

      <Button onPress={() => navigation.navigate('Login')}>Already have an account? Sign in</Button>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { marginBottom: 24, textAlign: 'center' },
  input: { marginBottom: 4 },
  button: { marginTop: 16, marginBottom: 8 },
});
