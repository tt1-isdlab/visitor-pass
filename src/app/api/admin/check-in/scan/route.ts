import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const bodySchema = z.object({ qrUrl: z.string().min(1) });

function parseQrUrl(raw: string): { registrationId: string; token: string } | null {
  try {
    const url = new URL(raw);
    const match = url.pathname.match(/\/verify\/([^/]+)/);
    const token = url.searchParams.get("t");
    if (!match || !token) return null;
    return { registrationId: decodeURIComponent(match[1]).toUpperCase(), token };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid QR payload" }, { status: 400 });

  const parsedUrl = parseQrUrl(parsed.data.qrUrl);
  if (!parsedUrl) {
    return NextResponse.json({ valid: false, error: "Unrecognized QR code" }, { status: 400 });
  }

  const registration = await prisma.visitorRegistration.findFirst({
    where: { registrationId: parsedUrl.registrationId, qrToken: parsedUrl.token },
    select: {
      id: true,
      registrationId: true,
      fullName: true,
      collegeName: true,
      visitorType: true,
      status: true,
      checkedInAt: true,
    },
  });

  if (!registration) {
    return NextResponse.json({ valid: false, error: "QR code not recognized or invalid" }, { status: 404 });
  }

  if (!["APPROVED", "CHECKED_IN"].includes(registration.status)) {
    return NextResponse.json(
      { valid: false, error: `Pass is not valid for entry (status: ${registration.status})` },
      { status: 403 }
    );
  }

  return NextResponse.json({ valid: true, registration });
}
