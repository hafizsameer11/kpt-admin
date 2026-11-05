import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, User as UserIcon, XCircle } from "lucide-react";
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
  AdminApiError,
  fetchAdminAccountDeletion,
  patchAdminAccountDeletion,
  type AdminAccountDeletionRow,
} from "@/lib/admin-api";
import {
  DELETION_STATUS_LABEL,
  DELETION_STATUS_TONE,
  mapDeletionStatus,
} from "@/lib/admin-account-deletions-data";

export const Route = createFileRoute("/account-deletions_/$deletionId")({
  head: () => ({
    meta: [
      { title: "Deletion request — Kipit Admin Console" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountDeletionReviewPage,
});

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-[12.5px] text-muted-foreground">{label}</span>
      <span className="text-right text-[13px] font-bold">{value}</span>
    </div>
  );
}

function AccountDeletionReviewPage() {
  const { deletionId } = useParams({ from: "/account-deletions_/$deletionId" });
  const navigate = useNavigate();
  const [row, setRow] = useState<AdminAccountDeletionRow | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = () =>
    fetchAdminAccountDeletion(deletionId)
      .then(setRow)
      .catch(() => {
        toast.error("Deletion request not found");
        void navigate({ to: "/account-deletions" });
      });

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletionId]);

  if (!row) {
    return (
      <AdminShell title="Deletion request" subtitle="Loading…">
        <p className="text-[13px] text-muted-foreground">Loading…</p>
      </AdminShell>
    );
  }

  const status = mapDeletionStatus(row.status);
  const open = row.status === "SUBMITTED" || row.status === "PROCESSING";
  const purgeDue = row.purgeEligible ?? Date.now() >= new Date(row.scheduledPurgeAt).getTime();

  const act = async (next: "PROCESSING" | "REJECTED" | "DELETED", rejectionReason?: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await patchAdminAccountDeletion(deletionId, {
        status: next,
        rejectionReason,
      });
      toast.success(
        next === "PROCESSING"
          ? "Marked processing"
          : next === "REJECTED"
            ? "Request rejected"
            : "Account soft-deleted",
      );
      setRejectOpen(false);
      await reload();
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell title="Deletion request" subtitle={row.id}>
      <Link
        to="/account-deletions"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to queue
      </Link>

      <div className="mt-4 grid gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="space-y-5">
          <Panel title="Customer" eyebrow="User" icon={UserIcon}>
            <p className="font-display text-[18px] font-extrabold">{row.user.name}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">{row.user.email || "—"}</p>
            <p className="text-[13px] text-muted-foreground">{row.user.phone || "—"}</p>
            <Link
              to="/users/$userId"
              params={{ userId: row.user.id }}
              className="mt-3 inline-flex text-[12.5px] font-bold text-brand hover:underline"
            >
              Open customer profile
            </Link>
          </Panel>

          <Panel title="Balances" eyebrow="Before soft-delete">
            <Row label="Wallet" value={naira(row.balances?.wallet ?? 0)} />
            <Row label="Call" value={naira(row.balances?.call ?? 0)} />
            <Row label="Fixed" value={naira(row.balances?.fixed ?? 0)} />
            <Row label="Explore" value={naira(row.balances?.explore ?? 0)} />
            <Row label="Active placements" value={String(row.activePlacements ?? 0)} />
            <Row label="Pending withdrawals" value={String(row.pendingWithdrawals ?? 0)} />
            <p className="mt-3 text-[12px] text-muted-foreground">
              Clear balances and close active plans with existing investment / wallet tools before
              Mark deleted.
            </p>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Request" eyebrow="Details">
            <Row
              label="Status"
              value={
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${DELETION_STATUS_TONE[status]}`}
                >
                  {DELETION_STATUS_LABEL[status]}
                </span>
              }
            />
            <Row label="Reason" value={row.reasonLabel ?? row.reasonCode} />
            {row.reasonDetail ? <Row label="Details" value={row.reasonDetail} /> : null}
            <Row label="Submitted" value={new Date(row.createdAt).toLocaleString("en-NG")} />
            <Row
              label="Purge eligible"
              value={new Date(row.scheduledPurgeAt).toLocaleString("en-NG")}
            />
            {row.rejectionReason ? (
              <Row label="Rejection reason" value={row.rejectionReason} />
            ) : null}
            {row.deletedAt ? (
              <Row label="Deleted at" value={new Date(row.deletedAt).toLocaleString("en-NG")} />
            ) : null}
          </Panel>

          {open ? (
            <Panel title="Actions" eyebrow="Admin">
              <div className="flex flex-wrap gap-2">
                {row.status === "SUBMITTED" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void act("PROCESSING")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-[13px] font-bold text-primary-foreground disabled:opacity-60"
                  >
                    <CheckCircle2 className="size-4" />
                    Mark processing
                  </button>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setRejectOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-[13px] font-bold text-destructive disabled:opacity-60"
                >
                  <XCircle className="size-4" />
                  Reject
                </button>
                <button
                  type="button"
                  disabled={busy || !purgeDue}
                  title={
                    purgeDue
                      ? "Soft-delete and free email/phone"
                      : "Available only after the 30-day hold"
                  }
                  onClick={() => void act("DELETED")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2.5 text-[13px] font-bold text-background disabled:opacity-50"
                >
                  Mark deleted
                </button>
              </div>
              {!purgeDue ? (
                <p className="mt-3 text-[12px] text-muted-foreground">
                  Mark deleted unlocks on{" "}
                  {new Date(row.scheduledPurgeAt).toLocaleDateString("en-NG")} (30 days after
                  submit).
                </p>
              ) : null}
            </Panel>
          ) : null}
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject deletion request</DialogTitle>
            <DialogDescription>
              The customer can submit a new request after rejection. Reason is required.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-border bg-background p-3 text-[13px]"
            placeholder="Explain why this request is declined…"
          />
          <DialogFooter>
            <button
              type="button"
              className="rounded-xl px-4 py-2 text-[13px] font-bold text-muted-foreground"
              onClick={() => setRejectOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || reason.trim().length < 4}
              className="rounded-xl bg-destructive px-4 py-2 text-[13px] font-bold text-white disabled:opacity-60"
              onClick={() => void act("REJECTED", reason.trim())}
            >
              Confirm reject
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
