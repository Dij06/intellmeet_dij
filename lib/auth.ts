import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'intellmeet-dev-secret-change-in-prod',
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const email = credentials.email.trim().toLowerCase();

        // Allow instant passwordless demo user login
        if (email === 'demo@intellmeet.com' && (!credentials.password || credentials.password === 'demo123')) {
          return {
            id: 'demo-user',
            email: 'demo@intellmeet.com',
            name: 'Demo User',
            role: 'ADMIN',
          };
        }

        try {
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) return null;

          // Allow passwordless demo user login only for the built-in demo account
          if (email === 'demo@intellmeet.com' && !user.password) {
            return {
              id: user.id,
              email: user.email,
              name: user.name || 'Demo User',
              role: user.role,
            };
          }

          if (!credentials.password || !user.password) return null;
          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name || email.split('@')[0],
            role: user.role,
          };
        } catch {
          if (email === 'demo@intellmeet.com') {
            return {
              id: 'demo-user',
              email: 'demo@intellmeet.com',
              name: 'Demo User',
              role: 'ADMIN',
            };
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || 'MEMBER';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string; role?: string }).id = token.id as string;
        (session.user as { id?: string; role?: string }).role =
          (token.role as string) || 'MEMBER';
      }
      return session;
    },
  },
};

/**
 * Returns the authenticated user if signed in, or falls back to the demo user
 * so core demo functionality works without mandatory sign-up.
 */
export async function getCurrentOrDemoUser() {
  try {
    const session = await getServerSession(authOptions);
    const sessionEmail = session?.user?.email;

    if (sessionEmail) {
      const user = await prisma.user.findUnique({
        where: { email: sessionEmail.toLowerCase() },
      });
      if (user) return user;
    }

    let demoUser = await prisma.user.findUnique({
      where: { email: 'demo@intellmeet.com' },
    });

    if (!demoUser) {
      demoUser = await prisma.user.create({
        data: {
          email: 'demo@intellmeet.com',
          name: 'Demo User',
          role: 'ADMIN',
        },
      });
    }

    return demoUser;
  } catch {
    return {
      id: 'demo-user',
      email: 'demo@intellmeet.com',
      name: 'Demo User',
      role: 'ADMIN',
    };
  }
}
