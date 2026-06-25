import { prisma } from './prisma';

const MISSING_URL_MESSAGE =
  'DATABASE_URL is not set. Copy .env.example to .env and add your MongoDB Atlas connection string.';

/** Connect to MongoDB and verify with a ping. Safe to call multiple times. */
export async function connectDatabase() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(MISSING_URL_MESSAGE);
  }

  if (url.includes('<user>') || url.includes('<password>') || url.includes('<cluster>')) {
    throw new Error(
      'DATABASE_URL still contains placeholder values. Replace <user>, <password>, and <cluster> in .env.',
    );
  }

  await prisma.$connect();
  await prisma.$runCommandRaw({ ping: 1 });
  return prisma;
}
