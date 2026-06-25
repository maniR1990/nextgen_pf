import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { registry } from '@/lib/openapi/registry';

extendZodWithOpenApi(z);

export const CreateUserSchema = z.object({
  email: z.string().email().openapi({ example: 'alice@example.com' }),
  name: z.string().min(2).openapi({ example: 'Alice' }),
  password: z.string().min(8),
  role: z.nativeEnum(Role).optional(),
});

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
  password: z.string().min(8).optional(),
  role: z.nativeEnum(Role).optional(),
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.nativeEnum(Role),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

registry.registerPath({
  method: 'post',
  path: '/users',
  tags: ['Users'],
  request: {
    body: {
      content: { 'application/json': { schema: CreateUserSchema } },
    },
  },
  responses: {
    201: {
      description: 'User created',
      content: { 'application/json': { schema: UserSchema } },
    },
    409: { description: 'Email already exists' },
    422: { description: 'Validation error' },
  },
});
