import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config (no DB imports).
 * Used by proxy.ts for route protection.
 */
export const authConfig = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days per D-05
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role as "avocat" | "client";
      session.user.id = token.sub!;
      return session;
    },
  },
  providers: [], // Populated in auth.ts with DB-dependent Credentials provider
} satisfies NextAuthConfig;
