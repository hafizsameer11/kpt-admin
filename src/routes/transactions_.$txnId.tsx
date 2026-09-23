import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Copy, Download, ExternalLink, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { downloadCsv } from "@/lib/csv-export";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel } from "@/components/kipit/AdminBits";
import { naira } from "@/lib/admin-data";
import {
  TXN_STATUS_TONE,
  TXN_TYPE_LABEL,
  findLedgerTxn,
  hydrateAdminLedgerFromApi,
  relatedTxns,
  type LedgerTxn,
} from "@/lib/admin-transactions-data";

export const Route = createFileRoute("/transactions_/$txnId")({
  head: () => ({
    meta: [
      { title: "Transaction detail — Kipit Admin Console" },
      {
        name: "description",
        content: "Full transaction record: user, amount, status, reference, timestamp and related activity.",
      },
      { property: "og:title", content: "Transaction detail — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Inspect a single Kipit transaction and its related ledger activity.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TxnDetail,
});

function TxnDetail() {
  const { txnId } = Route.useParams();
  const [txn, setTxn] = useState<LedgerTxn | null | undefined>(undefined);

  useEffect(() => {
    void hydrateAdminLedgerFromApi().then(() => {
      setTxn(findLedgerTxn(txnId) ?? null);
    });
  }, [txnId]);

  if (txn === undefined) {
    return (
      <AdminShell title="Transaction detail" subtitle="ADM-041">
        <p className="text-[13px] text-muted-foreground">Loading…</p>
      </AdminShell>
    );
  }

  if (!txn) {
    return (
      <AdminShell title="Transaction detail" subtitle="ADM-041">
        <Panel>
          <p className="py-10 text-center text-[13px] text-muted-foreground">
            This transaction reference could not be found.
          </p>
          <div className="text-center">
            <Link
              to="/transactions"
              className="text-[13px] font-bold text-brand hover:underline"
            >
              Back to global transactions
            </Link>
          </div>
        </Panel>
      </AdminShell>
    );
  }

  const rows: [string, string][] = [
    ["Reference", txn.ref],
    ["Type", TXN_TYPE_LABEL[txn.type]],
    ["Product", txn.product],
    ["Channel", txn.channel],
    ["Amount", naira(txn.amount)],
    ["Fee", txn.fee ? naira(txn.fee) : "—"],
    ["Wallet balance after", naira(txn.balanceAfter)],
    ["Timestamp", txn.at],
  ];

  return (
    <AdminShell title="Transaction detail" subtitle={`ADM-041 · ${txn.ref}`}>
      <Link
        to="/transactions"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Global transactions
      </Link>

      <section className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-primary-foreground">
        <span className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-primary-foreground/60">
              {TXN_TYPE_LABEL[txn.type]} · {txn.product}
            </p>
            <p className="mt-1.5 font-display text-[34px] font-extrabold leading-none tracking-[-0.03em]">
              {naira(txn.amount)}
            </p>
            <p className="mt-2 text-[13px] text-primary-foreground/70">{txn.label}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ${TXN_STATUS_TONE[txn.status]}`}
              >
                {txn.status}
              </span>
              <span className="rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-bold ring-1 ring-white/20">
                {txn.at}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(txn.ref);
                toast.success("Reference copied");
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-white/12 px-3 py-2 text-[12.5px] font-bold ring-1 ring-white/20 transition hover:bg-white/20"
            >
              <Copy className="size-4" />
              Copy reference
            </button>
            <button
              type="button"
              onClick={() => {
                downloadCsv(
                  `kipit-receipt-${txn.ref}`,
                  ["Field", "Value"],
                  [
                    ["Reference", txn.ref],
                    ["Label", txn.label],
                    ["Type", TXN_TYPE_LABEL[txn.type]],
                    ["Product", txn.product],
                    ["Channel", txn.channel],
                    ["Amount", txn.amount],
                    ["Status", txn.status],
                    ["User", txn.userName],
                    ["Email", txn.userEmail],
                    ["Timestamp", txn.at],
                    ["Narration", txn.narration ?? ""],
                  ],
                );
                toast.success("Downloaded 1 receipt");
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-3 py-2 text-[12.5px] font-bold text-gold-foreground transition hover:opacity-90"
            >
              <Download className="size-4" />
              Download receipt
            </button>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="grid gap-5">
          <Panel title="Transaction record" eyebrow="Ledger" icon={ReceiptText}>
            <ul className="divide-y divide-border/70 text-[13.5px]">
              {rows.map(([k, v]) => (
                <li key={k} className="flex items-center justify-between gap-4 py-2.5">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="text-right font-bold">{v}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl bg-muted/50 p-3 text-[13px] text-muted-foreground">
              {txn.narration}
            </p>
          </Panel>

          <Panel title="Related activity" eyebrow="Same customer" icon={ExternalLink}>
            <ul className="space-y-1.5">
              {relatedTxns(txn).map((r) => (
                <li key={r.id}>
                  <Link
                    to="/transactions/$txnId"
                    params={{ txnId: r.id }}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border/70 px-3.5 py-3 transition hover:border-brand/30 hover:bg-muted/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] font-bold">{r.label}</span>
                      <span className="block text-[12px] text-muted-foreground">
                        {r.at} · {r.ref}
                      </span>
                    </span>
                    <span className="shrink-0 text-[13px] font-extrabold tabular-nums">
                      {naira(r.amount)}
                    </span>
                  </Link>
                </li>
              ))}
              {relatedTxns(txn).length === 0 ? (
                <p className="py-6 text-center text-[13px] text-muted-foreground">
                  No other activity for this customer in range.
                </p>
              ) : null}
            </ul>
          </Panel>
        </div>

        <div className="grid content-start gap-5">
          <Panel title="Customer" eyebrow="Account holder">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand/8 text-[13px] font-extrabold text-brand">
                {txn.userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[14px] font-extrabold">{txn.userName}</p>
                <p className="truncate text-[12.5px] text-muted-foreground">{txn.userEmail}</p>
              </div>
            </div>
            <Link
              to="/users/$userId"
              params={{ userId: txn.userId }}
              className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-[13px] font-bold transition hover:border-brand/30 hover:bg-muted/40"
            >
              Open user profile
              <ExternalLink className="size-3.5" />
            </Link>
          </Panel>

          <Panel title="Linked records" eyebrow="Operations">
            <ul className="divide-y divide-border/70 text-[13px]">
              {txn.related.map((r) => (
                <li key={r.label} className="flex justify-between gap-4 py-2.5">
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="text-right font-bold">{r.value}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </AdminShell>
  );
}
