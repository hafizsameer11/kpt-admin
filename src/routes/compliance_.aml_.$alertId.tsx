import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Gavel, MessageSquare, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel } from "@/components/kipit/AdminBits";
import { AmlStatusPill } from "./compliance_.aml";
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
  AML_TYPE_LABEL,
  hydrateAdminAmlFromApi,
  type AmlStatus,
} from "@/lib/admin-compliance-data";
import { updateAdminAmlAlert } from "@/lib/admin-api";

export const Route = createFileRoute("/compliance_/aml_/$alertId")({
  loader: async ({ params }) => {
    const alerts = await hydrateAdminAmlFromApi();
    const alert = alerts.find((a) => a.id === params.alertId);
    if (!alert) throw notFound();
    return { alert };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Alert not found — Kipit Admin" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.alert.name} — AML alert`;
    return {
      meta: [
        { title: `${title} — Kipit Admin Console` },
        { name: "description", content: `Investigation workspace for Kipit AML alert ${loaderData.alert.id}.` },
        { property: "og:title", content: title },
        { property: "og:description", content: "Kipit AML alert investigation, notes and disposition." },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: AlertDetail,
});

function AlertDetail() {
  const { alert } = Route.useLoaderData();
  const [status, setStatus] = useState<AmlStatus>(alert.status);
  const [notes, setNotes] = useState(alert.notes);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState<null | "clear" | "report">(null);

  function addNote() {
    if (!draft.trim()) return;
    void updateAdminAmlAlert(alert.id, { note: draft.trim() })
      .then(() => {
        setNotes((prev) => [
          ...prev,
          { at: "Just now", actor: "You (Compliance officer)", text: draft.trim() },
        ]);
        setDraft("");
        toast.success("Note added to the alert");
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not add note"));
  }

  function disposition(kind: "clear" | "report") {
    void updateAdminAmlAlert(alert.id, {
      status: kind === "clear" ? "cleared" : "str_filed",
      note:
        kind === "clear"
          ? "Alert cleared as a false positive."
          : "Suspicious transaction report filed with the NFIU.",
    })
      .then(() => {
        setStatus(kind === "clear" ? "cleared" : "reported");
        setNotes((prev) => [
          ...prev,
          {
            at: "Just now",
            actor: "You (Compliance officer)",
            text:
              kind === "clear"
                ? "Alert cleared as a false positive."
                : "Suspicious transaction report filed with the NFIU.",
          },
        ]);
        setOpen(null);
        toast.success(kind === "clear" ? "Alert cleared" : "STR queued for the NFIU");
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Could not update alert"));
  }

  const closed = status === "cleared" || status === "reported";

  return (
    <AdminShell title={`${alert.name} — AML alert`} subtitle={`ADM-033 · ${AML_TYPE_LABEL[alert.type]} · ${alert.id}`}>
      <Link
        to="/compliance/aml"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-3.5" /> AML screening
      </Link>

      <section className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-primary-foreground">
        <span className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-primary-foreground/60">
              {AML_TYPE_LABEL[alert.type]} · raised {alert.raised}
            </p>
            <h2 className="mt-1 font-display text-[26px] font-extrabold tracking-[-0.025em]">{alert.name}</h2>
            <p className="mt-2 max-w-xl text-[13px] text-primary-foreground/80">{alert.summary}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <AmlStatusPill status={status} />
              <Link
                to="/users/$userId"
                params={{ userId: alert.userId }}
                className="rounded-lg bg-white/12 px-3 py-1.5 text-[12px] font-bold text-primary-foreground ring-1 ring-white/20 transition hover:bg-white/20"
              >
                Open customer profile
              </Link>
            </div>
          </div>
          <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/15">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-primary-foreground/60">Match score</p>
            <p className="mt-1 font-display text-[28px] font-extrabold">{alert.score}</p>
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="grid gap-5">
          <Panel title="Match detail" icon={AlertTriangle}>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/35 p-4">
                <dt className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Matched against</dt>
                <dd className="mt-1 text-[13.5px] font-bold">{alert.matchedAgainst}</dd>
              </div>
              <div className="rounded-xl bg-muted/35 p-4">
                <dt className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Analyst</dt>
                <dd className="mt-1 text-[13.5px] font-bold">{alert.analyst}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Investigation notes" icon={MessageSquare}>
            <ol className="relative ml-1 border-l border-border/70 pl-5">
              {notes.map((n, i) => (
                <li key={`${n.at}-${i}`} className="relative pb-5 last:pb-0">
                  <span className="absolute -left-[1.6rem] top-1 grid size-3 place-items-center rounded-full bg-brand ring-4 ring-card" />
                  <p className="text-[13px] font-semibold">{n.text}</p>
                  <p className="text-[12px] text-muted-foreground">{n.at} · {n.actor}</p>
                </li>
              ))}
            </ol>
            <div className="mt-4 grid gap-2">
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add an investigation note" className="min-h-24" />
              <Button className="justify-self-start" onClick={addNote} disabled={!draft.trim()}>
                Add note
              </Button>
            </div>
          </Panel>
        </div>

        <div className="grid content-start gap-5">
          <Panel title="Disposition" icon={Gavel}>
            {closed ? (
              <p className="rounded-xl bg-muted/50 p-4 text-[13px] text-muted-foreground">
                This alert is {status === "cleared" ? "cleared" : "reported to the NFIU"}. Reopen it by adding new evidence.
              </p>
            ) : (
              <div className="grid gap-2.5">
                <Button className="h-11 w-full" onClick={() => setOpen("clear")}>
                  Clear as false positive
                </Button>
                <Button variant="outline" className="h-11 w-full" onClick={() => setOpen("report")}>
                  File STR with NFIU
                </Button>
                <Button
                  variant="ghost"
                  className="h-11 w-full"
                  onClick={() => {
                    void updateAdminAmlAlert(alert.id, {
                      status: "escalated",
                      assignee: "You",
                    })
                      .then(() => {
                        setStatus("investigating");
                        toast.success("Alert assigned to you");
                      })
                      .catch((err) =>
                        toast.error(err instanceof Error ? err.message : "Could not assign"),
                      );
                  }}
                >
                  Assign to me
                </Button>
              </div>
            )}
          </Panel>

          <Panel title="Linked customer" icon={User}>
            <Link
              to="/users/$userId/kyc"
              params={{ userId: alert.userId }}
              className="flex items-center gap-3 rounded-xl border border-border/80 p-3.5 transition hover:border-brand/30"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 text-[12px] font-extrabold text-brand">
                {alert.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-bold">{alert.name}</p>
                <p className="truncate text-[12px] text-muted-foreground">View KYC record</p>
              </div>
              <ShieldCheck className="ml-auto size-4 text-muted-foreground" />
            </Link>
          </Panel>
        </div>
      </div>

      <Dialog open={open !== null} onOpenChange={(v) => (v ? null : setOpen(null))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{open === "clear" ? "Clear this alert" : "File a suspicious transaction report"}</DialogTitle>
            <DialogDescription>
              {open === "clear"
                ? "Record the alert as a false positive. It stays in the audit trail."
                : "The MLRO signs off and the report is queued for NFIU submission within 24 hours."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(null)}>
              Cancel
            </Button>
            <Button onClick={() => open && disposition(open)}>{open === "clear" ? "Clear alert" : "File STR"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
