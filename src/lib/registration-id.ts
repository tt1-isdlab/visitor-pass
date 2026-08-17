import { prisma } from "@/lib/db";

/** Generates a registration ID like RFV-2026-000123 using an atomic DB counter per year. */
export async function generateRegistrationId(): Promise<string> {
  const rows = await prisma.$queryRaw<{ next_registration_id: string }[]>`
    select next_registration_id()
  `;
  const id = rows[0]?.next_registration_id;
  if (!id) throw new Error("Failed to generate registration ID");
  return id;
}
