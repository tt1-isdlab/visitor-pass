"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Clock, CheckCircle2, XCircle, ScanLine, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Stats = {
  total: number;
  underReview: number;
  approved: number;
  rejected: number;
  checkedIn: number;
  today: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => undefined);
  }, []);

  const tiles = [
    { label: "Total Applications", value: stats?.total, icon: Users, color: "text-primary" },
    { label: "Under Review", value: stats?.underReview, icon: Clock, color: "text-warning" },
    { label: "Approved", value: stats?.approved, icon: CheckCircle2, color: "text-success" },
    { label: "Rejected", value: stats?.rejected, icon: XCircle, color: "text-destructive" },
    { label: "Checked In", value: stats?.checkedIn, icon: ScanLine, color: "text-accent" },
    { label: "Today's Applications", value: stats?.today, icon: CalendarDays, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">RoboFest 2.0 visitor pass overview</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {tile.label}
                </p>
                <p className="mt-1 font-display text-3xl font-bold text-foreground">
                  {tile.value ?? "—"}
                </p>
              </div>
              <tile.icon className={`h-8 w-8 ${tile.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/applications"
          className="rounded-md border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
        >
          View All Applications →
        </Link>
        <Link
          href="/admin/check-in"
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
        >
          Open Check-In Scanner →
        </Link>
      </div>
    </div>
  );
}
