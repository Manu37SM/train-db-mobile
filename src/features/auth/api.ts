import { apiClient } from '@/api/client';
import type { AuthResponse, CurrentUserResponse, MfaEnrolmentResponse } from '@/types/api';
export async function register(username: string, email: string, password: string) {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', {
    username,
    email,
    password,
  });
  return data;
}
/** otp: 6-digit authenticator code, only for admin accounts (after the server answers MFA_REQUIRED). */
export async function login(usernameOrEmail: string, password: string, otp?: string) {
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
