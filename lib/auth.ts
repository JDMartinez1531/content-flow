import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { Session, JWT } from "next-auth";
import type { User } from "next-auth";

/**
 * Auth.js (NextAuth v5) configuration with Credentials provider
 * Supports multi-user authentication with role-based access
 *
 * Row-level security is enforced at the database query level by checking userId
 */

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" },
      },
      /**
       * Authorize function — validates user credentials
       * Called when user submits login form
       */
      async authorize(credentials) {
        // Validate inputs
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        try {
          // Look up user by email
          const emailLower = (credentials.email as string).toLowerCase().trim();
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, emailLower))
            .limit(1);

          if (!user) {
            console.error("[auth] User not found:", credentials.email);
            return null;
          }

          // Compare provided password with stored bcrypt hash
          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );

          if (!passwordMatch) {
            console.error("[auth] Password mismatch for:", credentials.email);
            return null;
          }

          // Return user object if auth succeeds
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("[auth] Error:", error);
          return null;
        }
      },
    }),
  ],

  pages: {
    signIn: "/login",
  },

  /**
   * Callbacks — customize session/JWT behavior
   */
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = request.nextUrl.pathname.startsWith("/login");
      const isPublicApi = request.nextUrl.pathname.startsWith("/api/health");

      if (isPublicApi) return true;
      if (isOnLogin) return true; // Always allow login page
      return isLoggedIn; // Redirect to login if not authenticated
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.role = (token.role as "admin" | "editor") || "editor";
      }
      return session;
    },

    /**
     * JWT callback — called when JWT is created/updated
     * Store user info in JWT token
     */
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 1 day
  },

  jwt: {
    secret: process.env.AUTH_SECRET,
  },
});

/**
 * Extended session type to include custom fields
 * Use this in API routes: const session = await auth() as ExtendedSession
 */
export type ExtendedSession = Session & {
  user: Session["user"] & {
    id: string;
    role: "admin" | "editor";
  };
};
