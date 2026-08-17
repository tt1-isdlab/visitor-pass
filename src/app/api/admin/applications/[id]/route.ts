import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await params;
  const registration = await prisma.visitorRegistration.findUnique({
    where: { id },
    include: {
      reviewedBy: { select: { name: true, email: true } },
      checkedInBy: { select: { name: true, email: true } },
      checkInRecords: { orderBy: { scannedAt: "desc" }, take: 10 },
    },
  });

  if (!registration) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (gate.user.role === "STAFF" && !["APPROVED", "CHECKED_IN"].includes(registration.status)) {
    return NextResponse.json({ error: "Not authorized to view this application" }, { status: 403 });
  }

  return NextResponse.json({ registration });
}
