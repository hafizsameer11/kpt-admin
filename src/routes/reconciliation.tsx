import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  RefreshCw,
  Scale,
  Search,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import { compactNaira, naira } from "@/lib/admin-data";
import {
  RECON_SOURCES,
  RECON_STATUS_LABEL,
  RECON_STATUS_TONE,
  RECON_TREND,
  hydrateAdminReconFromApi,
  type ReconRecord,
  computeReconTotals,
} from "@/lib/admin-recon-data";

export const Route = createFileRoute("/reconciliation")({
  head: () => ({
    meta: [
      { title: "Reconciliation — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Compare payment provider records against the internal ledger: matched, unmatched, variance and investigating positions.",
      },
      { property: "og:title", content: "Reconciliation — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Daily reconciliation dashboard for Kipit provider settlements and ledger entries.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReconDashboard,
});

function ReconDashboard() {
  const [records, setRecords] = useState<ReconRecord[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    void hydrateAdminReconFromApi().then((rows) => {
      setRecords(rows);
      setTick((t) => t + 1);
    });
  }, []);

  const totals = computeReconTotals();
  const exceptions = records.filter(
    (r) => r.status === "unmatched" || r.status === "variance" || r.status === "investigating",
  );
  const matchRate = totals.total ? Math.round((totals.matched / totals.total) * 100) : 0;

  return (
    <AdminShell title="Reconciliation" subtitle="ADM-090 · provider records vs internal ledger">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Matched"
          value={String(totals.matched)}
          helper={`${matchRate}% of today's records`}
          tone="brand"
          icon={CheckCircle2}
        />
        <Stat
          label="Unmatched"
          value={String(totals.unmatched)}
          helper="No counterpart found"
          icon={AlertTriangle}
        />
        <Stat
          label="Variance value"
          value={naira(totals.varianceValue)}
          helper={`${totals.variance} records with a difference`}
          tone="gold"
          icon={Scale}
        />
        <Stat
          label="Investigating"
          value={String(totals.investigating)}
          helper="Open with provider or finance"
          icon={Search}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Panel title="Matched vs exceptions" eyebrow="Last 7 days" icon={Scale}>
          <div className="mt-4 h-[16rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={RECON_TREND} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={34} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="matched" name="Matched" fill="var(--brand)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="exceptions" name="Exceptions" fill="var(--gold)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Sources" eyebrow="Data feeds" icon={Database}>
          <ul className="mt-4 divide-y divide-border/70">
            {RECON_SOURCES.map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-bold">{s.name}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {s.records.toLocaleString("en-NG")} records · synced {s.lastSync}
                  </p>
                </div>
                <span className="text-[13px] font-extrabold tabular-nums">{compactNaira(s.value)}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => toast.success("Provider feeds re-synced", { description: "All sources up to date." })}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-[12.5px] font-bold transition hover:border-brand/40 hover:text-brand"
          >
            <RefreshCw className="size-4" />
            Re-sync sources
          </button>
        </Panel>
      </div>

      <Panel
        className="mt-5"
        title="Open exceptions"
        eyebrow="Needs action"
        icon={AlertTriangle}
        action={
          <Link
            to="/reconciliation/records"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-brand"
          >
            View all records
            <ArrowRight className="size-4" />
          </Link>
        }
      >
        <ul className="mt-4 divide-y divide-border/70">
          {exceptions.map((r) => (
            <li key={r.id}>
              <Link
                to="/reconciliation/records/$recordId"
                params={{ recordId: r.id }}
                className="flex items-center gap-3 py-3 transition hover:opacity-80"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold">
                    {r.customer} · {r.channel}
                  </p>
                  <p className="truncate text-[12px] text-muted-foreground">
                    {r.providerRef} vs {r.internalRef} · {r.source} · {r.date}
                  </p>
                </div>
                <span className="text-right text-[13px] font-extrabold tabular-nums">
                  {naira(Math.abs(r.providerAmount - r.ledgerAmount))}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${RECON_STATUS_TONE[r.status]}`}
                >
                  {RECON_STATUS_LABEL[r.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </AdminShell>
  );
}
