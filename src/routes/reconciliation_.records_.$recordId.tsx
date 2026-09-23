import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, MessageSquarePlus, Scale, Search } from "lucide-react";
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
  RECON_STATUS_LABEL,
  RECON_STATUS_TONE,
  findReconRecord,
  hydrateAdminReconFromApi,
  type ReconRecord,
  type ReconStatus,
} from "@/lib/admin-recon-data";
import { updateAdminReconRecord } from "@/lib/admin-api";

export const Route = createFileRoute("/reconciliation_/records_/$recordId")({
  head: () => ({
    meta: [
      { title: "Variance review — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Investigate a reconciliation variance, add operational notes and mark the item resolved once balanced.",
      },
      { property: "og:title", content: "Variance review — Kipit Admin Console" },
      { property: "og:description", content: "Kipit reconciliation variance investigation screen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VarianceReviewPage,
});

function VarianceReviewPage() {
  const { recordId } = Route.useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<ReconRecord | undefined>(() => findReconRecord(recordId));

  useEffect(() => {
    void hydrateAdminReconFromApi().then(() => setRecord(findReconRecord(recordId)));
  }, [recordId]);

  const [status, setStatus] = useState<ReconStatus | null>(null);
  const [notes, setNotes] = useState<{ text: string; at: string }[]>([]);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteTouched, setNoteTouched] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);

  if (!record) {
    return (
      <AdminShell title="Record not found" subtitle="ADM-092">
        <Panel>
          <p className="text-[13.5px] text-muted-foreground">This reconciliation record no longer exists.</p>
          <Link
            to="/reconciliation/records"
            className="mt-4 inline-flex rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground"
          >
            Back to records
          </Link>
        </Panel>
      </AdminShell>
    );
  }

  const current = status ?? record.status;
  const variance = record.providerAmount - record.ledgerAmount;

  function addNote() {
    setNoteTouched(true);
    if (noteText.trim().length < 5) return;
    void updateAdminReconRecord(record.id, { note: noteText.trim() })
      .then(() => {
        setNotes((n) => [...n, { text: noteText.trim(), at: "Just now" }]);
        setNoteText("");
        setNoteTouched(false);
        setNoteOpen(false);
        toast.success("Operational note added");
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not add note"));
  }

  return (
    <AdminShell
      title={`Variance ${record.providerRef}`}
      subtitle="ADM-092 · investigate, note and resolve"
    >
      <Link
        to="/reconciliation/records"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to records
      </Link>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <Panel>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {record.source} · {record.channel}
                </p>
                <h2 className="mt-1 text-[20px] font-extrabold">{record.customer}</h2>
                <p className="text-[12.5px] text-muted-foreground">{record.date}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${RECON_STATUS_TONE[current]}`}
              >
                {RECON_STATUS_LABEL[current]}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Box label="Provider record" ref_={record.providerRef} amount={naira(record.providerAmount)} />
              <Box label="Internal ledger" ref_={record.internalRef} amount={naira(record.ledgerAmount)} />
              <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-destructive">Variance</p>
                <p className="mt-1 text-[20px] font-extrabold tabular-nums text-destructive">
                  {variance === 0 ? "₦0" : naira(Math.abs(variance))}
                </p>
                <p className="text-[12px] text-destructive/80">
                  {variance === 0
                    ? "Balanced"
                    : variance > 0
                      ? "Provider higher than ledger"
                      : "Ledger higher than provider"}
                </p>
              </div>
            </div>

            {record.note ? (
              <div className="mt-4 rounded-xl border border-border/70 bg-muted/40 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  System finding
                </p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed">{record.note}</p>
              </div>
            ) : null}
          </Panel>

          <Panel title="Investigation timeline" eyebrow="Audit trail" icon={Scale}>
            <ol className="mt-4 space-y-3">
              {[...record.timeline, ...notes.map((n) => ({ label: n.text, at: n.at, by: "You" }))].map(
                (t, i) => (
                  <li key={`${t.label}-${i}`} className="flex gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" />
                    <div>
                      <p className="text-[13.5px] font-semibold">{t.label}</p>
                      <p className="text-[12px] text-muted-foreground">
                        {t.at} · {t.by}
                      </p>
                    </div>
                  </li>
                ),
              )}
            </ol>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Case" eyebrow="Ownership">
            <dl className="mt-4 space-y-2 text-[12.5px]">
              <Row label="Owner" value={record.owner ?? "Unassigned"} />
              <Row label="Reference" value={record.id.toUpperCase()} />
              <Row label="Channel" value={record.channel} />
              <Row label="Source" value={record.source} />
            </dl>
          </Panel>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => {
                void updateAdminReconRecord(record.id, { status: "investigating" })
                  .then(() => {
                    setStatus("investigating");
                    toast.success("Investigation opened", {
                      description: "Raised with the provider.",
                    });
                  })
                  .catch((err) =>
                    toast.error(err instanceof Error ? err.message : "Could not update"),
                  );
              }}
              disabled={current === "investigating" || current === "resolved"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-[13px] font-bold transition hover:border-brand/40 hover:text-brand disabled:opacity-50"
            >
              <Search className="size-4" />
              Investigate
            </button>
            <button
              type="button"
              onClick={() => setNoteOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-[13px] font-bold transition hover:border-brand/40 hover:text-brand"
            >
              <MessageSquarePlus className="size-4" />
              Add operational note
            </button>
            <button
              type="button"
              onClick={() => setResolveOpen(true)}
              disabled={current === "resolved"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-[13px] font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              <CheckCircle2 className="size-4" />
              Mark resolved
            </button>
          </div>
        </div>
      </div>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add operational note</DialogTitle>
            <DialogDescription>Notes are appended to the immutable investigation trail.</DialogDescription>
          </DialogHeader>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={4}
            placeholder="e.g. Provider confirmed fee deduction; ledger to be adjusted at day end."
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[13.5px] outline-none focus:border-brand/50"
          />
          {noteTouched && noteText.trim().length < 5 ? (
            <p className="text-[12px] font-semibold text-destructive">Add a short note.</p>
          ) : null}
          <DialogFooter>
            <button
              type="button"
              onClick={() => setNoteOpen(false)}
              className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={addNote}
              className="rounded-lg bg-brand px-4 py-2 text-[12.5px] font-bold text-primary-foreground"
            >
              Save note
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark variance resolved</DialogTitle>
            <DialogDescription>
              Confirm the provider record and ledger now agree for {record.providerRef}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setResolveOpen(false)}
              className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                void updateAdminReconRecord(record.id, { status: "resolved" })
                  .then(() => {
                    setResolveOpen(false);
                    setStatus("resolved");
                    toast.success("Variance marked resolved");
                    navigate({ to: "/reconciliation" });
                  })
                  .catch((err) =>
                    toast.error(err instanceof Error ? err.message : "Could not resolve"),
                  );
              }}
              className="rounded-lg bg-brand px-4 py-2 text-[12.5px] font-bold text-primary-foreground"
            >
              Confirm resolved
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Box({ label, ref_, amount }: { label: string; ref_: string; amount: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-[20px] font-extrabold tabular-nums">{amount}</p>
      <p className="truncate text-[12px] text-muted-foreground">{ref_}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}
