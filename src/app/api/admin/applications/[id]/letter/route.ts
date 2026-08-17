import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { getSignedLetterUrl } from "@/lib/storage";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await params;
  const registration = await prisma.visitorRegistration.findUnique({
    where: { id },
    select: { authorizationLetterPath: true, status: true },
  });
  if (!registration) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (gate.user.role === "STAFF" && !["APPROVED", "CHECKED_IN"].includes(registration.status)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const url = await getSignedLetterUrl(registration.authorizationLetterPath, 120);
  return NextResponse.json({ url });
}
