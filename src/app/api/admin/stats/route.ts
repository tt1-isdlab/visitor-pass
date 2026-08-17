import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [total, underReview, approved, rejected, checkedIn, today] = await Promise.all([
    prisma.visitorRegistration.count(),
    prisma.visitorRegistration.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.visitorRegistration.count({ where: { status: "APPROVED" } }),
    prisma.visitorRegistration.count({ where: { status: "REJECTED" } }),
    prisma.visitorRegistration.count({ where: { status: "CHECKED_IN" } }),
    prisma.visitorRegistration.count({ where: { createdAt: { gte: startOfDay } } }),
  ]);

  return NextResponse.json({ total, underReview, approved, rejected, checkedIn, today });
}
