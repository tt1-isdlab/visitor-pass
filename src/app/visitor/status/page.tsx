"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { Search, Loader2, Download, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { VISITOR_TYPE_LABELS, STATUS_LABELS, formatDate } from "@/lib/utils";

type Registration = {
  registrationId: string;
  fullName: string;
  email: string;
  collegeName: string;
  visitorType: string;
  status: string;
  rejectionReason: string | null;
  numberOfVisitors: number;
  createdAt: string;
  checkedInAt: string | null;
};

function statusVariant(status: string) {
  switch (status) {
    case "APPROVED":
    case "CHECKED_IN":
      return "success" as const;
    case "REJECTED":
      return "destructive" as const;
    default:
      return "warning" as const;
  }
}

export default function VisitorStatusPage() {
  const [registrationId, setRegistrationId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Registration | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const csrfRes = await fetch("/api/csrf");
      const { token } = await csrfRes.json();
      const res = await fetch("/api/visitor-status", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": token },
        body: JSON.stringify({ registrationId, email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Lookup failed");
        return;
      }
      setResult(json.registration);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to registration
        </Link>

        <Card className="glow-border">
          <CardContent className="p-8">
            <h1 className="font-display text-2xl font-bold text-foreground">Check Application Status</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your Registration ID and the email you registered with.
            </p>

            <form onSubmit={handleLookup} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="registrationId">Registration ID</Label>
                <Input
                  id="registrationId"
                  placeholder="RFV-2026-000123"
                  value={registrationId}
                  onChange={(e) => setRegistrationId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Check Status
              </Button>
            </form>

            {error && (
              <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            {result && (
              <div className="mt-6 space-y-3 rounded-lg border border-border bg-secondary/30 p-5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-primary">{result.registrationId}</span>
                  <Badge variant={statusVariant(result.status)}>{STATUS_LABELS[result.status]}</Badge>
                </div>
                <DetailRow label="Name" value={result.fullName} />
                <DetailRow label="College / Organization" value={result.collegeName} />
                <DetailRow label="Visitor Type" value={VISITOR_TYPE_LABELS[result.visitorType]} />
                <DetailRow label="Submitted" value={formatDate(result.createdAt)} />
                {result.status === "REJECTED" && result.rejectionReason && (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive">
                    Reason: {result.rejectionReason}
                  </p>
                )}
                {result.checkedInAt && <DetailRow label="Checked In" value={formatDate(result.checkedInAt)} />}

                {(result.status === "APPROVED" || result.status === "CHECKED_IN") && (
                  <Button asChild className="w-full mt-2">
                    <a href={`/api/pass/${result.registrationId}?email=${encodeURIComponent(result.email)}`}>
                      <Download className="h-4 w-4" /> Download Visitor Pass
                    </a>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
