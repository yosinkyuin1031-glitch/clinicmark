import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email:    { label: 'メールアドレス', type: 'email' },
        password: { label: 'パスワード', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            clinics: {
              include: { clinic: true },
            },
          },
        });

        if (!user || !user.isActive) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id:      user.id,
          name:    user.name,
          email:   user.email,
          role:    user.role,
          clinics: user.clinics.map((uc) => ({
            id:    uc.clinic.id,
            name:  uc.clinic.name,
            slug:  uc.clinic.slug,
            color: uc.clinic.color,
          })),
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id      = user.id;
        token.role    = (user as { role: string }).role;
        token.clinics = (user as { clinics: { id: string; name: string; slug: string; color: string }[] }).clinics;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id      = token.id as string;
        session.user.role    = token.role as string;
        session.user.clinics = token.clinics as {
          id: string; name: string; slug: string; color: string;
        }[];
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge:   8 * 60 * 60, // 8時間
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// next-auth の型拡張
declare module 'next-auth' {
  interface User {
    id: string;
    role: string;
    clinics: { id: string; name: string; slug: string; color: string }[];
  }
  interface Session {
    user: User & {
      id: string;
      role: string;
      clinics: { id: string; name: string; slug: string; color: string }[];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    clinics: { id: string; name: string; slug: string; color: string }[];
  }
}
