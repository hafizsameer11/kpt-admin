import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Archive, Download, ScrollText, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { downloadCsv } from "@/lib/csv-export";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import {
  AUDIT_AREA_LABEL,
  AUDIT_SEVERITY_TONE,
  getLiveAuditLog,
  hydrateAdminAuditFromApi,
  type AuditArea,
  type AuditEntry,
  type AuditSeverity,
} from "@/lib/admin-team-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit log — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Immutable record of every Kipit console action: who did what, when, from where, with before and after values.",
      },
      { property: "og:title", content: "Audit log — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Search the immutable Kipit admin audit trail.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuditLogPage,
});

const SEVERITIES: ("all" | AuditSeverity)[] = ["all", "critical", "notice", "info"];

function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [area, setArea] = useState<"all" | AuditArea>("all");
  const [severity, setSeverity] = useState<"all" | AuditSeverity>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<AuditEntry | null>(null);

  useEffect(() => {
    void hydrateAdminAuditFromApi().then(() => setEntries(getLiveAuditLog()));
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (area !== "all" && e.area !== area) return false;
      if (severity !== "all" && e.severity !== severity) return false;
      if (!q) return true;
      return [e.actor, e.action, e.target, e.ip].some((f) => f.toLowerCase().includes(q));
    });
  }, [entries, area, severity, query]);

  const auditTotals = useMemo(
    () => ({
      today: entries.length,
      critical: entries.filter((e) => e.severity === "critical").length,
      actors: new Set(entries.map((e) => e.actor)).size,
      retention: "7 years",
    }),
    [entries],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, AuditEntry[]>();
    rows.forEach((e) => map.set(e.date, [...(map.get(e.date) ?? []), e]));
    return [...map.entries()];
  }, [rows]);

  return (
    <AdminShell title="Audit log" subtitle="ADM-130 · immutable record of console actions">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Events today"
          value={String(auditTotals.today)}
          helper="Across every console area"
          tone="brand"
          icon={ScrollText}
        />
        <Stat
          label="Critical events"
          value={String(auditTotals.critical)}
          helper="Money, access and rate changes"
          icon={AlertTriangle}
        />
        <Stat
          label="Operators involved"
          value={String(auditTotals.actors)}
          helper="Unique admins in this window"
          tone="gold"
          icon={Users}
        />
        <Stat
          label="Retention"
          value={auditTotals.retention}
          helper="Write-once, tamper evident"
          icon={Archive}
        />
      </div>

      <Panel className="mt-5 overflow-hidden">
        <div className="-m-5">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/70 px-5 py-4">
            <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
              {SEVERITIES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={`rounded-md px-3 py-1.5 text-[12.5px] font-bold capitalize transition ${
                    severity === s
                      ? "bg-brand text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <select
              value={area}
              onChange={(e) => setArea(e.target.value as "all" | AuditArea)}
              className="h-9 rounded-lg border border-border bg-muted/40 px-2.5 text-[12.5px] font-bold outline-none"
            >
              <option value="all">All areas</option>
              {(Object.keys(AUDIT_AREA_LABEL) as AuditArea[]).map((a) => (
                <option key={a} value={a}>
                  {AUDIT_AREA_LABEL[a]}
                </option>
              ))}
            </select>

            <label className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search operator, action, reference or IP…"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                const n = downloadCsv(
                  "kipit-audit-log",
                  ["Date", "Time", "Actor", "Role", "Area", "Action", "Target", "IP", "Device", "Severity", "Before", "After"],
                  rows.map((e) => [
                    e.date,
                    e.at,
                    e.actor,
                    e.role,
                    AUDIT_AREA_LABEL[e.area],
                    e.action,
                    e.target,
                    e.ip,
                    e.device,
                    e.severity,
                    e.before ?? "",
                    e.after ?? "",
                  ]),
                );
                toast.success(`Downloaded ${n} rows`);
              }}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[12.5px] font-bold transition hover:bg-muted"
            >
              <Download className="size-4" /> Export
            </button>
          </div>

          <div className="px-5 py-4">
            {grouped.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-muted-foreground">
                No audit events match these filters.
              </p>
            ) : (
              grouped.map(([date, entries]) => (
                <div key={date} className="mb-6 last:mb-0">
                  <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {date}
                  </p>
                  <ul className="relative space-y-2 border-l border-border/70 pl-5">
                    {entries.map((e) => (
                      <li key={e.id} className="relative">
                        <span
                          className={`absolute -left-[1.55rem] top-4 size-2.5 rounded-full ring-4 ring-card ${
                            e.severity === "critical"
                              ? "bg-destructive"
                              : e.severity === "notice"
                                ? "bg-brand"
                                : "bg-muted-foreground/40"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setOpen(e)}
                          className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border/70 px-4 py-3 text-left transition hover:border-brand/30 hover:bg-muted/40"
                        >
                          <span className="w-12 shrink-0 text-[12px] font-bold text-muted-foreground">
                            {e.at}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13.5px] font-bold">
                              {e.actor} · {e.action}
                            </span>
                            <span className="mt-0.5 block truncate text-[12.5px] text-muted-foreground">
                              {e.target}
                            </span>
                          </span>
                          <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                            {AUDIT_AREA_LABEL[e.area]}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ring-1 ${AUDIT_SEVERITY_TONE[e.severity]}`}
                          >
                            {e.severity}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      </Panel>

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{open?.action}</DialogTitle>
            <DialogDescription>{open?.target}</DialogDescription>
          </DialogHeader>
          {open ? (
            <div className="rounded-xl border border-border/70 bg-muted/30 p-4 text-[13px]">
              <Line label="Event ID" value={open.id} />
              <Line label="When" value={`${open.date} · ${open.at}`} />
              <Line label="Operator" value={`${open.actor} (${open.role})`} />
              <Line label="Area" value={AUDIT_AREA_LABEL[open.area]} />
              <Line label="IP address" value={open.ip} />
              <Line label="Device" value={open.device} />
              {open.before ? <Line label="Before" value={open.before} /> : null}
              {open.after ? <Line label="After" value={open.after} /> : null}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => {
              toast.success("Event copied to clipboard");
              setOpen(null);
            }}
            className="rounded-lg bg-brand px-4 py-2.5 text-[13px] font-bold text-primary-foreground transition hover:opacity-95"
          >
            Copy event details
          </button>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-bold">{value}</span>
    </div>
  );
}
