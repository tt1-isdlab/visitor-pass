import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { queueEmail, renderApprovedEmail } from "@/lib/email";
import { env } from "@/lib/env";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await params;
  const existing = await prisma.visitorRegistration.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "UNDER_REVIEW") {
    return NextResponse.json({ error: "Only applications under review can be approved" }, { status: 400 });
  }

  const registration = await prisma.visitorRegistration.update({
    where: { id },
    data: {
      status: "APPROVED",
      rejectionReason: null,
      reviewedById: gate.user.id,
      reviewedAt: new Date(),
    },
  });

  const passUrl = `${env.APP_URL}/api/pass/${registration.registrationId}?email=${encodeURIComponent(registration.email)}`;
  const { subject, html, text } = renderApprovedEmail(registration, passUrl);
  await queueEmail({
    registrationId: registration.id,
    toEmail: registration.email,
    templateType: "APPROVED",
    subject,
    html,
    text,
  });

  return NextResponse.json({ registration });
}
