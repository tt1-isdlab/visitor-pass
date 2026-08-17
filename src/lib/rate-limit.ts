import { prisma } from "@/lib/db";

/**
 * Fixed-window rate limiter backed by Postgres so it works correctly across
 * multiple serverless instances (an in-memory Map would not).
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimitBucket.findUnique({ where: { key } });

    if (!existing) {
      await tx.rateLimitBucket.create({ data: { key, count: 1, windowStart: now } });
      return { allowed: true, remaining: limit - 1 };
    }

    const windowAgeMs = now.getTime() - existing.windowStart.getTime();
    if (windowAgeMs > windowSeconds * 1000) {
      await tx.rateLimitBucket.update({
        where: { key },
        data: { count: 1, windowStart: now },
      });
      return { allowed: true, remaining: limit - 1 };
    }

    if (existing.count >= limit) {
      return { allowed: false, remaining: 0 };
    }

    await tx.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return { allowed: true, remaining: limit - existing.count - 1 };
  });

  return result;
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
