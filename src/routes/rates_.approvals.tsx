import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ClipboardCheck, TrendingUp } from "lucide-react";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import {
  hydrateAdminRateRequestsFromApi,
  REQUEST_STATUS_LABEL,
  REQUEST_STATUS_TONE,
  type RateRequest,
  type RateRequestStatus,
} from "@/lib/admin-rates-data";

export const Route = createFileRoute("/rates_/approvals")({
  head: () => ({
    meta: [
      { title: "Rate approval queue — Kipit Admin Console" },
      {
        name: "description",
        content: "Second-approver queue for pending Kipit tenor band rate changes with effective dates.",
      },
      { property: "og:title", content: "Rate approval queue — Kipit Admin Console" },
      { property: "og:description", content: "Checker step of the Kipit rate change workflow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RateApprovalsPage,
});

const TABS: ("all" | RateRequestStatus)[] = ["awaiting", "approved", "rejected", "all"];

function fmtDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function RateApprovalsPage() {
  const [tab, setTab] = useState<"all" | RateRequestStatus>("awaiting");
  const [requests, setRequests] = useState<RateRequest[]>([]);

  useEffect(() => {
    void hydrateAdminRateRequestsFromApi().then(setRequests);
  }, []);

  const rows = requests.filter((r) => tab === "all" || r.status === tab);
  const awaiting = requests.filter((r) => r.status === "awaiting");

  return (
    <AdminShell title="Rate approval queue" subtitle="ADM-072 · checker step, second approver required">
      <Link
        to="/rates"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to rate table
      </Link>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat
          label="Awaiting approval"
          value={String(awaiting.length)}
          helper="Submitted by treasury makers"
          tone="gold"
          icon={ClipboardCheck}
        />
        <Stat
          label="Largest move"
          value={
            awaiting.length
              ? `${Math.max(
                  ...awaiting.map((r) => Math.abs(r.proposedRate - r.currentRate) * 100),
                ).toFixed(0)}bps`
              : "—"
            }
          helper="Across pending proposals"
          tone="brand"
          icon={TrendingUp}
        />
        <Stat
          label="Decided this quarter"
          value={String(requests.filter((r) => r.status !== "awaiting").length)}
          helper="Approved and rejected changes"
        />
      </div>

      <Panel className="mt-5 overflow-hidden">
        <div className="-m-5">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/70 px-5 py-4">
            <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
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
                  {t === "all" ? "All" : REQUEST_STATUS_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[62rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="px-5 py-2.5">Rate band</th>
                  <th className="px-5 py-2.5 text-right">Current</th>
                  <th className="px-5 py-2.5 text-right">Proposed</th>
                  <th className="px-5 py-2.5">Submitted by</th>
                  <th className="px-5 py-2.5">Effective date</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const delta = (r.proposedRate - r.currentRate) * 100;
                  return (
                    <tr key={r.id} className="border-b border-border/60 transition hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <span className="block text-[13.5px] font-bold">{r.band}</span>
                        <span className="block text-[12px] text-muted-foreground">
                          {r.product} · {r.id.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-[13px] tabular-nums text-muted-foreground">
                        {r.currentRate.toFixed(2)}%
                      </td>
                      <td className="px-5 py-3 text-right text-[14px] font-extrabold tabular-nums text-brand">
                        {r.proposedRate.toFixed(2)}%
                        <span
                          className={`ml-1.5 text-[11.5px] font-bold ${
                            delta > 0 ? "text-emerald-600" : "text-destructive"
                          }`}
                        >
                          {delta > 0 ? "+" : ""}
                          {delta.toFixed(0)}bps
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[13px]">
                        <span className="block font-semibold">{r.submittedBy}</span>
                        <span className="block text-[12px] text-muted-foreground">{r.submittedAt}</span>
                      </td>
                      <td className="px-5 py-3 text-[13px]">{fmtDate(r.effectiveDate)}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${REQUEST_STATUS_TONE[r.status]}`}
                        >
                          {REQUEST_STATUS_LABEL[r.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          to="/rates/approvals/$requestId"
                          params={{ requestId: r.id }}
                          className="rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-bold transition hover:border-brand/40 hover:text-brand"
                        >
                          {r.status === "awaiting" ? "Review" : "View"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 ? (
              <p className="px-5 py-14 text-center text-[13px] text-muted-foreground">
                Nothing in this view.
              </p>
            ) : null}
          </div>
        </div>
      </Panel>
    </AdminShell>
  );
}
