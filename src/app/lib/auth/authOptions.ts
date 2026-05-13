import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Adapter } from 'next-auth/adapters';
import { prisma, isDatabaseConfigured } from '@/app/lib/db/prisma';

export const authOptions: NextAuthOptions = {
  adapter: isDatabaseConfigured() ? (PrismaAdapter(prisma) as Adapter) : undefined,
  session: {
    strategy: isDatabaseConfigured() ? 'database' : 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Admin',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const expected = process.env.ADMIN_PASSWORD || 'admin';
        if (!credentials?.email || credentials.password !== expected || !isDatabaseConfigured()) return null;

        const user = await prisma.user.upsert({
          where: { email: credentials.email },
          update: {},
          create: {
            email: credentials.email,
            name: credentials.email.split('@')[0],
            role: 'admin',
          },
        });

        await prisma.userWallet.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id },
        });

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
