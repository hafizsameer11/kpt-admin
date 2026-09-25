import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  CircleDashed,
  FileText,
  Fingerprint,
  Image as ImageIcon,
  MapPin,
  ShieldAlert,
  UserCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import { CaseStatusPill } from "./compliance_.queue";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ESCALATION_REASONS,
  REJECTION_REASONS,
  hydrateAdminKycQueueFromApi,
  type CaseDocument,
  type CaseStatus,
  type CheckResult,
  type ComplianceCase,
} from "@/lib/admin-compliance-data";
import { reviewAdminKyc } from "@/lib/admin-api";

export const Route = createFileRoute("/compliance_/queue_/$caseId")({
  loader: async ({ params }) => {
    const cases = await hydrateAdminKycQueueFromApi();
    const record = cases.find((c) => c.id === params.caseId);
    if (!record) throw notFound();
    return { record };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Case not found — Kipit Admin" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.record.name} — verification review`;
    return {
      meta: [
        { title: `${title} — Kipit Admin Console` },
        {
          name: "description",
          content: `Documents, provider checks and decision controls for Kipit case ${loaderData.record.id}.`,
        },
        { property: "og:title", content: title },
        { property: "og:description", content: "Kipit compliance submission review and decision workspace." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: CaseReview,
});

const DOC_ICON: Record<CaseDocument["kind"], typeof FileText> = {
  bvn: Fingerprint,
  nin: BadgeCheck,
  selfie: ImageIcon,
  address: MapPin,
  occupation: FileText,
};

const RESULT_STYLE: Record<CheckResult, { icon: typeof CheckCircle2; cls: string; label: string }> = {
  pass: { icon: CheckCircle2, cls: "text-emerald-600 bg-emerald-500/10", label: "Pass" },
  warn: { icon: ShieldAlert, cls: "text-gold-foreground bg-gold/25", label: "Review" },
  fail: { icon: XCircle, cls: "text-destructive bg-destructive/10", label: "Fail" },
  pending: { icon: CircleDashed, cls: "text-muted-foreground bg-muted", label: "Pending" },
};

function CaseReview() {
  const { record } = Route.useLoaderData();
  const [status, setStatus] = useState<CaseStatus>(record.status);
  const [open, setOpen] = useState<null | "approve" | "reject" | "escalate">(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [events, setEvents] = useState(record.timeline);
  const [activeDoc, setActiveDoc] = useState<CaseDocument | null>(null);

  const decided = status === "approved" || status === "rejected";

  function commit(kind: "approve" | "reject" | "escalate") {
    const next: CaseStatus = kind === "approve" ? "approved" : kind === "reject" ? "rejected" : "escalated";
    if (kind === "approve" || kind === "reject") {
      void reviewAdminKyc(record.userId, kind === "approve", reason || note || undefined).catch((err) =>
        toast.error(err instanceof Error ? err.message : "Review failed"),
      );
    }
    setStatus(next);
    setEvents((prev) => [
      ...prev,
      {
        at: "Just now",
        actor: "You (Compliance officer)",
        action:
          kind === "approve"
            ? `Approved Tier ${record.tier}`
            : kind === "reject"
              ? "Rejected submission"
              : "Escalated to MLRO",
        ...(reason || note ? { note: reason || note } : {}),
      },
    ]);
    setOpen(null);
    setReason("");
    setNote("");
    toast.success(
      kind === "approve"
        ? `Tier ${record.tier} approved for ${record.name}`
        : kind === "reject"
          ? `Submission rejected — ${record.name} notified`
          : `Escalated to the MLRO`,
    );
  }

  return (
    <AdminShell title={record.name} subtitle={`ADM-031 · Submission review · Case ${record.id}`}>
      <Link
        to="/compliance/queue"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-3.5" /> Verification queue
      </Link>

      <section className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-primary-foreground">
        <span className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-primary-foreground/60">
              Tier {record.tier} upgrade · {record.priority}
            </p>
            <h2 className="mt-1 font-display text-[26px] font-extrabold tracking-[-0.025em]">{record.name}</h2>
            <p className="mt-1 text-[13px] text-primary-foreground/70">
              {record.email} · {record.phone}
            </p>
            <p className="mt-3 max-w-lg text-[13px] text-primary-foreground/80">
              Triggered by: {record.trigger}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <CaseStatusPill status={status} />
              <Link
                to="/users/$userId"
                params={{ userId: record.userId }}
                className="rounded-lg bg-white/12 px-3 py-1.5 text-[12px] font-bold text-primary-foreground ring-1 ring-white/20 transition hover:bg-white/20"
              >
                Open customer profile
              </Link>
            </div>
          </div>

          <div className="grid w-full shrink-0 gap-3 sm:w-auto sm:grid-cols-3">
            <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-primary-foreground/60">Risk score</p>
              <p className="mt-1 font-display text-[22px] font-extrabold">{record.riskScore}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-primary-foreground/60">Waiting</p>
              <p className="mt-1 font-display text-[22px] font-extrabold">{record.waiting}</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-primary-foreground/60">SLA</p>
              <p className="mt-1 font-display text-[22px] font-extrabold">{record.slaHours}h</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="grid gap-5">
          <Panel title="Documents captured" eyebrow="ADM-031" icon={FileText}>
            <ul className="grid gap-3 sm:grid-cols-2">
              {record.documents.map((d) => {
                const Icon = DOC_ICON[d.kind];
                return (
                  <li key={d.label}>
                    <button
                      type="button"
                      onClick={() => setActiveDoc(d)}
                      className="w-full rounded-xl border border-border/80 bg-muted/25 p-4 text-left transition hover:border-brand/30 hover:bg-muted/45"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/8 text-brand">
                          <Icon className="size-4" strokeWidth={2.1} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-bold">{d.label}</p>
                          <p className="truncate text-[12px] text-muted-foreground">Captured {d.captured}</p>
                        </div>
                      </div>
                      <p className="mt-3 rounded-lg bg-card px-3 py-2 text-[12.5px] text-muted-foreground">{d.note}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Provider checks" icon={BadgeCheck}>
            <ul className="divide-y divide-border/70">
              {record.checks.map((c) => {
                const s = RESULT_STYLE[c.result];
                const Icon = s.icon;
                return (
                  <li key={c.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${s.cls}`}>
                      <Icon className="size-4" strokeWidth={2.1} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-bold">{c.label}</p>
                      <p className="truncate text-[12.5px] text-muted-foreground">{c.detail}</p>
                    </div>
                    <span className="ml-auto shrink-0 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </div>

        <div className="grid gap-5 content-start">
          <Panel title="Decision" eyebrow="ADM-032" icon={UserCheck}>
            {decided ? (
              <div className="rounded-xl bg-muted/50 p-4 text-[13px] text-muted-foreground">
                This case is {status === "approved" ? "approved" : "rejected"}. Reopen it from the audit log if new
                evidence arrives.
              </div>
            ) : (
              <div className="grid gap-2.5">
                <Button className="h-11 w-full" onClick={() => setOpen("approve")}>
                  Approve Tier {record.tier}
                </Button>
                <Button variant="outline" className="h-11 w-full" onClick={() => setOpen("escalate")}>
                  Escalate to MLRO
                </Button>
                <Button variant="ghost" className="h-11 w-full text-destructive hover:text-destructive" onClick={() => setOpen("reject")}>
                  Reject with reason
                </Button>
              </div>
            )}
            <p className="mt-4 text-[12px] text-muted-foreground">
              Assigned to {record.assignee}. Decisions are written to the audit log and the customer is notified.
            </p>
          </Panel>

          <Stat label="Submitted" value={record.submitted.split(",")[0] ?? record.submitted} helper={record.submitted} icon={FileText} />

          <Panel title="Case timeline" icon={CircleDashed}>
            <ol className="relative ml-1 border-l border-border/70 pl-5">
              {events.map((e, i) => (
                <li key={`${e.at}-${i}`} className="relative pb-5 last:pb-0">
                  <span className="absolute -left-[1.6rem] top-1 grid size-3 place-items-center rounded-full bg-brand ring-4 ring-card" />
                  <p className="text-[13px] font-bold">{e.action}</p>
                  <p className="text-[12px] text-muted-foreground">{e.at} · {e.actor}</p>
                  {e.note ? <p className="mt-1 rounded-lg bg-muted/50 px-2.5 py-1.5 text-[12px] text-muted-foreground">{e.note}</p> : null}
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>

      <Dialog open={open !== null} onOpenChange={(v) => (v ? null : setOpen(null))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {open === "approve" ? `Approve Tier ${record.tier}` : open === "reject" ? "Reject submission" : "Escalate to MLRO"}
            </DialogTitle>
            <DialogDescription>
              {open === "approve"
                ? `${record.name} will be upgraded immediately and can continue the blocked action.`
                : open === "reject"
                  ? "Pick a reason code. The customer sees it in-app and can resubmit."
                  : "The MLRO takes ownership of this case and any linked AML alert."}
            </DialogDescription>
          </DialogHeader>

          {open !== "approve" ? (
            <div className="grid gap-2">
              {(open === "reject" ? REJECTION_REASONS : ESCALATION_REASONS).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`rounded-xl border px-3.5 py-2.5 text-left text-[13px] font-semibold transition ${
                    reason === r ? "border-brand bg-brand/8 text-brand" : "border-border/80 hover:border-brand/30"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          ) : null}

          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Internal note (optional)"
            className="min-h-24"
          />

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(null)}>
              Cancel
            </Button>
            <Button
              disabled={open !== "approve" && !reason}
              onClick={() => open && commit(open)}
              variant={open === "reject" ? "destructive" : "default"}
            >
              {open === "approve" ? "Approve" : open === "reject" ? "Reject" : "Escalate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDoc !== null} onOpenChange={(v) => (v ? null : setActiveDoc(null))}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{activeDoc?.label}</DialogTitle>
            <DialogDescription>Captured {activeDoc?.captured} · {record.name}</DialogDescription>
          </DialogHeader>
          <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center">
            {activeDoc?.url && /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(activeDoc.url) ? (
              <img src={activeDoc.url} alt={activeDoc.label} className="max-h-80 w-full rounded-xl object-contain" />
            ) : activeDoc?.url ? (
              <a
                href={activeDoc.url}
                target="_blank"
                rel="noreferrer"
                className="text-[13px] font-bold text-brand underline"
              >
                Open document
              </a>
            ) : (
              <>
                <FileText className="size-8 text-muted-foreground" />
                <p className="mt-3 text-[13px] font-bold">{activeDoc?.note}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">No file URL on this submission.</p>
              </>
            )}
            {activeDoc?.url ? (
              <a
                href={activeDoc.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 text-[12.5px] font-bold text-brand underline"
              >
                Open in new tab
              </a>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveDoc(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
