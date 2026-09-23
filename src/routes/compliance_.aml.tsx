import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Gavel, Search, ShieldCheck, Siren } from "lucide-react";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import { Input } from "@/components/ui/input";
import {
  AML_STATUS_LABEL,
  AML_TYPE_LABEL,
  hydrateAdminAmlFromApi,
  type AmlAlert,
  type AmlHitType,
  type AmlStatus,
} from "@/lib/admin-compliance-data";

export const Route = createFileRoute("/compliance_/aml")({
  head: () => ({
    meta: [
      { title: "AML screening — Kipit Admin Console" },
      {
        name: "description",
        content: "Sanctions, PEP, adverse media and transaction-pattern alerts raised on Kipit customers.",
      },
      { property: "og:title", content: "AML screening — Kipit Admin Console" },
      { property: "og:description", content: "Investigate and clear Kipit AML alerts with a full note trail." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AmlPage,
});

export const AML_STATUS_TONE: Record<AmlStatus, string> = {
  open: "bg-destructive/10 text-destructive ring-destructive/20",
  investigating: "bg-gold/25 text-gold-foreground ring-gold/40",
  cleared: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20",
  reported: "bg-brand/10 text-brand ring-brand/20",
};

export function AmlStatusPill({ status }: { status: AmlStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${AML_STATUS_TONE[status]}`}>
      {AML_STATUS_LABEL[status]}
    </span>
  );
}

const TYPES: (AmlHitType | "all")[] = ["all", "sanctions", "pep", "adverse-media", "transaction"];

function AmlPage() {
  const [alerts, setAlerts] = useState<AmlAlert[]>([]);
  const [type, setType] = useState<AmlHitType | "all">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void hydrateAdminAmlFromApi().then(setAlerts);
  }, []);

  const rows = useMemo(
    () =>
      alerts.filter((a) => {
        if (type !== "all" && a.type !== type) return false;
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return [a.name, a.id, a.summary].some((v) => v.toLowerCase().includes(q));
      }),
    [alerts, type, query],
  );

  return (
    <AdminShell title="AML screening" subtitle="ADM-033 · Sanctions, PEP, adverse media and pattern alerts">
      <Link
        to="/compliance"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-3.5" /> Compliance & KYC
      </Link>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Open alerts" value={String(alerts.filter((a) => a.status === "open").length)} helper="Awaiting an analyst" tone="brand" icon={Siren} />
        <Stat label="Investigating" value={String(alerts.filter((a) => a.status === "investigating").length)} helper="Enhanced due diligence" tone="gold" icon={AlertTriangle} />
        <Stat label="Cleared (30d)" value={String(alerts.filter((a) => a.status === "cleared").length)} helper="False positives closed" icon={ShieldCheck} />
        <Stat label="Reported to NFIU" value="0" helper="No STR filed this month" icon={Gavel} />
      </div>

      <Panel className="mt-5" title="Alerts" eyebrow="ADM-033" icon={AlertTriangle}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-muted/60 p-1">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-lg px-3 py-1.5 text-[12.5px] font-bold transition ${
                  type === t ? "bg-card text-brand shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "all" ? "All types" : AML_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
          <div className="relative ml-auto min-w-[13rem] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search alerts" className="h-10 pl-9" />
          </div>
        </div>

        <ul className="mt-4 grid gap-3">
          {rows.map((a) => (
            <li key={a.id}>
              <Link
                to="/compliance/aml/$alertId"
                params={{ alertId: a.id }}
                className="block rounded-xl border border-border/80 bg-muted/25 p-4 transition hover:border-brand/30 hover:bg-muted/45"
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
                    <AlertTriangle className="size-4" strokeWidth={2.1} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-bold">{a.name}</p>
                    <p className="truncate text-[12px] text-muted-foreground">{a.id} · raised {a.raised} · {a.analyst}</p>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-2">
                    <span className="rounded-md bg-brand/8 px-2 py-0.5 text-[11px] font-bold text-brand">{AML_TYPE_LABEL[a.type]}</span>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">Score {a.score}</span>
                    <AmlStatusPill status={a.status} />
                  </div>
                </div>
                <p className="mt-2.5 text-[12.5px] leading-snug text-muted-foreground">{a.summary}</p>
              </Link>
            </li>
          ))}
        </ul>

        {rows.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-muted-foreground">No alerts match these filters.</p>
        ) : null}
      </Panel>
    </AdminShell>
  );
}
