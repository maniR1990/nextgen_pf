/**
 * Mongoose connection singleton (spec compatibility stub).
 * Active data layer uses Prisma — see lib/db/prisma.ts.
 */
export { connectDatabase as connectDB } from './connectDatabase';
export { prisma } from './prisma';
