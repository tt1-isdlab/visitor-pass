import { CheckCircle2, XCircle, Cpu } from "lucide-react";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VISITOR_TYPE_LABELS, STATUS_LABELS, cn } from "@/lib/utils";

export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ registrationId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { registrationId } = await params;
  const { t } = await searchParams;

  const registration = t
    ? await prisma.visitorRegistration.findFirst({
        where: {
          registrationId: registrationId.toUpperCase(),
          qrToken: t,
        },
        select: {
          registrationId: true,
          fullName: true,
          collegeName: true,
          visitorType: true,
          status: true,
        },
      })
    : null;

  const isValid = !!registration && (registration.status === "APPROVED" || registration.status === "CHECKED_IN");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className={cn("w-full max-w-md glow-border")}>
        <CardContent className="p-8 text-center">
          <div className="mb-6 flex items-center justify-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            <span className="font-display text-sm font-bold tracking-wide">ROBOFEST 2.0</span>
          </div>

          <div
            className={cn(
              "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full",
              isValid ? "bg-success/10" : "bg-destructive/10"
            )}
          >
            {isValid ? (
              <CheckCircle2 className="h-9 w-9 text-success" />
            ) : (
              <XCircle className="h-9 w-9 text-destructive" />
            )}
          </div>

          <h1 className={cn("font-display text-2xl font-bold", isValid ? "text-success" : "text-destructive")}>
            {isValid ? "VALID PASS" : "INVALID PASS"}
          </h1>

          {registration ? (
            <div className="mt-6 space-y-3 rounded-lg border border-border bg-secondary/30 p-5 text-left text-sm">
              <Row label="Visitor Name" value={registration.fullName} />
              <Row label="College / Organization" value={registration.collegeName} />
              <Row label="Visitor Type" value={VISITOR_TYPE_LABELS[registration.visitorType]} />
              <Row label="Registration ID" value={registration.registrationId} mono />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={isValid ? "success" : "destructive"}>{STATUS_LABELS[registration.status]}</Badge>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              This QR code could not be verified. It may be expired, tampered with, or not
              recognized by the RoboFest 2.0 system.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium text-foreground", mono && "font-mono text-primary")}>{value}</span>
    </div>
  );
}
