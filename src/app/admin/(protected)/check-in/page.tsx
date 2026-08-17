"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, XCircle, ScanLine, Loader2, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VISITOR_TYPE_LABELS, formatDate } from "@/lib/utils";

type ScanResult =
  | { state: "idle" }
  | { state: "loading" }
  | {
      state: "valid";
      registration: {
        id: string;
        registrationId: string;
        fullName: string;
        collegeName: string;
        visitorType: string;
        status: string;
        checkedInAt: string | null;
      };
    }
  | { state: "invalid"; message: string };

export default function CheckInScannerPage() {
  const scannerDivId = "qr-scanner-region";
  const [result, setResult] = useState<ScanResult>({ state: "idle" });
  const [checkingIn, setCheckingIn] = useState(false);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const processingRef = useRef(false);

  const handleScan = useCallback(async (qrUrl: string) => {
    setResult({ state: "loading" });
    try {
      const res = await fetch("/api/admin/check-in/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrUrl }),
      });
      const json = await res.json();
      if (!res.ok || !json.valid) {
        setResult({ state: "invalid", message: json.error ?? "Invalid QR code" });
        return;
      }
      setResult({ state: "valid", registration: json.registration });
    } catch {
      setResult({ state: "invalid", message: "Network error while validating QR code" });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;
      const scanner = new Html5Qrcode(scannerDivId);
      scannerRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText) => {
            if (processingRef.current) return;
            processingRef.current = true;
            await handleScan(decodedText);
            setTimeout(() => {
              processingRef.current = false;
            }, 2000);
          },
          () => undefined
        );
      } catch {
        toast.error("Unable to access camera. Check browser permissions.");
      }
    })();

    return () => {
      cancelled = true;
      scannerRef.current
        ?.stop()
        .then(() => scannerRef.current?.clear())
        .catch(() => undefined);
    };
  }, [handleScan]);

  async function confirmCheckIn() {
    if (result.state !== "valid") return;
    setCheckingIn(true);
    try {
      const res = await fetch(`/api/admin/applications/${result.registration.id}/checkin`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === "ALREADY_CHECKED_IN") {
          toast.warning(`Already checked in at ${formatDate(json.checkedInAt)}`);
        } else {
          toast.error(json.error ?? "Check-in failed");
        }
        return;
      }
      toast.success(`${result.registration.fullName} checked in!`);
      setResult({
        state: "valid",
        registration: { ...result.registration, status: "CHECKED_IN", checkedInAt: json.registration.checkedInAt },
      });
    } finally {
      setCheckingIn(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Check-In Scanner</h1>
        <p className="text-sm text-muted-foreground">Scan a visitor&apos;s QR code to verify and check them in.</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div id={scannerDivId} className="overflow-hidden rounded-lg" />
        </CardContent>
      </Card>

      {result.state === "loading" && (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 p-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Validating pass...
          </CardContent>
        </Card>
      )}

      {result.state === "invalid" && (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
            <XCircle className="h-10 w-10 text-destructive" />
            <p className="font-display text-lg font-bold text-destructive">INVALID PASS</p>
            <p className="text-sm text-muted-foreground">{result.message}</p>
            <Button variant="outline" size="sm" onClick={() => setResult({ state: "idle" })}>
              <RotateCcw className="h-3.5 w-3.5" /> Scan Again
            </Button>
          </CardContent>
        </Card>
      )}

      {result.state === "valid" && (
        <Card className="border-success/40 glow-border">
          <CardContent className="space-y-4 p-6 text-center">
            {result.registration.status === "CHECKED_IN" ? (
              <>
                <ScanLine className="mx-auto h-10 w-10 text-warning" />
                <p className="font-display text-lg font-bold text-warning">ALREADY CHECKED IN</p>
                {result.registration.checkedInAt && (
                  <p className="text-xs text-muted-foreground">at {formatDate(result.registration.checkedInAt)}</p>
                )}
              </>
            ) : (
              <>
                <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
                <p className="font-display text-lg font-bold text-success">VALID VISITOR PASS</p>
              </>
            )}

            <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-4 text-left text-sm">
              <Row label="Name" value={result.registration.fullName} />
              <Row label="College" value={result.registration.collegeName} />
              <Row label="Visitor Type" value={VISITOR_TYPE_LABELS[result.registration.visitorType]} />
              <Row label="Registration ID" value={result.registration.registrationId} mono />
            </div>

            {result.registration.status !== "CHECKED_IN" && (
              <Button className="w-full" onClick={confirmCheckIn} disabled={checkingIn}>
                {checkingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Check In
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setResult({ state: "idle" })}>
              <RotateCcw className="h-3.5 w-3.5" /> Scan Next
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono font-semibold text-primary" : "font-medium text-foreground"}>{value}</span>
    </div>
  );
}
