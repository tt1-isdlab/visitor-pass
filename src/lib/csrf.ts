import { randomBytes } from "crypto";
import { cookies } from "next/headers";

const CSRF_COOKIE = "rf_csrf";

export async function issueCsrfToken(): Promise<string> {
  const token = randomBytes(24).toString("hex");
  const store = await cookies();
  store.set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 30,
  });
  return token;
}

export async function verifyCsrfToken(headerToken: string | null): Promise<boolean> {
  if (!headerToken) return false;
  const store = await cookies();
  const cookieToken = store.get(CSRF_COOKIE)?.value;
  if (!cookieToken) return false;
  return cookieToken === headerToken;
}
