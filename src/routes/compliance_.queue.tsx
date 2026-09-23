import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ClipboardList, Clock, Filter, Search, ShieldAlert, Timer } from "lucide-react";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import { Input } from "@/components/ui/input";
import {
  CASE_STATUS_LABEL,
  hydrateAdminKycQueueFromApi,
  type CasePriority,
  type CaseStatus,
  type ComplianceCase,
} from "@/lib/admin-compliance-data";

export const Route = createFileRoute("/compliance_/queue")({
  head: () => ({
    meta: [
      { title: "Verification queue — Kipit Admin Console" },
      {
        name: "description",
        content: "Tier 1 and Tier 2 verification submissions waiting for a Kipit reviewer decision.",
      },
      { property: "og:title", content: "Verification queue — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Work the Kipit KYC queue by tier, priority and SLA breach risk.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QueuePage,
});

const STATUS_FILTERS: (CaseStatus | "all")[] = ["all", "pending", "in-review", "escalated", "approved", "rejected"];

const PRIORITY_TONE: Record<CasePriority, string> = {
  urgent: "bg-destructive/10 text-destructive ring-destructive/20",
  high: "bg-gold/25 text-gold-foreground ring-gold/40",
  standard: "bg-muted text-muted-foreground ring-border",
};

const STATUS_TONE: Record<CaseStatus, string> = {
  pending: "bg-gold/25 text-gold-foreground ring-gold/40",
  "in-review": "bg-brand/10 text-brand ring-brand/20",
  escalated: "bg-destructive/10 text-destructive ring-destructive/20",
  approved: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20",
  rejected: "bg-muted text-muted-foreground ring-border",
};

export function CaseStatusPill({ status }: { status: CaseStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${STATUS_TONE[status]}`}>
      {CASE_STATUS_LABEL[status]}
    </span>
  );
}

function QueuePage() {
  const [cases, setCases] = useState<ComplianceCase[]>([]);
  const [status, setStatus] = useState<CaseStatus | "all">("all");
  const [tier, setTier] = useState<"all" | 1 | 2>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void hydrateAdminKycQueueFromApi().then(setCases);
  }, []);

  const rows = useMemo(
    () =>
      cases.filter((c) => {
        if (status !== "all" && c.status !== status) return false;
        if (tier !== "all" && c.tier !== tier) return false;
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return [c.name, c.email, c.id, c.trigger].some((v) => v.toLowerCase().includes(q));
      }),
    [cases, status, tier, query],
  );

  const open = cases.filter((c) => c.status === "pending" || c.status === "in-review");
  const breaching = cases.filter(
    (c) => c.slaHours > 0 && c.ageHours / c.slaHours > 0.75 && c.status !== "approved" && c.status !== "rejected",
  );

  return (
    <AdminShell title="Verification queue" subtitle="ADM-030 · Tier 1 and Tier 2 submissions awaiting decision">
      <Link
        to="/compliance"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-3.5" /> Compliance & KYC
      </Link>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Open cases" value={String(open.length)} helper="Pending and in review" tone="brand" icon={ClipboardList} />
        <Stat label="Near SLA breach" value={String(breaching.length)} helper="Over 75% of allowed time" tone="gold" icon={Timer} />
        <Stat label="Escalated" value={String(cases.filter((c) => c.status === "escalated").length)} helper="With the MLRO" icon={ShieldAlert} />
        <Stat label="Median decision" value="3h 42m" helper="Target under 6 hours" icon={Clock} />
      </div>

      <Panel className="mt-5" title="Queue" eyebrow="ADM-030" icon={Filter}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-muted/60 p-1">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-lg px-3 py-1.5 text-[12.5px] font-bold transition ${
                  status === s ? "bg-card text-brand shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "all" ? "All" : CASE_STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-muted/60 p-1">
            {(["all", 1, 2] as const).map((t) => (
              <button
                key={String(t)}
                type="button"
                onClick={() => setTier(t)}
                className={`rounded-lg px-3 py-1.5 text-[12.5px] font-bold transition ${
                  tier === t ? "bg-card text-brand shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "all" ? "All tiers" : `Tier ${t}`}
              </button>
            ))}
          </div>

          <div className="relative ml-auto min-w-[14rem] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email or case ID"
              className="h-10 pl-9"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[54rem] text-left">
            <thead>
              <tr className="border-b border-border/70 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                <th className="py-2.5 pr-3">Customer</th>
                <th className="py-2.5 pr-3">Tier</th>
                <th className="py-2.5 pr-3">Trigger</th>
                <th className="py-2.5 pr-3">Waiting</th>
                <th className="py-2.5 pr-3">Risk</th>
                <th className="py-2.5 pr-3">Assignee</th>
                <th className="py-2.5 pr-3">Status</th>
                <th className="py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((c) => {
                const sla = Math.min(1, c.ageHours / c.slaHours);
                return (
                  <tr key={c.id} className="group transition hover:bg-muted/40">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/10 text-[11px] font-extrabold text-brand">
                          {c.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-bold">{c.name}</p>
                          <p className="truncate text-[12px] text-muted-foreground">{c.id} · {c.submitted}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-[12.5px] font-bold">Tier {c.tier}</td>
                    <td className="py-3 pr-3 text-[12.5px] text-muted-foreground">{c.trigger}</td>
                    <td className="py-3 pr-3">
                      <p className="text-[12.5px] font-bold">{c.waiting}</p>
                      <span className="mt-1 block h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                        <span
                          className={`block h-full rounded-full ${sla > 0.75 ? "bg-destructive" : "bg-brand"}`}
                          style={{ width: `${Math.max(4, sla * 100)}%` }}
                        />
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ring-1 ${PRIORITY_TONE[c.priority]}`}>
                        {c.riskScore} · {c.priority}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-[12.5px] text-muted-foreground">{c.assignee}</td>
                    <td className="py-3 pr-3"><CaseStatusPill status={c.status} /></td>
                    <td className="py-3 text-right">
                      <Link
                        to="/compliance/queue/$caseId"
                        params={{ caseId: c.id }}
                        className="inline-flex items-center rounded-lg bg-brand px-3 py-1.5 text-[12px] font-bold text-primary-foreground transition hover:opacity-90"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {rows.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-muted-foreground">No cases match these filters.</p>
          ) : null}
        </div>
      </Panel>
    </AdminShell>
  );
}
