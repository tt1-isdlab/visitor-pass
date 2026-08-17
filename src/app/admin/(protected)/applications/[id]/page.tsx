"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ScanLine,
  FileText,
  Download,
  Loader2,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { VISITOR_TYPE_LABELS, STATUS_LABELS, formatDate } from "@/lib/utils";

type Registration = {
  id: string;
  registrationId: string;
  fullName: string;
  phone: string;
  email: string;
  collegeName: string;
  visitorType: string;
  purposeOfVisit: string;
  numberOfVisitors: number;
  status: string;
  rejectionReason: string | null;
  adminNote: string | null;
  createdAt: string;
  checkedInAt: string | null;
  authorizationLetterOriginalName: string;
  reviewedBy: { name: string; email: string } | null;
  checkedInBy: { name: string; email: string } | null;
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

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [reg, setReg] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/applications/${id}`);
    if (res.ok) {
      const json = await res.json();
      setReg(json.registration);
      setNote(json.registration.adminNote ?? "");
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time fetch on mount/id change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function act(action: "approve" | "reject" | "checkin", body?: object) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/applications/${id}/${action}`, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === "ALREADY_CHECKED_IN") {
          toast.warning(`Already checked in at ${formatDate(json.checkedInAt)}`);
        } else {
          toast.error(json.error ?? "Action failed");
        }
        return;
      }
      toast.success("Updated successfully");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function saveNote() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/applications/${id}/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) toast.error("Failed to save note");
      else toast.success("Note saved");
    } finally {
      setBusy(false);
    }
  }

  async function viewLetter() {
    const res = await fetch(`/api/admin/applications/${id}/letter`);
    if (!res.ok) {
      toast.error("Failed to load letter");
      return;
    }
    const { url } = await res.json();
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (loading || !reg) {
    return <p className="text-sm text-muted-foreground">Loading application...</p>;
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/applications" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to applications
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl font-bold text-primary">{reg.registrationId}</h1>
          <p className="text-sm text-muted-foreground">{reg.fullName}</p>
        </div>
        <Badge variant={statusVariant(reg.status)} className="text-sm">
          {STATUS_LABELS[reg.status]}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Visitor Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <Field label="Full Name" value={reg.fullName} />
              <Field label="Phone" value={`+91 ${reg.phone}`} />
              <Field label="Email" value={reg.email} />
              <Field label="College / Organization" value={reg.collegeName} />
              <Field label="Visitor Type" value={VISITOR_TYPE_LABELS[reg.visitorType]} />
              <Field label="Number of Visitors" value={String(reg.numberOfVisitors)} />
              <Field label="Submission Date" value={formatDate(reg.createdAt)} />
              {reg.checkedInAt && <Field label="Checked In At" value={formatDate(reg.checkedInAt)} />}
              <div className="sm:col-span-2">
                <span className="text-xs text-muted-foreground">Purpose of Visit</span>
                <p className="mt-1 text-foreground">{reg.purposeOfVisit}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authorization Letter</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{reg.authorizationLetterOriginalName}</p>
                  <p className="text-xs text-muted-foreground">Securely stored — signed link expires in 2 minutes</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={viewLetter}>
                <Download className="h-3.5 w-3.5" /> View / Download
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internal Admin Note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Internal notes visible only to admins..."
              />
              <Button size="sm" variant="outline" onClick={saveNote} disabled={busy}>
                <Save className="h-3.5 w-3.5" /> Save Note
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reg.status === "UNDER_REVIEW" && (
                <>
                  <Button
                    className="w-full"
                    variant="success"
                    disabled={busy}
                    onClick={() => act("approve")}
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Approve
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="w-full" variant="destructive" disabled={busy}>
                        <XCircle className="h-4 w-4" /> Reject
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject Application</AlertDialogTitle>
                        <AlertDialogDescription>
                          Provide a reason. This will be shown to the visitor by email.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-2">
                        <Label htmlFor="reason">Rejection Reason</Label>
                        <Textarea
                          id="reason"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="e.g. Authorization letter could not be verified"
                        />
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => act("reject", { reason: rejectReason })}
                          disabled={rejectReason.trim().length < 3}
                        >
                          Confirm Reject
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}

              {reg.status === "APPROVED" && (
                <>
                  <Button className="w-full" disabled={busy} onClick={() => act("checkin")}>
                    <ScanLine className="h-4 w-4" /> Mark as Checked In
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <a href={`/api/pass/${reg.registrationId}`} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" /> Download Visitor Pass
                    </a>
                  </Button>
                </>
              )}

              {reg.status === "CHECKED_IN" && (
                <div className="rounded-md border border-success/30 bg-success/10 p-3 text-center text-sm text-success">
                  Checked in {reg.checkedInAt ? formatDate(reg.checkedInAt) : ""}
                </div>
              )}

              {reg.status === "REJECTED" && reg.rejectionReason && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  Reason: {reg.rejectionReason}
                </div>
              )}
            </CardContent>
          </Card>

          {(reg.reviewedBy || reg.checkedInBy) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Audit Trail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                {reg.reviewedBy && <p>Reviewed by {reg.reviewedBy.name}</p>}
                {reg.checkedInBy && <p>Checked in by {reg.checkedInBy.name}</p>}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="mt-0.5 font-medium text-foreground">{value}</p>
    </div>
  );
}
