import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, FileText, ShieldAlert, User, X } from "lucide-react";
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
import {
  ADJUSTMENT_STATUS_LABEL,
  ADJUSTMENT_STATUS_TONE,
  ADJUSTMENT_TYPE_LABEL,
  findAdjustableInvestment,
  findAdjustment,
  hydrateAdminAdjustmentsFromApi,
  type AdjustmentRequest,
} from "@/lib/admin-adjustments-data";

export const Route = createFileRoute("/adjustments_/$requestId")({
  head: () => ({
    meta: [
      { title: "Approve plan adjustment — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Checker review of a proposed Kipit plan adjustment with a full before and after comparison, mandatory reason and decision trail.",
      },
      { property: "og:title", content: "Approve plan adjustment — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Maker-checker decision screen for Kipit plan adjustments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdjustmentDecisionPage,
});

const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

function AdjustmentDecisionPage() {
  const { requestId } = Route.useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<AdjustmentRequest | undefined>(() => findAdjustment(requestId));
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTouched, setRejectTouched] = useState(false);

  useEffect(() => {
    void hydrateAdminAdjustmentsFromApi().then(() => setRequest(findAdjustment(requestId)));
  }, [requestId]);

  if (!request) {
    return (
      <AdminShell title="Adjustment not found" subtitle="ADM-081">
        <Panel>
          <p className="text-[13.5px] text-muted-foreground">
            This adjustment request no longer exists.
          </p>
          <Link
            to="/adjustments"
            className="mt-4 inline-flex rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground"
          >
            Back to adjustments
          </Link>
        </Panel>
      </AdminShell>
    );
  }

  const investment = findAdjustableInvestment(request.investmentId);
  const pending = request.status === "awaiting";

  return (
    <AdminShell
      title="Approve plan adjustment"
      subtitle={`ADM-081 · ${request.id.toUpperCase()} · maker-checker decision`}
    >
      <Link
        to="/adjustments"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to adjustments
      </Link>

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-5">
          <Panel title="Customer" icon={User}>
            <p className="text-[17px] font-extrabold">{request.userName}</p>
            <p className="text-[12.5px] text-muted-foreground">
              {investment?.userEmail ?? "—"}
            </p>
            <dl className="mt-4 divide-y divide-border/70 text-[13px]">
              <Row label="Plan" value={request.product} />
              <Row label="Reference" value={request.reference} />
              <Row label="Principal" value={investment ? naira(investment.principal) : "—"} />
              <Row label="Rate" value={investment ? `${investment.rate.toFixed(2)}%` : "—"} />
              <Row label="Start date" value={investment?.startDate ?? "—"} />
              <Row label="Maturity" value={investment?.maturityDate ?? "—"} />
              <Row label="Payout" value={investment?.payoutFrequency ?? "—"} />
            </dl>
            {investment ? (
              <Link
                to="/users/$userId"
                params={{ userId: investment.userId }}
                className="mt-4 inline-flex rounded-lg border border-border px-3 py-1.5 text-[12px] font-bold transition hover:border-brand/40 hover:text-brand"
              >
                Open customer profile
              </Link>
            ) : null}
          </Panel>

          <Panel title="Maker" eyebrow="Submitted by">
            <p className="text-[13.5px] font-bold">{request.submittedBy}</p>
            <p className="text-[12.5px] text-muted-foreground">{request.submittedAt}</p>
            <span
              className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${ADJUSTMENT_STATUS_TONE[request.status]}`}
            >
              {ADJUSTMENT_STATUS_LABEL[request.status]}
            </span>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Before and after" eyebrow="Immutable comparison" icon={FileText}>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-muted/50 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    <th className="px-4 py-2.5">Field</th>
                    <th className="px-4 py-2.5">Previous</th>
                    <th className="px-4 py-2.5">Proposed</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border/70">
                    <td className="px-4 py-3 text-[13px] font-bold">
                      {ADJUSTMENT_TYPE_LABEL[request.type]}
                    </td>
                    <td className="px-4 py-3 text-[13.5px] tabular-nums text-muted-foreground line-through">
                      {request.previous}
                    </td>
                    <td className="px-4 py-3 text-[15px] font-extrabold tabular-nums text-brand">
                      {request.proposed}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Reason from maker
              </p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed">{request.reason}</p>
            </div>

            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-gold/40 bg-gold/10 p-3.5">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-gold-foreground" />
              <p className="text-[12.5px] font-medium text-gold-foreground">{request.impact}</p>
            </div>

            {request.status !== "awaiting" ? (
              <div className="mt-4 rounded-xl border border-border p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  Decision
                </p>
                <p className="mt-1.5 text-[13.5px] font-bold">
                  {ADJUSTMENT_STATUS_LABEL[request.status]} · {request.decidedBy}
                </p>
                <p className="text-[12.5px] text-muted-foreground">{request.decidedAt}</p>
                {request.decisionNote ? (
                  <p className="mt-2 text-[13px] leading-relaxed">{request.decisionNote}</p>
                ) : null}
              </div>
            ) : null}
          </Panel>

          {pending ? (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setApproveOpen(true)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-3 text-[13.5px] font-bold text-primary-foreground transition hover:opacity-95"
              >
                <Check className="size-4" />
                Approve adjustment
              </button>
              <button
                type="button"
                onClick={() => setRejectOpen(true)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-destructive/40 px-4 py-3 text-[13.5px] font-bold text-destructive transition hover:bg-destructive/5"
              >
                <X className="size-4" />
                Reject
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve this adjustment?</DialogTitle>
            <DialogDescription>
              {ADJUSTMENT_TYPE_LABEL[request.type]} on {request.reference} changes from{" "}
              {request.previous} to {request.proposed}. The customer is notified and the before and
              after values are locked into the audit log.
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
              onClick={() => {
                void (async () => {
                  try {
                    const { decideAdminAdjustment } = await import("@/lib/admin-api");
                    await decideAdminAdjustment(requestId, { approve: true });
                    setApproveOpen(false);
                    toast.success("Adjustment approved and applied");
                    navigate({ to: "/adjustments" });
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not approve");
                  }
                })();
              }}
              className="rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground"
            >
              Approve adjustment
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this adjustment</DialogTitle>
            <DialogDescription>
              A rejection reason is mandatory and is returned to the maker.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            placeholder="Explain why this adjustment cannot be approved."
            className={`w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-[13.5px] outline-none transition ${
              rejectTouched && rejectReason.trim().length < 10
                ? "border-destructive"
                : "border-border focus:border-brand/50"
            }`}
          />
          {rejectTouched && rejectReason.trim().length < 10 ? (
            <p className="text-[11.5px] font-semibold text-destructive">
              Give at least 10 characters of context.
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
              onClick={() => {
                setRejectTouched(true);
                if (rejectReason.trim().length < 10) return;
                void (async () => {
                  try {
                    const { decideAdminAdjustment } = await import("@/lib/admin-api");
                    await decideAdminAdjustment(requestId, {
                      approve: false,
                      note: rejectReason.trim(),
                    });
                    setRejectOpen(false);
                    toast.success("Adjustment rejected and returned to maker");
                    navigate({ to: "/adjustments" });
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not reject");
                  }
                })();
              }}
              className="rounded-lg bg-destructive px-3.5 py-2 text-[12.5px] font-bold text-destructive-foreground"
            >
              Reject adjustment
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
