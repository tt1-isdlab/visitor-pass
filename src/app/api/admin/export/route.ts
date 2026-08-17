import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { formatDate } from "@/lib/utils";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const registrations = await prisma.visitorRegistration.findMany({
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Registration ID",
    "Name",
    "Phone",
    "Email",
    "College",
    "Visitor Type",
    "Purpose",
    "Number of Visitors",
    "Status",
    "Submitted At",
    "Checked In At",
  ];

  const rows = registrations.map((r) =>
    [
      r.registrationId,
      r.fullName,
      r.phone,
      r.email,
      r.collegeName,
      r.visitorType,
      r.purposeOfVisit,
      String(r.numberOfVisitors),
      r.status,
      formatDate(r.createdAt),
      r.checkedInAt ? formatDate(r.checkedInAt) : "",
    ]
      .map((v) => csvEscape(v))
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="robofest-visitor-registrations-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
