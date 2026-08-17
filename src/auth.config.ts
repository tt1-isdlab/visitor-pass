import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config (no Prisma / bcrypt / Credentials provider) so it can
 * run inside middleware. The full config with the Credentials provider lives
 * in src/auth.ts and is only used in Node.js runtime API routes.
 */
export const authConfig = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/admin/login" },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id as string;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as "SUPER_ADMIN" | "STAFF";
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
