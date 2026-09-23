import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardCheck, FilePlus2, Scale, Search, SlidersHorizontal } from "lucide-react";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import {
  ADJUSTMENT_STATUS_LABEL,
  ADJUSTMENT_STATUS_TONE,
  ADJUSTMENT_TYPE_LABEL,
  hydrateAdminAdjustmentsFromApi,
  type AdjustmentRequest,
  type AdjustmentStatus,
} from "@/lib/admin-adjustments-data";

export const Route = createFileRoute("/adjustments")({
  head: () => ({
    meta: [
      { title: "Plan adjustments — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Maker-checker controlled adjustments to live Kipit investments, with mandatory reasons and immutable before and after records.",
      },
      { property: "og:title", content: "Plan adjustments — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Queue of proposed changes to live Kipit investment plans.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdjustmentsPage,
});

const TABS: ("all" | AdjustmentStatus)[] = ["awaiting", "approved", "rejected", "all"];

function AdjustmentsPage() {
  const [requests, setRequests] = useState<AdjustmentRequest[]>([]);
  const [investmentCount, setInvestmentCount] = useState(0);
  const [tab, setTab] = useState<"all" | AdjustmentStatus>("awaiting");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void hydrateAdminAdjustmentsFromApi().then((data) => {
      setRequests(data.requests);
      setInvestmentCount(data.investments.length);
    });
  }, []);

  const q = query.trim().toLowerCase();
  const rows = requests.filter(
    (r) =>
      (tab === "all" || r.status === tab) &&
      (q === "" ||
        [r.userName, r.product, r.reference, r.id, ADJUSTMENT_TYPE_LABEL[r.type]]
          .join(" ")
          .toLowerCase()
          .includes(q)),
  );

  const awaiting = requests.filter((r) => r.status === "awaiting");

  return (
    <AdminShell
      title="Plan adjustments"
      subtitle="ADM-080 · maker-checker controlled changes to live investments"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Awaiting approval"
          value={String(awaiting.length)}
          helper="Requires a second approver"
          tone="gold"
          icon={ClipboardCheck}
        />
        <Stat
          label="Rate changes pending"
          value={String(awaiting.filter((r) => r.type === "rate").length)}
          helper="Priced outside standard bands"
          tone="brand"
          icon={SlidersHorizontal}
        />
        <Stat
          label="Decided this month"
          value={String(requests.filter((r) => r.status !== "awaiting").length)}
          helper="Approved and rejected"
          icon={Scale}
        />
        <Stat
          label="Adjustable plans"
          value={String(investmentCount)}
          helper="Active plans in scope"
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
                  {t === "all" ? "All" : ADJUSTMENT_STATUS_LABEL[t]}
                </button>
              ))}
            </div>

            <label className="relative ml-auto w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search customer, plan or reference"
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-[13px] outline-none transition focus:border-brand/50"
              />
            </label>

            <Link
              to="/adjustments/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground transition hover:opacity-95"
            >
              <FilePlus2 className="size-4" />
              New adjustment
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[64rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="px-5 py-2.5">Customer &amp; plan</th>
                  <th className="px-5 py-2.5">Adjustment</th>
                  <th className="px-5 py-2.5">Previous</th>
                  <th className="px-5 py-2.5">Proposed</th>
                  <th className="px-5 py-2.5">Submitted by</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 transition hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <span className="block text-[13.5px] font-bold">{r.userName}</span>
                      <span className="block text-[12px] text-muted-foreground">
                        {r.product} · {r.reference}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-md bg-brand/10 px-2 py-0.5 text-[11.5px] font-bold text-brand ring-1 ring-brand/20">
                        {ADJUSTMENT_TYPE_LABEL[r.type]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[13px] tabular-nums text-muted-foreground line-through">
                      {r.previous}
                    </td>
                    <td className="px-5 py-3 text-[13.5px] font-extrabold tabular-nums text-brand">
                      {r.proposed}
                    </td>
                    <td className="px-5 py-3 text-[13px]">
                      <span className="block font-semibold">{r.submittedBy}</span>
                      <span className="block text-[12px] text-muted-foreground">{r.submittedAt}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${ADJUSTMENT_STATUS_TONE[r.status]}`}
                      >
                        {ADJUSTMENT_STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to="/adjustments/$requestId"
                        params={{ requestId: r.id }}
                        className="rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-bold transition hover:border-brand/40 hover:text-brand"
                      >
                        {r.status === "awaiting" ? "Review" : "View"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? (
              <p className="px-5 py-14 text-center text-[13px] text-muted-foreground">
                No adjustment requests match this view.
              </p>
            ) : null}
          </div>
        </div>
      </Panel>
    </AdminShell>
  );
}
