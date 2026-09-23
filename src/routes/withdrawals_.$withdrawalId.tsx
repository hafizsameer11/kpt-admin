import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Copy,
  ShieldAlert,
  User as UserIcon,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel } from "@/components/kipit/AdminBits";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { naira } from "@/lib/admin-data";
import {
  completeAdminWithdrawal,
  declineAdminWithdrawal,
  fetchAdminWithdrawal,
} from "@/lib/admin-api";
import { mapWithdrawalRow } from "@/lib/admin-mappers";
import {
  DECLINE_REASONS,
  RISK_TONE,
  WITHDRAWAL_STATUS_LABEL,
  WITHDRAWAL_STATUS_TONE,
  type Withdrawal,
  type WithdrawalStatus,
} from "@/lib/admin-withdrawals-data";

export const Route = createFileRoute("/withdrawals_/$withdrawalId")({
  head: () => ({
    meta: [
      { title: "Withdrawal review — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Review a Kipit withdrawal request with full user context, then process, decline or settle it.",
      },
      { property: "og:title", content: "Withdrawal review — Kipit Admin Console" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WithdrawalReviewPage,
});

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-[12.5px] text-muted-foreground">{label}</span>
      <span className="text-right text-[13px] font-bold">{value}</span>
    </div>
  );
}

function WithdrawalReviewPage() {
  const { withdrawalId } = useParams({ from: "/withdrawals_/$withdrawalId" });
  const navigate = useNavigate();
  const [w, setW] = useState<Withdrawal | null>(null);
  const [status, setStatus] = useState<WithdrawalStatus>("pending");
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState(DECLINE_REASONS[0]!);
  const [note, setNote] = useState("");
  const [declined, setDeclined] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetchAdminWithdrawal(withdrawalId)
      .then((row) => {
        const mapped = mapWithdrawalRow(row, { balances: row.balances });
        setW(mapped);
        setStatus(mapped.status);
        setDeclined(mapped.declineReason ?? "");
      })
      .catch(() => {
        toast.error("Withdrawal not found");
        void navigate({ to: "/withdrawals" });
      });
  }, [withdrawalId, navigate]);

  if (!w) {
    return (
      <AdminShell title="Withdrawal review" subtitle="Loading…">
        <p className="text-[13px] text-muted-foreground">Loading withdrawal…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Withdrawal review" subtitle={`ADM-051 · ${w.ref}`}>
      <Link
        to="/withdrawals"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to withdrawal queue
      </Link>

      <div className="mt-4 grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="space-y-5">
          <Panel title="User context" eyebrow="Customer" icon={UserIcon}>
            <div className="flex items-center gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand/8 text-[15px] font-extrabold text-brand">
                {w.userName
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-[15px] font-extrabold">{w.userName}</p>
                <p className="truncate text-[12px] text-muted-foreground">{w.userEmail}</p>
              </div>
            </div>

            <div className="mt-4">
              <Row label="Tier" value={`Tier ${w.userTier}`} />
              <Row label="Customer since" value={w.userSince} />
              <Row label="Wallet balance" value={naira(w.walletBalance)} />
              <Row label="Portfolio value" value={naira(w.portfolioValue)} />
              <Row label="Lifetime withdrawn" value={naira(w.lifetimeWithdrawn)} />
              <Row label="Prior withdrawals" value={String(w.priorWithdrawals)} />
            </div>

            <Link
              to="/users/$userId"
              params={{ userId: w.userId }}
              className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-lg border border-border bg-card text-[12.5px] font-bold transition hover:border-brand/30 hover:text-brand"
            >
              Open full profile
            </Link>
          </Panel>

          <Panel title="Risk signal" eyebrow="Screening" icon={ShieldAlert}>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${RISK_TONE[w.risk]}`}
            >
              {w.risk} risk
            </span>
            <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">{w.notes || "—"}</p>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel className="overflow-hidden p-0">
            <div className="relative overflow-hidden bg-brand-gradient p-6 text-primary-foreground">
              <span className="pointer-events-none absolute -right-12 -top-16 size-44 rounded-full bg-gold/20 blur-3xl" />
              <div className="relative flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-primary-foreground/60">
                    Withdrawal amount
                  </p>
                  <p className="mt-1 font-display text-[34px] font-extrabold tracking-[-0.03em]">
                    {naira(w.amount)}
                  </p>
                  <p className="mt-1 text-[12.5px] text-primary-foreground/65">
                    {w.source} · fee {naira(w.fee)} · requested {w.requestedAt}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1.5 text-[11.5px] font-bold ring-1 ${WITHDRAWAL_STATUS_TONE[status]}`}
                >
                  {WITHDRAWAL_STATUS_LABEL[status]}
                </span>
              </div>
            </div>

            <div className="grid gap-x-8 p-5 md:grid-cols-2">
              <Row label="Reference" value={w.ref} />
              <Row label="Request date" value={w.requestedAt} />
              <Row label="Bank" value={w.bank} />
              <Row label="Account number" value={w.accountNumber} />
              <Row label="Account name" value={w.accountName} />
              <Row label="Debit source" value={w.source} />
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border/60 px-5 py-4">
              <button
                type="button"
                disabled={busy || status === "successful" || status === "declined"}
                onClick={() => {
                  setBusy(true);
                  void completeAdminWithdrawal(w.id)
                    .then(() => {
                      setStatus("successful");
                      toast.success("Withdrawal marked successful · customer notified");
                    })
                    .catch((err) => toast.error(err instanceof Error ? err.message : "Failed"))
                    .finally(() => setBusy(false));
                }}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-[13px] font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
              >
                <Banknote className="size-4" />
                Process & settle
              </button>
              <button
                type="button"
                disabled={busy || status === "successful" || status === "declined"}
                onClick={() => setDeclineOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 text-[13px] font-bold text-destructive transition hover:bg-destructive/10 disabled:opacity-40"
              >
                <XCircle className="size-4" />
                Decline
              </button>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(w.ref);
                  toast.success("Reference copied");
                }}
                className="ml-auto inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-[12.5px] font-bold transition hover:border-brand/30 hover:text-brand"
              >
                <Copy className="size-4" />
                Copy reference
              </button>
            </div>
          </Panel>

          {declined ? (
            <Panel title="Decline reason" eyebrow="Outcome" icon={XCircle}>
              <p className="text-[13px] font-bold text-destructive">{declined}</p>
            </Panel>
          ) : null}

          <Panel title="Timeline" eyebrow="History" icon={CheckCircle2}>
            <ul className="space-y-3">
              {w.timeline.map((t) => (
                <li key={`${t.label}-${t.at}`} className="flex gap-3 text-[12.5px]">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                  <div>
                    <p className="font-bold">{t.label}</p>
                    <p className="text-muted-foreground">{t.at}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline withdrawal</DialogTitle>
            <DialogDescription>
              The amount will be re-credited to the customer wallet. Choose a reason to share.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block text-[12px] font-bold">
              Reason
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-[13px]"
              >
                {DECLINE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[12px] font-bold">
              Note (optional)
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="mt-1.5 w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-[13px]"
              />
            </label>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDeclineOpen(false)}
              className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-[13px] font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const full = note ? `${reason} — ${note}` : reason;
                setBusy(true);
                void declineAdminWithdrawal(w.id, full)
                  .then(() => {
                    setDeclined(full);
                    setStatus("declined");
                    setDeclineOpen(false);
                    toast.success("Withdrawal declined · wallet balance restored");
                  })
                  .catch((err) => toast.error(err instanceof Error ? err.message : "Failed"))
                  .finally(() => setBusy(false));
              }}
              className="inline-flex h-10 items-center rounded-lg bg-destructive px-4 text-[13px] font-bold text-destructive-foreground transition hover:opacity-90"
            >
              Decline withdrawal
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
