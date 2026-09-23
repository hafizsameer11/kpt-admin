import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CalendarClock, Check, Info, ShieldAlert, User, X } from "lucide-react";
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
import { compactNaira } from "@/lib/admin-data";
import { decideAdminRate } from "@/lib/admin-api";
import {
  REQUEST_STATUS_LABEL,
  REQUEST_STATUS_TONE,
  findBand,
  findRequest,
  hydrateAdminRateRequestsFromApi,
  hydrateAdminRatesFromApi,
  type RateRequest,
} from "@/lib/admin-rates-data";

export const Route = createFileRoute("/rates_/approvals_/$requestId")({
  head: () => ({
    meta: [
      { title: "Approve rate change — Kipit Admin Console" },
      {
        name: "description",
        content: "Review a proposed tenor band rate change with before and after values, then approve or reject.",
      },
      { property: "og:title", content: "Approve rate change — Kipit Admin Console" },
      { property: "og:description", content: "Maker-checker decision screen for Kipit rate changes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RateDecisionPage,
});

function fmtDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function RateDecisionPage() {
  const { requestId } = Route.useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<RateRequest | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTouched, setRejectTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void Promise.all([hydrateAdminRateRequestsFromApi(), hydrateAdminRatesFromApi()]).then(
      ([requests]) => {
        setRequest(findRequest(requestId) ?? requests.find((r) => r.id === requestId) ?? null);
      },
    );
  }, [requestId]);

  if (!request) {
    return (
      <AdminShell title="Rate change not found" subtitle="ADM-073">
        <Panel>
          <p className="text-[13.5px] text-muted-foreground">
            This rate change request no longer exists.
          </p>
          <Link
            to="/rates/approvals"
            className="mt-4 inline-flex rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground"
          >
            Back to queue
          </Link>
        </Panel>
      </AdminShell>
    );
  }

  const band = findBand(request.bandId);
  const delta = (request.proposedRate - request.currentRate) * 100;
  const decided = request.status !== "awaiting";
  const decidedRequestId = request.id;
  const requestBand = request.band;
  const requestEffective = request.effectiveDate;

  function approve() {
    setApproveOpen(false);
    setBusy(true);
    void decideAdminRate(decidedRequestId, true)
      .then(() => {
        toast.success("Rate change approved", {
          description: `${requestBand} · effective ${fmtDate(requestEffective)} · new placements only`,
        });
        navigate({ to: "/rates" });
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed"))
      .finally(() => setBusy(false));
  }

  function reject() {
    setRejectTouched(true);
    if (rejectReason.trim().length < 8) return;
    setRejectOpen(false);
    setBusy(true);
    void decideAdminRate(decidedRequestId, false)
      .then(() => {
        toast.success("Rate change rejected", { description: requestBand });
        navigate({ to: "/rates/approvals" });
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed"))
      .finally(() => setBusy(false));
  }

  return (
    <AdminShell
      title={`Rate change ${request.id.toUpperCase()}`}
      subtitle="ADM-073 · approve or reject, applies to new placements only"
    >
      <Link
        to="/rates/approvals"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to approval queue
      </Link>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Panel>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {request.product}
                </p>
                <h2 className="mt-1 text-[20px] font-extrabold">{request.band}</h2>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${REQUEST_STATUS_TONE[request.status]}`}
              >
                {REQUEST_STATUS_LABEL[request.status]}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
              <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Previous</p>
                <p className="mt-1 text-[26px] font-extrabold tabular-nums">
                  {request.currentRate.toFixed(2)}%
                </p>
                <p className="text-[12px] text-muted-foreground">
                  Effective {band ? fmtDate(band.effectiveDate) : "—"}
                </p>
              </div>
              <div className="flex justify-center">
                <span
                  className={`rounded-full px-2.5 py-1 text-[12px] font-extrabold ${
                    delta > 0
                      ? "bg-emerald-500/12 text-emerald-700"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {delta > 0 ? "+" : ""}
                  {delta.toFixed(0)}bps
                </span>
              </div>
              <div className="rounded-xl border border-brand/25 bg-brand/5 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand">Proposed</p>
                <p className="mt-1 text-[26px] font-extrabold tabular-nums text-brand">
                  {request.proposedRate.toFixed(2)}%
                </p>
                <p className="text-[12px] text-brand/70">Effective {fmtDate(request.effectiveDate)}</p>
              </div>
            </div>
          </Panel>

          <Panel title="Submission" eyebrow="Maker" icon={User}>
            <dl className="mt-4 divide-y divide-border/70 text-[13px]">
              <RowItem label="Submitted by" value={request.submittedBy} />
              <RowItem label="Submitted at" value={request.submittedAt} />
              <RowItem label="Effective date" value={fmtDate(request.effectiveDate)} />
              <RowItem label="Reference" value={request.id.toUpperCase()} />
            </dl>
            <div className="mt-4 rounded-xl border border-border/70 bg-muted/40 p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Reason</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed">{request.reason}</p>
            </div>
            {decided ? (
              <div className="mt-3 rounded-xl border border-border/70 bg-card p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Decision</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed">{request.decisionNote}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {request.decidedBy} · {request.decidedAt}
                </p>
              </div>
            ) : null}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Band exposure" eyebrow="Impact" icon={CalendarClock}>
            <dl className="mt-4 space-y-2 text-[12.5px]">
              <MiniRow label="Principal in band" value={band ? compactNaira(band.principal) : "—"} />
              <MiniRow
                label="Active placements"
                value={band ? band.placements.toLocaleString("en-NG") : "—"}
              />
              <MiniRow label="Minimum" value={band ? compactNaira(band.minimum) : "—"} />
              <MiniRow label="Current status" value={band ? band.band : "—"} />
            </dl>
          </Panel>

          <div className="flex gap-2.5 rounded-2xl border border-gold/40 bg-gold/10 p-4">
            <Info className="mt-0.5 size-4 shrink-0 text-gold-foreground" />
            <p className="text-[12.5px] leading-relaxed text-gold-foreground">
              Approval applies to <strong>new placements only</strong> from the effective date. Existing
              contracts keep the rate locked at placement and are unaffected.
            </p>
          </div>

          {decided ? (
            <div className="flex gap-2.5 rounded-2xl border border-border bg-muted/40 p-4">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-[12.5px] leading-relaxed text-muted-foreground">
                This request has already been decided. The record is immutable and kept in the audit log.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setApproveOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-[13px] font-bold text-primary-foreground transition hover:opacity-90"
              >
                <Check className="size-4" />
                Approve rate change
              </button>
              <button
                type="button"
                onClick={() => setRejectOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 px-4 py-2.5 text-[13px] font-bold text-destructive transition hover:bg-destructive/5"
              >
                <X className="size-4" />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve rate change</DialogTitle>
            <DialogDescription>
              {request.band}: {request.currentRate.toFixed(2)}% → {request.proposedRate.toFixed(2)}%, effective{" "}
              {fmtDate(request.effectiveDate)}. Applies to new placements only.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setApproveOpen(false)}
              className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={approve}
              className="rounded-lg bg-brand px-4 py-2 text-[12.5px] font-bold text-primary-foreground"
            >
              Confirm approval
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject rate change</DialogTitle>
            <DialogDescription>
              A reason is required and is recorded against the immutable audit trail.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            placeholder="e.g. Spread falls below policy floor. Resubmit at 16.25%."
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[13.5px] outline-none focus:border-brand/50"
          />
          {rejectTouched && rejectReason.trim().length < 10 ? (
            <p className="text-[12px] font-semibold text-destructive">
              Add a rejection reason (min 10 characters).
            </p>
          ) : null}
          <DialogFooter>
            <button
              type="button"
              onClick={() => setRejectOpen(false)}
              className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={reject}
              className="rounded-lg bg-destructive px-4 py-2 text-[12.5px] font-bold text-destructive-foreground"
            >
              Confirm rejection
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function RowItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-bold tabular-nums">{value}</dd>
    </div>
  );
}
