import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { visitorStatusLookupSchema } from "@/lib/validation/registration";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyCsrfToken } from "@/lib/csrf";

export async function POST(req: NextRequest) {
  const csrfOk = await verifyCsrfToken(req.headers.get("x-csrf-token"));
  if (!csrfOk) {
    return NextResponse.json({ error: "Invalid security token. Refresh and try again." }, { status: 403 });
  }

  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(`status:${ip}`, 20, 300);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many lookups. Please wait a few minutes." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = visitorStatusLookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid Registration ID and email" }, { status: 400 });
  }

  const { registrationId, email } = parsed.data;

  const reg = await prisma.visitorRegistration.findFirst({
    where: {
      registrationId: registrationId.trim().toUpperCase(),
      email: { equals: email.trim(), mode: "insensitive" },
    },
    select: {
      registrationId: true,
      fullName: true,
      email: true,
      collegeName: true,
      visitorType: true,
      status: true,
      rejectionReason: true,
      numberOfVisitors: true,
      createdAt: true,
      checkedInAt: true,
    },
  });

  if (!reg) {
    return NextResponse.json(
      { error: "No application found for that Registration ID and email combination." },
      { status: 404 }
    );
  }

  return NextResponse.json({ registration: reg });
}
