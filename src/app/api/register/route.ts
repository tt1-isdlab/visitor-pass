import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { registrationFieldsSchema, validateAuthorizationLetter } from "@/lib/validation/registration";
import { generateRegistrationId } from "@/lib/registration-id";
import { uploadAuthorizationLetter } from "@/lib/storage";
import { generateQrToken } from "@/lib/qr-token";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyCsrfToken } from "@/lib/csrf";
import { queueEmail, renderRegistrationReceivedEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const csrfOk = await verifyCsrfToken(req.headers.get("x-csrf-token"));
    if (!csrfOk) {
      return NextResponse.json(
        { error: "Invalid or missing security token. Please refresh the page and try again." },
        { status: 403 }
      );
    }

    const ip = getClientIp(req.headers);
    const rl = await checkRateLimit(`register:${ip}`, 5, 600); // 5 submissions / 10 min / IP
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts from this network. Please try again later." },
        { status: 429 }
      );
    }

    const formData = await req.formData();

    const raw = {
      fullName: formData.get("fullName")?.toString() ?? "",
      phone: formData.get("phone")?.toString() ?? "",
      email: formData.get("email")?.toString() ?? "",
      collegeName: formData.get("collegeName")?.toString() ?? "",
      visitorType: formData.get("visitorType")?.toString() ?? "",
      purposeOfVisit: formData.get("purposeOfVisit")?.toString() ?? "",
      numberOfVisitors: formData.get("numberOfVisitors")?.toString() ?? "1",
      consent: formData.get("consent")?.toString() === "true",
    };

    const parsed = registrationFieldsSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid form data", fieldErrors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const file = formData.get("authorizationLetter");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Authorization letter is required" }, { status: 400 });
    }
    const fileCheck = validateAuthorizationLetter(file);
    if (!fileCheck.valid) {
      return NextResponse.json({ error: fileCheck.error }, { status: 400 });
    }

    const data = parsed.data;

    // Duplicate check: same email + phone already under review or approved for this event.
    const existing = await prisma.visitorRegistration.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
        status: { in: ["UNDER_REVIEW", "APPROVED", "CHECKED_IN"] },
      },
      select: { registrationId: true, status: true },
    });
    if (existing) {
      return NextResponse.json(
        {
          error: `A registration already exists for this email or phone number (${existing.registrationId}, status: ${existing.status}). Use the Check Status page to view it.`,
        },
        { status: 409 }
      );
    }

    const registrationId = await generateRegistrationId();
    const qrToken = generateQrToken();
    const { path } = await uploadAuthorizationLetter(registrationId, file);

    const registration = await prisma.visitorRegistration.create({
      data: {
        registrationId,
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        collegeName: data.collegeName,
        visitorType: data.visitorType,
        authorizationLetterPath: path,
        authorizationLetterOriginalName: file.name,
        authorizationLetterMimeType: file.type,
        authorizationLetterSizeBytes: file.size,
        purposeOfVisit: data.purposeOfVisit,
        numberOfVisitors: data.numberOfVisitors,
        qrToken,
      },
    });

    const { subject, html, text } = renderRegistrationReceivedEmail(registration);
    await queueEmail({
      registrationId: registration.id,
      toEmail: registration.email,
      templateType: "REGISTRATION_RECEIVED",
      subject,
      html,
      text,
    });

    return NextResponse.json({
      registrationId: registration.registrationId,
      fullName: registration.fullName,
      email: registration.email,
      status: registration.status,
    });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Something went wrong while processing your registration. Please try again." },
      { status: 500 }
    );
  }
}
