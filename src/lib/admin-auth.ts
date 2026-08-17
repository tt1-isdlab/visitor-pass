import { auth } from "@/auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }
  return { ok: true as const, user: session.user };
}

export async function requireSuperAdmin() {
  const result = await requireAdmin();
  if (!result.ok) return result;
  if (result.user.role !== "SUPER_ADMIN") {
    return { ok: false as const, status: 403, error: "Only SUPER_ADMIN can perform this action" };
  }
  return result;
}
