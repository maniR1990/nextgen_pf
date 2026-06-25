import { generateOpenApiSpec } from '@/lib/openapi';

export function GET() {
  return Response.json(generateOpenApiSpec());
}
