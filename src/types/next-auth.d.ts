import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "SUPER_ADMIN" | "STAFF";
    } & DefaultSession["user"];
  }

  interface User {
    role: "SUPER_ADMIN" | "STAFF";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "SUPER_ADMIN" | "STAFF";
    id: string;
  }
}
