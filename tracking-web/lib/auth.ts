import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Email from 'next-auth/providers/email';
import { prisma } from './prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Email({
      from: process.env.EMAIL_FROM ?? 'OMS <no-reply@example.com>',
      server: process.env.EMAIL_SERVER ?? { host: 'localhost', port: 1025 },
      async sendVerificationRequest({ identifier, url }) {
        console.log(`[auth] Magic link for ${identifier}: ${url}`);
      }
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token }) {
      if (token.sub) {
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, sellerId: true, status: true }
        });

        if (user) {
          token.role = user.role;
          token.sellerId = user.sellerId;
          token.status = user.status;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = token.role ?? 'BUYER';
        session.user.sellerId = token.sellerId ?? null;
        session.user.status = token.status ?? 'INVITED';
      }

      return session;
    }
  },
  pages: { signIn: '/login' }
});