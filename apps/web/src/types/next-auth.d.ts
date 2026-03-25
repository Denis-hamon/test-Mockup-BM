import "next-auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "avocat" | "client";
  }
  interface Session {
    user: {
      id: string;
      role: "avocat" | "client";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "avocat" | "client";
  }
}
