import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, Search } from "lucide-react";
import { toast } from "sonner";
import { downloadCsv } from "@/lib/csv-export";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel } from "@/components/kipit/AdminBits";
import { naira } from "@/lib/admin-data";
import {
  RECON_STATUS_LABEL,
  RECON_STATUS_TONE,
  hydrateAdminReconFromApi,
  type ReconRecord,
  type ReconStatus,
} from "@/lib/admin-recon-data";

export const Route = createFileRoute("/reconciliation_/records")({
  head: () => ({
    meta: [
      { title: "Reconciliation records — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Line-by-line comparison of provider references and internal ledger references with amounts, status and dates.",
      },
      { property: "og:title", content: "Reconciliation records — Kipit Admin Console" },
      { property: "og:description", content: "Detailed Kipit reconciliation ledger view." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReconRecordsPage,
});

const TABS: ("all" | ReconStatus)[] = [
  "all",
  "matched",
  "unmatched",
  "variance",
  "investigating",
  "resolved",
];

function ReconRecordsPage() {
  const [records, setRecords] = useState<ReconRecord[]>([]);
  const [tab, setTab] = useState<"all" | ReconStatus>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void hydrateAdminReconFromApi().then(setRecords);
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return records.filter((r) => {
      if (tab !== "all" && r.status !== tab) return false;
      if (!q) return true;
      return [r.providerRef, r.internalRef, r.customer, r.source].some((f) =>
        f.toLowerCase().includes(q),
      );
    });
  }, [records, tab, query]);

  return (
    <AdminShell title="Reconciliation records" subtitle="ADM-091 · provider reference vs internal reference">
      <Link
        to="/reconciliation"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to reconciliation
      </Link>

      <Panel className="overflow-hidden">
        <div className="-m-5">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/70 px-5 py-4">
            <div className="flex flex-wrap rounded-lg border border-border bg-muted/40 p-0.5">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-md px-3 py-1.5 text-[12.5px] font-bold transition ${
                    tab === t
                      ? "bg-brand text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "all" ? "All" : RECON_STATUS_LABEL[t]}
                </button>
              ))}
            </div>

            <label className="ml-auto flex min-w-[16rem] items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search reference, customer or source"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                const n = downloadCsv(
                  "kipit-reconciliation",
                  ["Provider ref", "Source", "Channel", "Internal ref", "Customer", "Provider amount", "Ledger amount", "Variance", "Date", "Status"],
                  rows.map((r) => [
                    r.providerRef,
                    r.source,
                    r.channel,
                    r.internalRef,
                    r.customer,
                    r.providerAmount,
                    r.ledgerAmount,
                    r.providerAmount - r.ledgerAmount,
                    r.date,
                    RECON_STATUS_LABEL[r.status],
                  ]),
                );
                toast.success(`Downloaded ${n} rows`);
              }}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-[12.5px] font-bold transition hover:border-brand/40 hover:text-brand"
            >
              <Download className="size-4" />
              Export
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[68rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="px-5 py-2.5">Provider reference</th>
                  <th className="px-5 py-2.5">Internal reference</th>
                  <th className="px-5 py-2.5 text-right">Provider amount</th>
                  <th className="px-5 py-2.5 text-right">Ledger amount</th>
                  <th className="px-5 py-2.5 text-right">Variance</th>
                  <th className="px-5 py-2.5">Date</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const variance = r.providerAmount - r.ledgerAmount;
                  return (
                    <tr key={r.id} className="border-b border-border/60 transition hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <span className="block text-[13.5px] font-bold">{r.providerRef}</span>
                        <span className="block text-[12px] text-muted-foreground">
                          {r.source} · {r.channel}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="block text-[13.5px] font-semibold">{r.internalRef}</span>
                        <span className="block text-[12px] text-muted-foreground">{r.customer}</span>
                      </td>
                      <td className="px-5 py-3 text-right text-[13px] tabular-nums">
                        {naira(r.providerAmount)}
                      </td>
                      <td className="px-5 py-3 text-right text-[13px] tabular-nums">
                        {naira(r.ledgerAmount)}
                      </td>
                      <td
                        className={`px-5 py-3 text-right text-[13px] font-extrabold tabular-nums ${
                          variance === 0 ? "text-muted-foreground" : "text-destructive"
                        }`}
                      >
                        {variance === 0 ? "—" : naira(Math.abs(variance))}
                      </td>
                      <td className="px-5 py-3 text-[13px]">{r.date}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${RECON_STATUS_TONE[r.status]}`}
                        >
                          {RECON_STATUS_LABEL[r.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          to="/reconciliation/records/$recordId"
                          params={{ recordId: r.id }}
                          className="rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-bold transition hover:border-brand/40 hover:text-brand"
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
              <p className="px-5 py-14 text-center text-[13px] text-muted-foreground">
                No records match this view.
              </p>
            ) : null}
          </div>
        </div>
      </Panel>
    </AdminShell>
  );
}
