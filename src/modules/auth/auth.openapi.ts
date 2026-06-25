import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { errorResponse, MessageSchema, SessionUserSchema } from '@/lib/openapi/common.schemas';
import { registry } from '@/lib/openapi/registry';

extendZodWithOpenApi(z);

const LoginBodySchema = z
  .object({
    email: z.string().email().openapi({ example: 'alice@example.com' }),
    password: z.string().openapi({ example: 'Password1' }),
  })
  .openapi('LoginBody');

const RegisterBodySchema = z
  .object({
    email: z.string().email().openapi({ example: 'alice@example.com' }),
    name: z.string().min(2).max(100).openapi({ example: 'Alice' }),
    password: z.string().min(8).openapi({ example: 'Password1' }),
  })
  .openapi('RegisterBody');

const ForgotPasswordBodySchema = z
  .object({
    email: z.string().email().openapi({ example: 'alice@example.com' }),
  })
  .openapi('ForgotPasswordBody');

const ResetPasswordBodySchema = z
  .object({
    token: z.string().openapi({ example: 'a1b2c3...' }),
    newPassword: z.string().min(8).openapi({ example: 'NewPassword1' }),
    confirmPassword: z.string().openapi({ example: 'NewPassword1' }),
  })
  .openapi('ResetPasswordBody');

const ResendVerificationBodySchema = z
  .object({
    email: z.string().email().openapi({ example: 'alice@example.com' }),
  })
  .openapi('ResendVerificationBody');

const UserResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({ user: SessionUserSchema }),
  })
  .openapi('UserResponse');

const MessageResponseSchema = z
  .object({
    success: z.literal(true),
    data: MessageSchema,
  })
  .openapi('MessageResponse');

const jsonBody = (schema: z.ZodType) => ({
  body: { content: { 'application/json': { schema } } },
});

registry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['Auth — Login & Session'],
  summary: 'Login with email and password',
  description: 'Sets httpOnly `access_token` and `refresh_token` cookies on success.',
  request: jsonBody(LoginBodySchema),
  responses: {
    200: {
      description: 'Authenticated — cookies set',
      headers: {
        'Set-Cookie': { description: 'access_token + refresh_token' },
      },
      content: { 'application/json': { schema: UserResponseSchema } },
    },
    401: errorResponse('Invalid credentials', 'UNAUTHORIZED'),
    403: errorResponse('Email not verified', 'EMAIL_NOT_VERIFIED'),
    422: errorResponse('Validation error', 'VALIDATION_ERROR'),
    429: errorResponse('Too many requests', 'RATE_LIMITED'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/refresh',
  tags: ['Auth — Login & Session'],
  summary: 'Rotate access and refresh tokens',
  description: 'Requires `refresh_token` httpOnly cookie. Issues new cookie pair.',
  security: [{ refreshCookie: [] }],
  responses: {
    200: {
      description: 'Tokens rotated',
      content: { 'application/json': { schema: UserResponseSchema } },
    },
    401: errorResponse('Invalid or expired refresh token', 'UNAUTHORIZED'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/logout',
  tags: ['Auth — Login & Session'],
  summary: 'Logout and invalidate tokens',
  description: 'Clears cookies and blacklists tokens in Redis.',
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      description: 'Logged out',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            data: z.object({ message: z.string() }),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/auth/me',
  tags: ['Auth — Login & Session'],
  summary: 'Get current session user',
  security: [{ cookieAuth: [] }],
  responses: {
    200: {
      description: 'Current user',
      content: { 'application/json': { schema: UserResponseSchema } },
    },
    401: errorResponse('Unauthenticated', 'UNAUTHORIZED'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/register',
  tags: ['Auth — Registration'],
  summary: 'Register a new account',
  request: jsonBody(RegisterBodySchema),
  responses: {
    201: {
      description: 'Registration successful — verification email sent',
      content: { 'application/json': { schema: MessageResponseSchema } },
    },
    409: errorResponse('Email already exists', 'CONFLICT'),
    422: errorResponse('Validation error', 'VALIDATION_ERROR'),
    429: errorResponse('Too many requests', 'RATE_LIMITED'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/forgot-password',
  tags: ['Auth — Password Reset'],
  summary: 'Request password reset email',
  description: 'Always returns 200 to prevent email enumeration.',
  request: jsonBody(ForgotPasswordBodySchema),
  responses: {
    200: {
      description: 'Generic success message',
      content: { 'application/json': { schema: MessageResponseSchema } },
    },
    429: errorResponse('Too many requests', 'RATE_LIMITED'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/auth/validate-reset-token',
  tags: ['Auth — Password Reset'],
  summary: 'Validate reset token before showing form',
  request: {
    query: z.object({
      token: z.string().openapi({ example: 'a1b2c3...' }),
    }),
  },
  responses: {
    200: {
      description: 'Token is valid',
      content: {
        'application/json': {
          schema: z.object({
            success: z.literal(true),
            data: z.object({ valid: z.literal(true) }),
          }),
        },
      },
    },
    404: errorResponse('Token not found', 'NOT_FOUND'),
    410: errorResponse('Token expired', 'GONE'),
    422: errorResponse('Validation error', 'VALIDATION_ERROR'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/reset-password',
  tags: ['Auth — Password Reset'],
  summary: 'Reset password and auto-login',
  request: jsonBody(ResetPasswordBodySchema),
  responses: {
    200: {
      description: 'Password updated — cookies set',
      content: { 'application/json': { schema: UserResponseSchema } },
    },
    404: errorResponse('Token not found', 'NOT_FOUND'),
    410: errorResponse('Token expired', 'GONE'),
    422: errorResponse('Validation error or password mismatch', 'VALIDATION_ERROR'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/auth/resend-verification',
  tags: ['Auth — Registration'],
  summary: 'Resend email verification link',
  request: jsonBody(ResendVerificationBodySchema),
  responses: {
    200: {
      description: 'Generic success message',
      content: { 'application/json': { schema: MessageResponseSchema } },
    },
    429: errorResponse('Too many requests', 'RATE_LIMITED'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/auth/verify-email',
  tags: ['Auth — Registration'],
  summary: 'Verify email via link token',
  request: {
    query: z.object({
      token: z.string().openapi({ example: 'a1b2c3...' }),
    }),
  },
  responses: {
    200: {
      description: 'Email verified — cookies set',
      content: { 'application/json': { schema: UserResponseSchema } },
    },
    404: errorResponse('Token not found', 'NOT_FOUND'),
    410: errorResponse('Token expired', 'GONE'),
  },
});
