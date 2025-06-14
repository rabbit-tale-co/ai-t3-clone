import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import {
  createGuestUser,
  getUser,
  getUserById,
  getFullUserData,
} from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD, isDevelopmentEnvironment } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';
import { cookies } from 'next/headers';

export type UserType = 'guest' | 'regular' | 'pro' | 'admin';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);

        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const passwordsMatch = await compare(password, user.password);

        if (!passwordsMatch) return null;

        // Determine user type based on subscription status
        const hasPremium =
          user.subscriptionStatus === 'active' &&
          user.subscriptionCurrentPeriodEnd &&
          new Date(user.subscriptionCurrentPeriodEnd) > new Date();

        const userType: UserType = hasPremium ? 'pro' : 'regular';

        return { ...user, type: userType };
      },
    }),
    Credentials({
      id: 'guest',
      credentials: {},
      async authorize(_, req) {
        const cookieStore = await cookies();
        const existingGuestId = cookieStore.get('guest')?.value;

        if (existingGuestId) {
          const existingUser = await getUserById(existingGuestId);
          if (existingUser) {
            return { ...existingUser, type: 'guest' };
          }
        }

        const [guestUser] = await createGuestUser();
        cookieStore.set('guest', guestUser.id, {
          httpOnly: true,
          secure: !isDevelopmentEnvironment,
          maxAge: 60 * 60 * 24 * 30,
        });

        return { ...guestUser, type: 'guest' };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.type = token.type;

        // Get fresh user data from database
        try {
          const fullUserData = await getFullUserData(token.id);
          if (fullUserData) {
            session.user.name = fullUserData.full_name;
            session.user.email = fullUserData.email;
            session.user.image = fullUserData.avatar_url;
            session.user.type = fullUserData.type;
          }
        } catch (error) {
          console.error('Failed to get full user data in session:', error);
        }
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
});
