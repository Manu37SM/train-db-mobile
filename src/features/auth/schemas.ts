import { z } from 'zod';
export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;
export const registerSchema = z
  .object({
    username: z.string().min(3, 'At least 3 characters'),
    email: z.email('Enter a valid email'),
    password: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(PASSWORD_PATTERN, 'Must contain at least one letter and one number'),
});
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});
export type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;
