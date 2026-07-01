import path from 'node:path';
import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  typedRoutes: true,
  transpilePackages: ['@tremor/react', 'recharts'],
  serverExternalPackages: ['@prisma/client', '.prisma/client'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  webpack(config, { nextRuntime }) {
    if (nextRuntime === 'edge') {
      // Prisma MongoDB requires Node.js native binaries and has no WASM build.
      // Next.js also compiles instrumentation.ts for Edge, which traces the
      // @prisma/client import and tries to bundle wasm.js → query_engine_bg.js
      // (which doesn't exist). The alias below replaces Prisma with an empty stub
      // for Edge builds; actual Prisma usage is guarded by NEXT_RUNTIME !== 'nodejs'.
      config.resolve.alias = {
        ...config.resolve.alias,
        '@prisma/client': path.join(__dirname, 'src/lib/db/__prisma-edge-stub.js'),
      };
    }
    return config;
  },
};

export default nextConfig;
