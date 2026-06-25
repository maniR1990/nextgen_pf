import { z } from 'zod';

const emailField = z
  .string()
  .email()
  .transform((v) => v.toLowerCase());

const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const nameField = z.string().min(2).max(100);

export const LoginSchema = z.object({
  email: emailField,
  password: z.string().min(1),
});

export const RegisterSchema = z.object({
  email: emailField,
  name: nameField,
  password: passwordField,
});

export const ForgotPasswordSchema = z.object({
  email: emailField,
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1),
    newPassword: passwordField,
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const ResendVerificationSchema = z.object({
  email: emailField,
});

export const ValidateResetTokenSchema = z.object({
  token: z.string().min(1),
});
