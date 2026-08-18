"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { UploadCloud, FileCheck2, X, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stepper } from "@/components/registration/stepper";
import {
  registrationFieldsSchema,
  type RegistrationFields,
  type RegistrationFieldsInput,
  validateAuthorizationLetter,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/validation/registration";
import { VISITOR_TYPE_LABELS, cn, PAYMENT_LINK_URL } from "@/lib/utils";

const STEP_FIELDS: (keyof RegistrationFieldsInput)[][] = [
  ["fullName", "phone", "email"],
  ["collegeName", "visitorType", "purposeOfVisit", "numberOfVisitors"],
  [],
  ["consent"],
];

export function RegistrationForm() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm<RegistrationFieldsInput, unknown, RegistrationFields>({
    resolver: zodResolver(registrationFieldsSchema),
    defaultValues: { numberOfVisitors: 1, consent: undefined },
    mode: "onTouched",
  });

  const values = watch();

  function handleFile(f: File | null) {
    if (!f) {
      setFile(null);
      return;
    }
    const check = validateAuthorizationLetter(f);
    if (!check.valid) {
      setFileError(check.error);
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(f);
  }

  async function goNext() {
    if (step === 3) {
      if (!file) {
        setFileError("Authorization letter is required");
        return;
      }
    }
    const fields = STEP_FIELDS[step - 1];
    const valid = fields.length === 0 ? true : await trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, 4));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function onSubmit(data: RegistrationFields) {
    if (!file) {
      setFileError("Authorization letter is required");
      setStep(3);
      return;
    }
    setSubmitting(true);
    try {
      const csrfRes = await fetch("/api/csrf");
      if (!csrfRes.ok) throw new Error("csrf");
      const { token } = await csrfRes.json();

      const fd = new FormData();
      fd.append("fullName", data.fullName);
      fd.append("phone", data.phone);
      fd.append("email", data.email);
      fd.append("collegeName", data.collegeName);
      fd.append("visitorType", data.visitorType);
      fd.append("purposeOfVisit", data.purposeOfVisit);
      fd.append("numberOfVisitors", String(data.numberOfVisitors));
      fd.append("consent", "true");
      fd.append("authorizationLetter", file);

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "x-csrf-token": token },
        body: fd,
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Registration failed. Please check your details and try again.");
        setSubmitting(false);
        return;
      }

      sessionStorage.setItem(
        "rf_confirmation",
        JSON.stringify({
          registrationId: json.registrationId,
          fullName: json.fullName,
          email: json.email,
          status: json.status,
        })
      );
      toast.success("Registration received! Redirecting you to payment...");
      window.location.href = PAYMENT_LINK_URL;
    } catch {
      toast.error("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <Card className="glow-border">
      <CardContent className="p-6 sm:p-8">
        <Stepper currentStep={step} />

        <form onSubmit={handleSubmit(onSubmit)}>
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold text-foreground">Visitor Details</h2>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" placeholder="e.g. Aditya Sharma" {...register("fullName")} aria-invalid={!!errors.fullName} />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      +91
                    </span>
                    <Input
                      id="phone"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="98765 43210"
                      className="pl-11"
                      {...register("phone")}
                      aria-invalid={!!errors.phone}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email ID *</Label>
                  <Input id="email" type="email" placeholder="you@example.com" {...register("email")} aria-invalid={!!errors.email} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold text-foreground">Organization Details</h2>
              <div className="space-y-2">
                <Label htmlFor="collegeName">College / Organization Name *</Label>
                <Input id="collegeName" placeholder="e.g. IIT Bombay / Acme Robotics" {...register("collegeName")} aria-invalid={!!errors.collegeName} />
                {errors.collegeName && <p className="text-xs text-destructive">{errors.collegeName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="visitorType">Visitor Type *</Label>
                <VisitorTypeSelect register={register} value={values.visitorType} />
                {errors.visitorType && <p className="text-xs text-destructive">{errors.visitorType.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="purposeOfVisit">Purpose of Visit *</Label>
                <Textarea
                  id="purposeOfVisit"
                  placeholder="Tell us why you're visiting RoboFest 2.0..."
                  {...register("purposeOfVisit")}
                  aria-invalid={!!errors.purposeOfVisit}
                />
                {errors.purposeOfVisit && <p className="text-xs text-destructive">{errors.purposeOfVisit.message}</p>}
              </div>
              <div className="space-y-2 max-w-[220px]">
                <Label htmlFor="numberOfVisitors">Number of Visitors *</Label>
                <Input
                  id="numberOfVisitors"
                  type="number"
                  min={1}
                  max={20}
                  defaultValue={1}
                  {...register("numberOfVisitors")}
                  aria-invalid={!!errors.numberOfVisitors}
                />
                {errors.numberOfVisitors && (
                  <p className="text-xs text-destructive">{errors.numberOfVisitors.message}</p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display text-lg font-semibold text-foreground">Authorization Letter</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Please upload an authorization letter issued by your college / organization (where
                applicable) confirming your visit to RoboFest 2.0. Independent guests may upload a
                signed self-declaration instead. Accepted formats: <strong>PDF, JPG, PNG</strong> — max{" "}
                <strong>5&nbsp;MB</strong>.
              </p>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  handleFile(e.dataTransfer.files?.[0] ?? null);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors",
                  dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                  fileError && "border-destructive/60"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
                {file ? (
                  <>
                    <FileCheck2 className="h-9 w-9 text-success" />
                    <p className="text-sm font-medium text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFile(null);
                      }}
                    >
                      <X className="h-3.5 w-3.5" /> Remove
                    </Button>
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-9 w-9 text-primary" />
                    <p className="text-sm font-medium text-foreground">
                      Click to upload or drag & drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, JPG or PNG — up to {MAX_FILE_SIZE_BYTES / 1024 / 1024} MB
                    </p>
                  </>
                )}
              </div>
              {fileError && <p className="text-xs text-destructive">{fileError}</p>}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="font-display text-lg font-semibold text-foreground">Review &amp; Confirm</h2>
              <div className="grid gap-x-6 gap-y-3 rounded-lg border border-border bg-secondary/30 p-5 text-sm sm:grid-cols-2">
                <SummaryRow label="Full Name" value={values.fullName} />
                <SummaryRow label="Phone" value={`+91 ${values.phone}`} />
                <SummaryRow label="Email" value={values.email} />
                <SummaryRow label="College / Organization" value={values.collegeName} />
                <SummaryRow
                  label="Visitor Type"
                  value={values.visitorType ? VISITOR_TYPE_LABELS[values.visitorType] : "—"}
                />
                <SummaryRow label="Number of Visitors" value={String(values.numberOfVisitors ?? 1)} />
                <SummaryRow label="Authorization Letter" value={file?.name ?? "—"} />
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground">Purpose of Visit</span>
                  <p className="mt-1 text-foreground">{values.purposeOfVisit}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <Checkbox
                  id="consent"
                  onCheckedChange={(v) => {
                    const event = { target: { name: "consent", value: v === true } };
                    register("consent").onChange(event as never);
                  }}
                />
                <Label htmlFor="consent" className="cursor-pointer text-sm font-normal leading-relaxed">
                  I confirm that the information provided is accurate and I agree to the RoboFest 2.0
                  visitor guidelines.
                </Label>
              </div>
              {errors.consent && <p className="text-xs text-destructive">{errors.consent.message}</p>}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
            <Button type="button" variant="outline" onClick={goBack} disabled={step === 1 || submitting}>
              Back
            </Button>
            {step < 4 ? (
              <Button type="button" onClick={goNext}>
                Continue
              </Button>
            ) : (
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Submit Registration
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}</span>
      <p className="mt-0.5 font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

function VisitorTypeSelect({
  register,
  value,
}: {
  register: ReturnType<typeof useForm<RegistrationFieldsInput, unknown, RegistrationFields>>["register"];
  value: string | undefined;
}) {
  const { onChange, name } = register("visitorType");
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange({ target: { name, value: v } })}
    >
      <SelectTrigger id="visitorType">
        <SelectValue placeholder="Select visitor type" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(VISITOR_TYPE_LABELS).map(([key, label]) => (
          <SelectItem key={key} value={key}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
