import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { registry } from './registry';

extendZodWithOpenApi(z);

export const ApiErrorSchema = z
  .object({
    success: z.literal(false),
    error: z.string().openapi({ example: 'Invalid credentials' }),
    code: z.string().openapi({ example: 'UNAUTHORIZED' }),
  })
  .openapi('ApiError');

export const SessionUserSchema = z
  .object({
    id: z.string().openapi({ example: '507f1f77bcf86cd799439011' }),
    email: z.string().email().openapi({ example: 'alice@example.com' }),
    name: z.string().openapi({ example: 'Alice' }),
    role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
    emailVerified: z.string().datetime().nullable(),
  })
  .openapi('SessionUser');

export const MessageSchema = z
  .object({
    message: z.string(),
  })
  .openapi('Message');

registry.registerComponent('securitySchemes', 'cookieAuth', {
  type: 'apiKey',
  in: 'cookie',
  name: 'access_token',
  description: 'httpOnly access token cookie (15 min TTL)',
});

registry.registerComponent('securitySchemes', 'refreshCookie', {
  type: 'apiKey',
  in: 'cookie',
  name: 'refresh_token',
  description: 'httpOnly refresh token cookie (7 day TTL)',
});

export function errorResponse(description: string, exampleCode = 'API_ERROR') {
  return {
    description,
    content: {
      'application/json': {
        schema: ApiErrorSchema,
        example: { success: false, error: description, code: exampleCode },
      },
    },
  };
}
