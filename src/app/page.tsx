import type React from "react";
import Link from "next/link";
import { Cpu, ShieldCheck, QrCode, ClipboardList } from "lucide-react";
import { RegistrationForm } from "@/components/registration/registration-form";

export default function Home() {
  return (
    <main className="flex-1">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <Cpu className="h-6 w-6 text-primary" />
            <span className="font-display text-lg font-bold tracking-wide">ROBOFEST 2.0</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/visitor/status" className="text-muted-foreground hover:text-foreground transition-colors">
              Check Status
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 pt-14 pb-6 text-center">
        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-primary" />
          Visitor Registration Open
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          RoboFest 2.0 — Visitor Pass Registration
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-muted-foreground">
          Students, faculty, content creators, industry professionals, and media — register below to
          request your official visitor pass. Review takes place shortly after submission.
        </p>

        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          <Feature icon={ClipboardList} title="Simple 4-Step Form" desc="Guided registration in under 3 minutes" />
          <Feature icon={ShieldCheck} title="Secure & Verified" desc="Every pass is reviewed by the organizing team" />
          <Feature icon={QrCode} title="Digital QR Pass" desc="Instant check-in at the venue once approved" />
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 pb-20">
        <RegistrationForm />
      </section>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} RoboFest 2.0. All rights reserved. ·{" "}
        <Link href="/admin/login" className="hover:text-foreground">
          Staff Login
        </Link>
      </footer>
    </main>
  );
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-4 text-left">
      <Icon className="mb-2 h-5 w-5 text-primary" />
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
