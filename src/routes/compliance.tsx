import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ClipboardList,
  Clock,
  FileSearch,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat, StatusPill, TierPill } from "@/components/kipit/AdminBits";
import { hydrateAdminUsersFromApi, portfolioValue, type AdminUser } from "@/lib/admin-users-data";
import {
  hydrateAdminKycQueueFromApi,
  type ComplianceCase,
} from "@/lib/admin-compliance-data";
import { naira } from "@/lib/admin-data";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance & KYC — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Review Kipit verification queues, AML screening hits and regulatory reporting from one compliance workspace.",
      },
      { property: "og:title", content: "Compliance & KYC — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Verification queue, AML alerts and reporting for Kipit compliance officers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Compliance,
});

/** ADM-030 – ADM-035 sections. Inner screens land in later passes. */
function buildSections(awaiting: number) {
  return [
    {
      id: "ADM-030",
      label: "Verification queue",
      icon: ClipboardList,
      blurb: "Tier 1 and Tier 2 submissions awaiting a reviewer decision.",
      count: `${awaiting} waiting`,
      to: "/compliance/queue" as const,
    },
    {
      id: "ADM-031",
      label: "Submission review",
      icon: FileSearch,
      blurb: "Side-by-side documents, selfie match and BVN/NIN check results.",
      count: `${awaiting} in queue`,
      to: "/compliance/queue" as const,
    },
    {
      id: "ADM-032",
      label: "Decision & escalation",
      icon: UserCheck,
      blurb: "Approve, reject with reason codes or escalate to the MLRO.",
      count: "Open queue",
      to: "/compliance/queue" as const,
    },
    {
      id: "ADM-033",
      label: "AML screening",
      icon: AlertTriangle,
      blurb: "Sanctions, PEP and adverse-media hits raised on customer records.",
      count: "Review hits",
      to: "/compliance/aml" as const,
    },
    {
      id: "ADM-034",
      label: "Ongoing monitoring",
      icon: Clock,
      blurb: "Re-verification due dates, expiring documents and dormancy reviews.",
      count: "Monitoring",
      to: "/compliance/monitoring" as const,
    },
    {
      id: "ADM-035",
      label: "Regulatory reporting",
      icon: ShieldCheck,
      blurb: "CBN / NFIU submission packs and audit-ready evidence exports.",
      count: "Reporting packs",
      to: "/compliance/reporting" as const,
    },
  ];
}

function Compliance() {
  const [pending, setPending] = useState<AdminUser[]>([]);
  const [cases, setCases] = useState<ComplianceCase[]>([]);

  useEffect(() => {
    void Promise.all([hydrateAdminUsersFromApi(), hydrateAdminKycQueueFromApi()]).then(
      ([users, kycCases]) => {
        setPending(users.filter((u) => u.status === "pending").slice(0, 6));
        setCases(kycCases);
      },
    );
  }, []);

  const awaiting = cases.filter((c) => c.status === "pending" || c.status === "in-review").length;
  const sections = buildSections(awaiting);

  return (
    <AdminShell
      title="Compliance & KYC"
      subtitle="Verification queues, AML screening and regulatory reporting"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Awaiting review"
          value={String(awaiting)}
          helper="Tier 1 and Tier 2 combined"
          tone="brand"
          icon={ClipboardList}
        />
        <Stat label="Median decision time" value="—" helper="From live queue decisions" icon={Clock} />
        <Stat label="Open AML hits" value="—" helper="Sanctions · PEP · adverse media" tone="gold" icon={AlertTriangle} />
        <Stat label="Approval rate" value="—" helper="Rolling 30 days" icon={UserCheck} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Panel title="Compliance workspace" eyebrow="ADM-030 – ADM-035" icon={ShieldCheck}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.id}>
                  <Link
                    to={s.to}
                    className="block h-full rounded-xl border border-border/80 bg-muted/25 p-4 transition hover:border-brand/30 hover:bg-muted/45"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand/8 text-brand">
                        <Icon className="size-4" strokeWidth={2.1} />
                      </span>
                      <p className="truncate text-[13.5px] font-bold">{s.label}</p>
                      <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {s.id}
                      </span>
                    </div>
                    <p className="mt-2 text-[12.5px] leading-snug text-muted-foreground">{s.blurb}</p>
                    <p className="mt-3 inline-flex rounded-md bg-gold/20 px-2 py-0.5 text-[11px] font-bold text-gold-foreground">
                      {s.count}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Latest submissions" icon={ClipboardList}>
          <ul className="divide-y divide-border/70">
            {pending.length === 0 ? (
              <li className="py-6 text-center text-[13px] text-muted-foreground">
                No pending submissions
              </li>
            ) : (
              pending.map((u) => (
                <li key={u.id} className="flex items-center gap-3 py-3 first:pt-0">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/10 text-[11px] font-extrabold text-brand">
                    {u.name
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div className="min-w-0">
                    <Link
                      to="/users/$userId/kyc"
                      params={{ userId: u.id }}
                      className="block truncate text-[13.5px] font-bold hover:text-brand"
                    >
                      {u.name}
                    </Link>
                    <p className="truncate text-[12px] text-muted-foreground">
                      {naira(portfolioValue(u))} portfolio
                    </p>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-2">
                    <TierPill tier={u.tier} />
                    <StatusPill status={u.status} />
                  </div>
                </li>
              ))
            )}
          </ul>
          <p className="mt-4 rounded-xl bg-muted/60 p-3 text-[12.5px] text-muted-foreground">
            Open the verification queue for full document review, decisions and escalation.
          </p>
        </Panel>
      </div>
    </AdminShell>
  );
}
