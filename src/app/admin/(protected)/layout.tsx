import type React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Cpu, LayoutDashboard, Users, QrCode, Download, LogOut } from "lucide-react";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/40 md:flex">
        <div className="flex items-center gap-2 border-b border-border px-6 py-5">
          <Cpu className="h-5 w-5 text-primary" />
          <span className="font-display text-sm font-bold tracking-wide">ROBOFEST ADMIN</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          <NavLink href="/admin" icon={LayoutDashboard} label="Dashboard" />
          <NavLink href="/admin/applications" icon={Users} label="Applications" />
          <NavLink href="/admin/check-in" icon={QrCode} label="Check-In Scanner" />
          {session.user.role === "SUPER_ADMIN" && (
            <a
              href="/api/admin/export"
              className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Download className="h-4 w-4" /> Export CSV
            </a>
          )}
        </nav>
        <div className="border-t border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{session.user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
            </div>
            <Badge variant={session.user.role === "SUPER_ADMIN" ? "default" : "secondary"}>
              {session.user.role === "SUPER_ADMIN" ? "Super Admin" : "Staff"}
            </Badge>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <Button type="submit" variant="outline" size="sm" className="w-full">
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            <span className="font-display text-sm font-bold">ROBOFEST ADMIN</span>
          </div>
          <Link href="/admin/check-in" className="text-xs text-primary">
            Scan
          </Link>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function NavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
