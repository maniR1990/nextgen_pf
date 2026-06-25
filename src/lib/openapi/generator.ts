import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import '@/lib/openapi/common.schemas';
import '@/lib/openapi/health.openapi';
import '@/modules/auth/auth.openapi';
import '@/modules/users/users.schema';
import { registry } from './registry';

export function generateOpenApiSpec() {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'NextGen PF API',
      version: '1.0.0',
      description:
        'Principal Engineer API — Auth uses httpOnly cookies (`access_token`, `refresh_token`). ' +
        'Open Swagger UI at `/api/docs/ui`. JSON spec at `/api/docs`.',
    },
    servers: [{ url: '/api', description: 'Next.js API base' }],
    tags: [
      { name: 'Auth — Login & Session', description: 'Login, refresh, logout, session' },
      { name: 'Auth — Registration', description: 'Register and email verification' },
      { name: 'Auth — Password Reset', description: 'Forgot and reset password flows' },
      { name: 'Users', description: 'User management (admin)' },
      { name: 'System', description: 'Health and ops' },
    ],
  });
}
