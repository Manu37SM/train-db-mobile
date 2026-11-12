import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, TextInput, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { register as registerRequest } from './api';
import { getApiErrorMessage } from '@/lib/apiError';
import { railOpsRegisterSchema, registerSchema, RegisterFormValues } from './schemas';
import { LOGIN_PROVIDER } from '@/config/login';
import { useAuthStore } from '@/store/authStore';
import { toStoredSession } from '@/lib/secureStorage';
import { useToastStore } from '@/store/toastStore';
import { BRAND } from '@/theme/theme';
import type { AuthNavigation } from '@/navigation/types';
interface Props {
  navigation: AuthNavigation;
}
type Field = 'username' | 'email' | 'phone' | 'password' | 'confirmPassword';
/** RailOps login (Phase 4D): a phone number instead of a username. */
const RAILOPS = LOGIN_PROVIDER === 'railops';
const FIELDS: readonly Field[] = RAILOPS
  ? ['email', 'phone', 'password', 'confirmPassword']
  : ['username', 'email', 'password', 'confirmPassword'];
const LABELS: Record<Field, string> = {
  username: 'username',
  email: 'email',
  phone: 'phone number',
  password: RAILOPS ? 'password (10+ characters)' : 'password',
  confirmPassword: 'Confirm password',
};
/** Both schemas validate the same form; only the fields differ. */
type FormValues = RegisterFormValues & { phone?: string };
const AUTOFILL: Record<
  Field,
  {
    textContentType: React.ComponentProps<typeof TextInput>['textContentType'];
    autoComplete: React.ComponentProps<typeof TextInput>['autoComplete'];
    keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  }
> = {
  username: { textContentType: 'username', autoComplete: 'username' },
  email: { textContentType: 'emailAddress', autoComplete: 'email', keyboardType: 'email-address' },
  phone: { textContentType: 'telephoneNumber', autoComplete: 'tel', keyboardType: 'phone-pad' },
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
  } = useForm<FormValues>({
    resolver: zodResolver((RAILOPS ? railOpsRegisterSchema : registerSchema) as typeof registerSchema),
  });
  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      registerRequest(
        RAILOPS
          ? { email: values.email, phone: values.phone, password: values.password }
          : { username: values.username, email: values.email, password: values.password },
      ),
    onSuccess: async (data) => {
      await setSession(toStoredSession(data));
      useToastStore.getState().show(`Account created. Welcome, ${data.username}.`);
      navigation.navigate('Account');
    },
    onError: (error) =>
      setServerError(
        getApiErrorMessage(
          error,
          RAILOPS
            ? 'Could not create account. The email or phone number may already be in use.'
            : 'Could not create account. Username or email may already be taken.',
        ),
      ),
  });
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Create your account
      </Text>

      {FIELDS.map((name) => (
        <View key={name}>
          <Controller
            control={control}
            name={name}
            render={({ field }) => (
              <TextInput
                label={LABELS[name]}
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
        onPress={() => handleSubmit((values) => {
          setServerError(null);
          mutation.mutate(values);
        })()}
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
