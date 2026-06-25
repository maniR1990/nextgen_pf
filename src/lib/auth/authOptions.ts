import { prisma } from '@/lib/db/prisma';
import { AuthService } from '@/modules/auth';
import { AuthRepository } from '@/modules/auth/auth.repository';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import type { Provider } from 'next-auth/providers/index';

const providers: Provider[] = [
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;
      try {
        const { user } = await AuthService.login({
          email: credentials.email,
          password: credentials.password,
        });
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      } catch {
        return null;
      }
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider === 'credentials') return true;

      const email = user.email?.toLowerCase();
      if (!email) return false;

      const existing = await prisma.user.findUnique({ where: { email } });
      const dbUser = existing
        ? await prisma.user.update({
            where: { id: existing.id },
            data: {
              name: user.name ?? existing.name,
              image: user.image ?? existing.image,
              emailVerified: existing.emailVerified ?? new Date(),
            },
          })
        : await prisma.user.create({
            data: {
              email,
              name: user.name ?? email.split('@')[0],
              emailVerified: new Date(),
              image: user.image ?? undefined,
            },
          });

      await AuthRepository.upsertOAuthAccount({
        userId: dbUser.id,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        accessToken: account.access_token ?? undefined,
      });

      user.id = dbUser.id;
      (user as { role?: string }).role = dbUser.role;
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.oauth = account?.provider !== 'credentials';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
