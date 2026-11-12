import { apiClient } from '@/api/client';
import { LOGIN_PROVIDER } from '@/config/login';
import * as railOps from './railops';
import type { AuthResponse, CurrentUserResponse, MfaEnrolmentResponse } from '@/types/api';
/** RailLens login: username + email. RailOps login (Phase 4D): email + phone; the username is made from the email. */
export interface RegisterValues {
  username?: string;
  email: string;
  phone?: string;
  password: string;
}
export async function register(values: RegisterValues) {
  if (LOGIN_PROVIDER === 'railops') {
    return railOps.register(values.email, values.phone ?? '', values.password);
  }
  const { data } = await apiClient.post<AuthResponse>('/auth/register', {
    username: values.username,
    email: values.email,
    password: values.password,
  });
  return data;
}
/**
 * otp: 6-digit authenticator code, only for admin accounts (RailLens login: after the server answers MFA_REQUIRED;
 * RailOps login: staff send it with the password).
 */
export async function login(usernameOrEmail: string, password: string, otp?: string) {
  if (LOGIN_PROVIDER === 'railops') {
    return railOps.login(usernameOrEmail, password, otp);
  }
  const { data } = await apiClient.post<AuthResponse>('/auth/login', {
    usernameOrEmail,
    password,
    ...(otp ? { otp } : {}),
  });
  return data;
}
/** Admin MFA setup, step 1: setup key for the authenticator app. */
export async function startMfaEnrolment(enrolmentToken: string) {
  const { data } = await apiClient.post<MfaEnrolmentResponse>('/auth/mfa/enrol', { enrolmentToken });
  return data;
}
/** Step 2: the app's first code; returns an admin session. */
export async function confirmMfaEnrolment(enrolmentToken: string, otp: string) {
  const { data } = await apiClient.post<AuthResponse>('/auth/mfa/confirm', { enrolmentToken, otp });
  return data;
}
export async function logout(refreshToken: string) {
  if (LOGIN_PROVIDER === 'railops') {
    await railOps.logout(refreshToken);
    return;
  }
  await apiClient.post('/auth/logout', { refreshToken });
}
export async function getCurrentUser() {
  const { data } = await apiClient.get<CurrentUserResponse>('/auth/me');
  return data;
}
export async function changePassword(currentPassword: string, newPassword: string) {
  await apiClient.put('/auth/password', { currentPassword, newPassword });
}
export async function deleteAccount(password: string) {
  await apiClient.delete('/auth/me', { data: { password } });
}
