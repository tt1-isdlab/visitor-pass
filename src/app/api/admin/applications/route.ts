import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const sp = req.nextUrl.searchParams;
  const search = sp.get("search")?.trim() ?? "";
  const status = sp.get("status") ?? "";
  const visitorType = sp.get("visitorType") ?? "";
  const dateFrom = sp.get("dateFrom") ?? "";
  const dateTo = sp.get("dateTo") ?? "";
  const page = Math.max(1, Number(sp.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize") ?? "20")));

  // STAFF may only browse approved / checked-in visitors (for check-in purposes).
  const roleFilter: Prisma.VisitorRegistrationWhereInput =
    gate.user.role === "STAFF" ? { status: { in: ["APPROVED", "CHECKED_IN"] } } : {};

  const where: Prisma.VisitorRegistrationWhereInput = {
    AND: [
      roleFilter,
      status ? { status: status as never } : {},
      visitorType ? { visitorType: visitorType as never } : {},
      dateFrom ? { createdAt: { gte: new Date(dateFrom) } } : {},
      dateTo ? { createdAt: { lte: new Date(`${dateTo}T23:59:59`) } } : {},
      search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { registrationId: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { collegeName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
    ],
  };

  const [items, totalCount] = await Promise.all([
    prisma.visitorRegistration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        registrationId: true,
        fullName: true,
        phone: true,
        email: true,
        collegeName: true,
        visitorType: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.visitorRegistration.count({ where }),
  ]);

  return NextResponse.json({
    items,
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize) || 1,
  });
}
