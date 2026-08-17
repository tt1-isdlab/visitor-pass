"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { VISITOR_TYPE_LABELS, STATUS_LABELS, formatDate } from "@/lib/utils";

type Item = {
  id: string;
  registrationId: string;
  fullName: string;
  phone: string;
  email: string;
  collegeName: string;
  visitorType: string;
  status: string;
  createdAt: string;
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

const ALL = "__all__";

export default function ApplicationsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [visitorType, setVisitorType] = useState(ALL);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (search) params.set("search", search);
    if (status !== ALL) params.set("status", status);
    if (visitorType !== ALL) params.set("visitorType", visitorType);
    const res = await fetch(`/api/admin/applications?${params.toString()}`);
    const json = await res.json();
    setItems(json.items ?? []);
    setTotalPages(json.totalPages ?? 1);
    setTotalCount(json.totalCount ?? 0);
    setLoading(false);
  }, [page, search, status, visitorType]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Applications</h1>
        <p className="text-sm text-muted-foreground">{totalCount} total registrations</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, phone, email, college..."
            className="pl-10"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setPage(1);
            setStatus(v);
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={visitorType}
          onValueChange={(v) => {
            setPage(1);
            setVisitorType(v);
          }}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="All Visitor Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Visitor Types</SelectItem>
            {Object.entries(VISITOR_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Registration ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>College / Org</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          )}
          {!loading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                No applications found.
              </TableCell>
            </TableRow>
          )}
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-xs text-primary">{item.registrationId}</TableCell>
              <TableCell className="font-medium">{item.fullName}</TableCell>
              <TableCell className="text-muted-foreground">{item.phone}</TableCell>
              <TableCell className="text-muted-foreground">{item.email}</TableCell>
              <TableCell className="text-muted-foreground">{item.collegeName}</TableCell>
              <TableCell>{VISITOR_TYPE_LABELS[item.visitorType]}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(item.status)}>{STATUS_LABELS[item.status]}</Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</TableCell>
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/applications/${item.id}`}>
                    <Eye className="h-3.5 w-3.5" /> View
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
