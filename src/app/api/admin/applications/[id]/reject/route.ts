import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { queueEmail, renderRejectedEmail } from "@/lib/email";

const bodySchema = z.object({
  reason: z.string().trim().min(3, "Provide a rejection reason").max(500),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "A rejection reason is required" }, { status: 400 });
  }

  const existing = await prisma.visitorRegistration.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.status !== "UNDER_REVIEW") {
    return NextResponse.json({ error: "Only applications under review can be rejected" }, { status: 400 });
  }

  const registration = await prisma.visitorRegistration.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectionReason: parsed.data.reason,
      reviewedById: gate.user.id,
      reviewedAt: new Date(),
    },
  });

  const { subject, html, text } = renderRejectedEmail(registration);
  await queueEmail({
    registrationId: registration.id,
    toEmail: registration.email,
    templateType: "REJECTED",
    subject,
    html,
    text,
  });

  return NextResponse.json({ registration });
}
