import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export function isDatabaseConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for Prisma operations');
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? (isDatabaseConfigured()
  ? createPrismaClient()
  : (new Proxy({}, {
      get() {
        throw new Error('DATABASE_URL is required for Prisma operations');
      },
    }) as PrismaClient));

if (process.env.NODE_ENV !== 'production' && isDatabaseConfigured()) {
  globalForPrisma.prisma = prisma;
}
