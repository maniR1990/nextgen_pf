import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typedRoutes: true,
  transpilePackages: ['@tremor/react', 'recharts'],
  serverExternalPackages: ['@prisma/client', '.prisma/client'],
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
