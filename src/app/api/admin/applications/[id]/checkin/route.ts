import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await params;
  const existing = await prisma.visitorRegistration.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (existing.status === "CHECKED_IN") {
    return NextResponse.json(
      { error: "ALREADY_CHECKED_IN", checkedInAt: existing.checkedInAt },
      { status: 409 }
    );
  }
  if (existing.status !== "APPROVED") {
    return NextResponse.json({ error: "Only approved visitors can be checked in" }, { status: 400 });
  }

  const [registration] = await prisma.$transaction([
    prisma.visitorRegistration.update({
      where: { id },
      data: { status: "CHECKED_IN", checkedInAt: new Date(), checkedInById: gate.user.id },
    }),
    prisma.checkInRecord.create({
      data: { registrationId: id, scannedById: gate.user.id, result: "CHECKED_IN" },
    }),
  ]);

  return NextResponse.json({ registration });
}
