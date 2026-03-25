import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/auth";
import { loginSchema } from "@legalconnect/shared";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days per D-05
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const { email, password } = loginSchema.parse(credentials);
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });
        if (!user || !user.passwordHash) return null;
        if (!user.emailVerified) return null; // Must verify email first
        if (user.deletedAt) return null; // Soft-deleted users cannot log in
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;
        return { id: user.id, email: user.email, role: user.role, name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.role = token.role as "avocat" | "client";
      session.user.id = token.sub!;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
});
