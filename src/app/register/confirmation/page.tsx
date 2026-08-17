"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Confirmation = {
  registrationId: string;
  fullName: string;
  email: string;
  status: string;
};

export default function ConfirmationPage() {
  const [data, setData] = useState<Confirmation | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("rf_confirmation");
    // One-time bootstrap of client-only state from sessionStorage on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (raw) setData(JSON.parse(raw));
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  if (!data) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <Card className="max-w-md text-center">
          <CardContent className="p-8">
            <p className="text-muted-foreground">
              No recent registration found in this session. Use the status page to look up an
              existing application.
            </p>
            <Button asChild className="mt-6">
              <Link href="/visitor/status">Check Application Status</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-lg glow-border">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-9 w-9 text-success" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Registration Submitted!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Thank you, {data.fullName}. Your RoboFest 2.0 visitor pass application has been received.
          </p>

          <div className="mt-6 space-y-3 rounded-lg border border-border bg-secondary/30 p-5 text-left text-sm">
            <Row label="Registration ID">
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-primary">{data.registrationId}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(data.registrationId);
                    toast.success("Registration ID copied");
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </Row>
            <Row label="Name">{data.fullName}</Row>
            <Row label="Email">{data.email}</Row>
            <Row label="Status">
              <Badge variant="warning">UNDER REVIEW</Badge>
            </Row>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            We&apos;ve emailed a confirmation to {data.email}. Save your Registration ID — you&apos;ll
            need it (with your email) to check your status and download your pass once approved.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
            <Button asChild>
              <Link href="/visitor/status">Check Status</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
