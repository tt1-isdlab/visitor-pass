import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { buildVerificationUrl, generateQrCodeDataUrl } from "@/lib/qr-token";
import { VisitorPassDocument } from "@/components/pass/visitor-pass-document";
import { env } from "@/lib/env";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ registrationId: string }> }
) {
  const { registrationId } = await params;
  const email = req.nextUrl.searchParams.get("email");

  const registration = await prisma.visitorRegistration.findUnique({
    where: { registrationId: registrationId.toUpperCase() },
  });

  if (!registration) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  if (registration.status !== "APPROVED" && registration.status !== "CHECKED_IN") {
    return NextResponse.json({ error: "Visitor pass is not available yet" }, { status: 403 });
  }

  // Authorize: either an authenticated admin/staff session, or the visitor's own email.
  const session = await auth();
  const isAdmin = !!session?.user;
  const isOwner = email && email.toLowerCase() === registration.email.toLowerCase();

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Not authorized to access this pass" }, { status: 403 });
  }

  const verificationUrl = buildVerificationUrl(env.APP_URL, registration.registrationId, registration.qrToken);
  const qrDataUrl = await generateQrCodeDataUrl(verificationUrl);

  const buffer = await renderToBuffer(
    <VisitorPassDocument
      fullName={registration.fullName}
      collegeName={registration.collegeName}
      visitorType={registration.visitorType}
      registrationId={registration.registrationId}
      eventDate="RoboFest 2.0 — Event Days"
      qrDataUrl={qrDataUrl}
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${registration.registrationId}-visitor-pass.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
