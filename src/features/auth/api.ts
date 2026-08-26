import { apiClient } from '@/api/client';
import type { AuthResponse, CurrentUserResponse } from '@/types/api';
export async function register(username: string, email: string, password: string) {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', {
    username,
    email,
    password,
  });
  return data;
}
export async function login(usernameOrEmail: string, password: string) {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', { usernameOrEmail, password });
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
