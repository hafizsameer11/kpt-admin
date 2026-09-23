import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarClock, Clock, FileWarning, MoonStar, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat, TierPill } from "@/components/kipit/AdminBits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MONITORING_TASKS, type MonitoringTask } from "@/lib/admin-compliance-data";

export const Route = createFileRoute("/compliance_/monitoring")({
  head: () => ({
    meta: [
      { title: "Ongoing monitoring — Kipit Admin Console" },
      {
        name: "description",
        content: "Re-verification due dates, expiring documents and dormancy reviews across Kipit customers.",
      },
      { property: "og:title", content: "Ongoing monitoring — Kipit Admin Console" },
      { property: "og:description", content: "Stay ahead of Kipit re-verification and document expiry deadlines." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MonitoringPage,
});

const KINDS: (MonitoringTask["kind"] | "all")[] = ["all", "Re-verification", "Document expiry", "Dormancy review", "Risk refresh"];

const KIND_ICON: Record<MonitoringTask["kind"], typeof RefreshCw> = {
  "Re-verification": RefreshCw,
  "Document expiry": FileWarning,
  "Dormancy review": MoonStar,
  "Risk refresh": CalendarClock,
};

function MonitoringPage() {
  const [kind, setKind] = useState<MonitoringTask["kind"] | "all">("all");
  const [active, setActive] = useState<MonitoringTask | null>(null);
  const [done, setDone] = useState<string[]>([]);

  const rows = useMemo(
    () => MONITORING_TASKS.filter((t) => kind === "all" || t.kind === kind),
    [kind],
  );

  const dueSoon = MONITORING_TASKS.filter((t) => t.daysLeft <= 14).length;

  return (
    <AdminShell title="Ongoing monitoring" subtitle="ADM-034 · Re-verification, document expiry and dormancy reviews">
      <Link
        to="/compliance"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-3.5" /> Compliance & KYC
      </Link>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Due in 30 days" value={String(MONITORING_TASKS.length)} helper="All monitoring types" tone="brand" icon={CalendarClock} />
        <Stat label="Due in 14 days" value={String(dueSoon)} helper="Prioritise this week" tone="gold" icon={Clock} />
        <Stat label="Documents expiring" value={String(MONITORING_TASKS.filter((t) => t.kind === "Document expiry").length)} helper="ID and address proofs" icon={FileWarning} />
        <Stat label="Completed today" value={String(done.length)} helper="Marked as reviewed" icon={RefreshCw} />
      </div>

      <Panel className="mt-5" title="Monitoring schedule" eyebrow="ADM-034" icon={CalendarClock}>
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-muted/60 p-1">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-lg px-3 py-1.5 text-[12.5px] font-bold transition ${
                kind === k ? "bg-card text-brand shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {k === "all" ? "All" : k}
            </button>
          ))}
        </div>

        <ul className="mt-4 divide-y divide-border/70">
          {rows.map((t) => {
            const Icon = KIND_ICON[t.kind];
            const complete = done.includes(t.id);
            return (
              <li key={t.id} className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0">
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${t.daysLeft <= 14 ? "bg-gold/25 text-gold-foreground" : "bg-brand/8 text-brand"}`}>
                  <Icon className="size-4" strokeWidth={2.1} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-bold">{t.name}</p>
                  <p className="truncate text-[12px] text-muted-foreground">{t.kind} · {t.detail}</p>
                </div>
                <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2.5">
                  <TierPill tier={t.tier} />
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[11.5px] font-bold text-muted-foreground">
                    Due {t.due} · {t.daysLeft}d
                  </span>
                  {complete ? (
                    <span className="rounded-md bg-emerald-500/12 px-2 py-0.5 text-[11.5px] font-bold text-emerald-700">Reviewed</span>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setActive(t)}>
                      Review
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Dialog open={active !== null} onOpenChange={(v) => (v ? null : setActive(null))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{active?.kind} — {active?.name}</DialogTitle>
            <DialogDescription>{active?.detail}. Due {active?.due}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 rounded-xl bg-muted/40 p-4 text-[12.5px] text-muted-foreground">
            <p>Confirm the customer record is still accurate, or request a fresh submission from them.</p>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setActive(null);
                toast.success("Re-verification requested from the customer");
              }}
            >
              Request new documents
            </Button>
            <Button
              onClick={() => {
                if (active) setDone((prev) => [...prev, active.id]);
                setActive(null);
                toast.success("Marked as reviewed");
              }}
            >
              Mark reviewed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
