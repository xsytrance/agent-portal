import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Adapter } from 'next-auth/adapters';
import { prisma, isDatabaseConfigured } from '@/app/lib/db/prisma';
import { verifyPassword } from './password';

export const authOptions: NextAuthOptions = {
  adapter: isDatabaseConfigured() ? (PrismaAdapter(prisma) as Adapter) : undefined,
  session: {
    strategy: 'jwt',
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
        const email = credentials?.email?.toLowerCase();
        const allowedEmails = (process.env.ADMIN_EMAILS || '')
          .split(',')
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean);

        if (!email || !credentials?.password || !isDatabaseConfigured()) return null;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser?.passwordHash && await verifyPassword(credentials.password, existingUser.passwordHash)) {
          return { id: existingUser.id, email: existingUser.email, name: existingUser.name, role: existingUser.role };
        }

        if (credentials.password !== expected) return null;
        if (allowedEmails.length === 0 || !allowedEmails.includes(email)) return null;

        const user = await prisma.user.upsert({
          where: { email },
          update: { role: 'admin' },
          create: {
            email,
            name: email.split('@')[0],
            role: 'admin',
          },
        });

        await prisma.userWallet.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id },
        });

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? 'user';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? token.sub ?? '');
        session.user.role = typeof token.role === 'string' ? token.role : undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
