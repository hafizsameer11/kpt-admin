import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Banknote, Clock, Download, Search, ShieldAlert, Wallet } from "lucide-react";
import { toast } from "sonner";
import { downloadCsv } from "@/lib/csv-export";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import { compactNaira, naira } from "@/lib/admin-data";
import {
  RISK_TONE,
  hydrateAdminWithdrawalsFromApi,
  getWithdrawalTotals,
  WITHDRAWAL_STATUS_LABEL,
  WITHDRAWAL_STATUS_TONE,
  type Withdrawal,
  type WithdrawalStatus,
} from "@/lib/admin-withdrawals-data";

export const Route = createFileRoute("/withdrawals")({
  head: () => ({
    meta: [
      { title: "Withdrawal queue — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Review, process, decline and settle Kipit customer withdrawal requests from one operational queue.",
      },
      { property: "og:title", content: "Withdrawal queue — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Operational queue for Kipit payouts with review and decline controls.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WithdrawalQueuePage,
});

const TABS: ("all" | WithdrawalStatus)[] = [
  "all",
  "pending",
  "processing",
  "successful",
  "declined",
];

function WithdrawalQueuePage() {
  const [items, setItems] = useState<Withdrawal[]>([]);
  const [tab, setTab] = useState<"all" | WithdrawalStatus>("pending");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void hydrateAdminWithdrawalsFromApi().then(setItems);
  }, []);

  const totals = useMemo(() => getWithdrawalTotals(items), [items]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((w) => {
      if (tab !== "all" && w.status !== tab) return false;
      if (!q) return true;
      return [w.userName, w.userEmail, w.ref, w.bank, w.accountNumber].some((f) =>
        f.toLowerCase().includes(q),
      );
    });
  }, [items, tab, query]);

  return (
    <AdminShell
      title="Withdrawals"
      subtitle="ADM-050 · payout queue, review and settlement"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Awaiting review"
          value={compactNaira(totals.pendingValue)}
          helper={`${totals.pendingCount} requests in queue`}
          tone="brand"
          icon={Clock}
        />
        <Stat
          label="In processing"
          value={compactNaira(totals.processingValue)}
          helper="Sent to settlement bank"
          icon={Banknote}
        />
        <Stat
          label="Settled"
          value={compactNaira(totals.settledToday)}
          helper="Confirmed payouts"
          tone="gold"
          icon={Wallet}
        />
        <Stat
          label="High risk flags"
          value={String(items.filter((w) => w.risk === "high").length)}
          helper="Require extra verification"
          icon={ShieldAlert}
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
                  className={`rounded-md px-3 py-1.5 text-[12.5px] font-bold capitalize transition ${
                    tab === t
                      ? "bg-brand text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "all" ? "All" : WITHDRAWAL_STATUS_LABEL[t]}
                </button>
              ))}
            </div>

            <label className="ml-auto flex min-w-[16rem] items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search user, reference, bank or account"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                const n = downloadCsv(
                  "kipit-withdrawals",
                  ["User", "Reference", "Source", "Amount", "Bank", "Account", "Account name", "Requested", "Risk", "Status"],
                  rows.map((w) => [
                    w.userName,
                    w.ref,
                    w.source,
                    w.amount,
                    w.bank,
                    w.accountNumber,
                    w.accountName,
                    w.requestedAt,
                    w.risk,
                    WITHDRAWAL_STATUS_LABEL[w.status],
                  ]),
                );
                toast.success(`Downloaded ${n} rows`);
              }}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3 text-[12.5px] font-bold text-primary-foreground transition hover:opacity-90"
            >
              <Download className="size-4" />
              Export
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[62rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="px-5 py-2.5">User</th>
                  <th className="px-5 py-2.5 text-right">Amount</th>
                  <th className="px-5 py-2.5">Bank</th>
                  <th className="px-5 py-2.5">Account</th>
                  <th className="px-5 py-2.5">Request date</th>
                  <th className="px-5 py-2.5">Risk</th>
                  <th className="px-5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((w) => (
                  <tr key={w.id} className="group border-b border-border/60 transition hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <Link
                        to="/withdrawals/$withdrawalId"
                        params={{ withdrawalId: w.id }}
                        className="flex items-center gap-3"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/8 text-[12px] font-extrabold text-brand">
                          {w.userName
                            .split(" ")
                            .map((p) => p[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13.5px] font-bold group-hover:text-brand">
                            {w.userName}
                          </span>
                          <span className="block text-[12px] text-muted-foreground">
                            {w.ref} · {w.source}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-right text-[13.5px] font-extrabold tabular-nums">
                      {naira(w.amount)}
                    </td>
                    <td className="px-5 py-3 text-[13px]">{w.bank}</td>
                    <td className="px-5 py-3 text-[13px] text-muted-foreground">
                      <span className="block tabular-nums">{w.accountNumber}</span>
                      <span className="block text-[12px]">{w.accountName}</span>
                    </td>
                    <td className="px-5 py-3 text-[12.5px] text-muted-foreground">{w.requestedAt}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ${RISK_TONE[w.risk]}`}
                      >
                        {w.risk}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${WITHDRAWAL_STATUS_TONE[w.status]}`}
                      >
                        {WITHDRAWAL_STATUS_LABEL[w.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? (
              <p className="px-5 py-14 text-center text-[13px] text-muted-foreground">
                No withdrawals match this view.
              </p>
            ) : null}
          </div>
        </div>
      </Panel>
    </AdminShell>
  );
}
