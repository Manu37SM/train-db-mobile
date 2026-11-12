import React, { useState } from 'react';
import { Linking, View, StyleSheet } from 'react-native';
import { Button, Text, TextInput, HelperText } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { confirmMfaEnrolment, login, startMfaEnrolment } from './api';
import { loginSchema, LoginFormValues } from './schemas';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/apiError';
import { toStoredSession } from '@/lib/secureStorage';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { BRAND } from '@/theme/theme';
import type { AuthNavigation } from '@/navigation/types';
import type { AuthResponse, MfaEnrolmentResponse } from '@/types/api';
interface Props {
  navigation: AuthNavigation;
}
/**
 * password: everyone. otp: admin accounts with MFA (server answered MFA_REQUIRED).
 * enrol: an admin's first sign-in - set up an authenticator app, then confirm with its first code.
 */
type Step = 'password' | 'otp' | 'enrol';
type Enrolment = MfaEnrolmentResponse & { enrolmentToken: string };
const OTP_PATTERN = /^\d{6}$/;
function groupSecret(secret: string) {
  return secret.replace(/(.{4})/g, '$1 ').trim();
}
export default function LoginScreen({ navigation }: Props) {
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('password');
  const [otp, setOtp] = useState('');
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });
  async function finish(data: AuthResponse) {
    await setSession(toStoredSession(data));
    useToastStore.getState().show(`Signed in as ${data.username}.`);
    navigation.navigate('Account');
  }
  function restart(message: string | null) {
    setStep('password');
    setEnrolment(null);
    setOtp('');
    setServerError(message);
  }
  const mutation = useMutation({
    mutationFn: async (): Promise<AuthResponse | null> => {
      if (step === 'enrol' && enrolment) {
        return confirmMfaEnrolment(enrolment.enrolmentToken, otp);
      }
      const { usernameOrEmail, password } = getValues();
      const data = await login(usernameOrEmail, password, step === 'otp' ? otp : undefined);
      if (data.mfaEnrolmentRequired && data.enrolmentToken) {
        const started = await startMfaEnrolment(data.enrolmentToken);
        setEnrolment({ ...started, enrolmentToken: data.enrolmentToken });
        setOtp('');
        setStep('enrol');
        return null;
      }
      return data;
    },
    onSuccess: async (data) => {
      if (data) await finish(data);
    },
    onError: (error) => {
      const code = getApiErrorCode(error);
      if (code === 'MFA_REQUIRED') {
        setStep('otp');
        setOtp('');
      } else if (code === 'INVALID_OTP') {
        setOtp('');
        setServerError("That code didn't work. Wait for the next code in your app and try again.");
      } else if (code === 'INVALID_ENROLMENT_TOKEN') {
        restart('Setup took too long. Sign in again to continue.');
      } else {
        setServerError(getApiErrorMessage(error, 'Invalid username/email or password.'));
      }
    },
  });
  function submit() {
    setServerError(null);
    if (step === 'password') {
      handleSubmit(() => mutation.mutate())();
      return;
    }
    if (!OTP_PATTERN.test(otp)) {
      setServerError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    mutation.mutate();
  }
  const otpInput = (
    <TextInput
      label={step === 'enrol' ? 'Code from your app' : 'One-time code'}
      value={otp}
      onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
      keyboardType="number-pad"
      textContentType="oneTimeCode"
      autoComplete="sms-otp"
      maxLength={6}
      autoFocus
      style={styles.input}
    />
  );
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        {step === 'enrol' ? 'Set up two-step sign-in' : 'Sign in to RailLens'}
      </Text>

      {step !== 'enrol' && (
        <>
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
                editable={step === 'password'}
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
                editable={step === 'password'}
                style={styles.input}
              />
            )}
          />
          <HelperText type="error" visible={!!errors.password}>
            {errors.password?.message}
          </HelperText>
        </>
      )}

      {step === 'otp' && (
        <>
          <Text style={styles.hint}>Enter the 6-digit code from your authenticator app.</Text>
          {otpInput}
        </>
      )}

      {step === 'enrol' && enrolment && (
        <>
          <Text style={styles.hint}>
            Admin accounts need a code from an authenticator app (Google Authenticator, Microsoft
            Authenticator, Authy, 1Password…).
          </Text>
          <Button
            mode="outlined"
            icon="shield-key"
            onPress={() =>
              Linking.openURL(enrolment.otpauthUri).catch(() =>
                setServerError('No authenticator app found. Enter the setup key by hand instead.'),
              )
            }
            style={styles.button}
          >
            Add to authenticator app
          </Button>
          <Text style={styles.hint}>Or add an account by hand. Account: RailLens. Setup key:</Text>
          <Text selectable style={styles.secret}>
            {groupSecret(enrolment.secret)}
          </Text>
          <Text style={styles.hint}>
            Keep this key private: anyone with it can generate your codes.
          </Text>
          {otpInput}
        </>
      )}

      {serverError && (
        <HelperText type="error" visible>
          {serverError}
        </HelperText>
      )}

      <Button
        mode="contained"
        buttonColor={BRAND.accent}
        loading={mutation.isPending}
        onPress={submit}
        style={styles.button}
      >
        {step === 'enrol' ? 'Turn on and sign in' : step === 'otp' ? 'Verify' : 'Sign in'}
      </Button>

      {step === 'password' ? (
        <Button onPress={() => navigation.navigate('Register')}>Create an account</Button>
      ) : (
        <Button onPress={() => restart(null)}>Start over</Button>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { marginBottom: 24, textAlign: 'center' },
  input: { marginBottom: 4 },
  hint: { marginBottom: 8 },
  secret: { fontFamily: 'monospace', fontSize: 16, marginBottom: 8 },
  button: { marginTop: 16, marginBottom: 8 },
});
