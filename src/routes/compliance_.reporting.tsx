import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Download, FileSpreadsheet, Landmark, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { downloadCsv } from "@/lib/csv-export";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AML_ALERTS,
  getLiveComplianceCases,
  hydrateAdminAmlFromApi,
  hydrateAdminKycQueueFromApi,
  REPORT_PACKS,
  type ReportPack,
} from "@/lib/admin-compliance-data";
import { runAdminReport } from "@/lib/admin-api";
import { hydrateAdminUsersFromApi, portfolioValue } from "@/lib/admin-users-data";
import { hydrateAdminLedgerFromApi, getLiveLedger } from "@/lib/admin-transactions-data";
import { getLiveAuditLog, hydrateAdminAuditFromApi } from "@/lib/admin-team-data";

export const Route = createFileRoute("/compliance_/reporting")({
  head: () => ({
    meta: [
      { title: "Regulatory reporting — Kipit Admin Console" },
      {
        name: "description",
        content: "CBN, NFIU and SEC submission packs with audit-ready evidence exports for Kipit compliance.",
      },
      { property: "og:title", content: "Regulatory reporting — Kipit Admin Console" },
      { property: "og:description", content: "Prepare, review and submit Kipit regulatory reporting packs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportingPage,
});

const STATUS_TONE: Record<ReportPack["status"], string> = {
  draft: "bg-muted text-muted-foreground ring-border",
  ready: "bg-gold/25 text-gold-foreground ring-gold/40",
  submitted: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20",
};

const EVIDENCE_PACK_IDS: Record<string, string | null> = {
  "KYC decision log": "rp-kyc",
  "AML alert register": null,
  "Customer risk ratings": "rp-kyc",
  "Transaction extract": "rp-ledger",
  "Audit trail": "rp-audit",
  "Policy attestations": null,
};

async function downloadEvidencePack(label: string) {
  const packId = EVIDENCE_PACK_IDS[label] ?? null;
  if (packId) {
    try {
      await runAdminReport({ packId, format: "CSV" });
    } catch {
      /* still download client CSV */
    }
  }

  if (label === "KYC decision log") {
    await hydrateAdminKycQueueFromApi();
    const cases = getLiveComplianceCases();
    const n = downloadCsv(
      "kipit-kyc-decision-log",
      ["ID", "Name", "Email", "Tier", "Status", "Submitted", "Assignee", "Risk"],
      cases.map((c) => [c.id, c.name, c.email, c.tier, c.status, c.submitted, c.assignee, c.riskScore]),
    );
    toast.success(`Downloaded ${n} rows`);
    return;
  }

  if (label === "AML alert register") {
    await hydrateAdminAmlFromApi();
    const n = downloadCsv(
      "kipit-aml-alerts",
      ["ID", "Name", "Type", "Status", "Raised", "Score", "Summary", "Analyst"],
      AML_ALERTS.map((a) => [a.id, a.name, a.type, a.status, a.raised, a.score, a.summary, a.analyst]),
    );
    toast.success(`Downloaded ${n} rows`);
    return;
  }

  if (label === "Customer risk ratings") {
    const users = await hydrateAdminUsersFromApi();
    const n = downloadCsv(
      "kipit-customer-risk",
      ["ID", "Name", "Email", "Tier", "Status", "Portfolio"],
      users.map((u) => [u.id, u.name, u.email, u.tier, u.status, portfolioValue(u)]),
    );
    toast.success(`Downloaded ${n} rows`);
    return;
  }

  if (label === "Transaction extract") {
    await hydrateAdminLedgerFromApi();
    const txns = getLiveLedger();
    const n = downloadCsv(
      "kipit-transaction-extract",
      ["ID", "Reference", "User", "Type", "Amount", "Status", "At"],
      txns.map((t) => [t.id, t.ref, t.userName, t.type, t.amount, t.status, t.at]),
    );
    toast.success(`Downloaded ${n} rows`);
    return;
  }

  if (label === "Audit trail") {
    await hydrateAdminAuditFromApi();
    const entries = getLiveAuditLog();
    const n = downloadCsv(
      "kipit-compliance-audit",
      ["ID", "Actor", "Action", "Target", "At", "Severity"],
      entries.map((e) => [e.id, e.actor, e.action, e.target, e.at, e.severity]),
    );
    toast.success(`Downloaded ${n} rows`);
    return;
  }

  const n = downloadCsv(
    "kipit-policy-attestations",
    ["Policy", "Signer", "Signed at", "Version"],
    [],
  );
  toast.success(`Downloaded ${n} rows`, { description: "Empty pack — no attestations yet" });
}

function ReportingPage() {
  const [active, setActive] = useState<ReportPack | null>(null);
  const [submitted, setSubmitted] = useState<string[]>([]);

  return (
    <AdminShell title="Regulatory reporting" subtitle="ADM-035 · CBN, NFIU and SEC packs plus evidence exports">
      <Link
        to="/compliance"

        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-3.5" /> Compliance & KYC
      </Link>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Packs in flight" value={String(REPORT_PACKS.filter((r) => r.status !== "submitted").length)} helper="Draft and ready" tone="brand" icon={FileSpreadsheet} />
        <Stat label="Next deadline" value="7 Sep" helper="NFIU currency transaction report" tone="gold" icon={CalendarDays} />
        <Stat label="Submitted this year" value="14" helper="All accepted first time" icon={ShieldCheck} />
        <Stat label="Regulators covered" value="3" helper="CBN · NFIU · SEC" icon={Landmark} />
      </div>

      <Panel className="mt-5" title="Submission packs" eyebrow="ADM-035" icon={FileSpreadsheet}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left">
            <thead>
              <tr className="border-b border-border/70 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                <th className="py-2.5 pr-3">Report</th>
                <th className="py-2.5 pr-3">Regulator</th>
                <th className="py-2.5 pr-3">Period</th>
                <th className="py-2.5 pr-3">Records</th>
                <th className="py-2.5 pr-3">Due</th>
                <th className="py-2.5 pr-3">Status</th>
                <th className="py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {REPORT_PACKS.map((r) => {
                const status = submitted.includes(r.id) ? "submitted" : r.status;
                return (
                  <tr key={r.id} className="transition hover:bg-muted/40">
                    <td className="py-3 pr-3">
                      <p className="text-[13.5px] font-bold">{r.name}</p>
                      <p className="text-[12px] text-muted-foreground">{r.id} · owner {r.owner}</p>
                    </td>
                    <td className="py-3 pr-3 text-[12.5px] font-bold">{r.regulator}</td>
                    <td className="py-3 pr-3 text-[12.5px] text-muted-foreground">{r.period}</td>
                    <td className="py-3 pr-3 text-[12.5px] font-bold">{r.records.toLocaleString("en-NG")}</td>
                    <td className="py-3 pr-3 text-[12.5px] text-muted-foreground">{r.due}</td>
                    <td className="py-3 pr-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ${STATUS_TONE[status]}`}>
                        {status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setActive(r)}>
                        Open
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel className="mt-5" title="Evidence exports" icon={Download}>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { label: "KYC decision log", note: "Every approval, rejection and reason code" },
            { label: "AML alert register", note: "Alerts, dispositions and analyst notes" },
            { label: "Customer risk ratings", note: "Tier, score and last review date" },
            { label: "Transaction extract", note: "Deposits, withdrawals and interest paid" },
            { label: "Audit trail", note: "Admin actions with operator and timestamp" },
            { label: "Policy attestations", note: "Signed AML programme acknowledgements" },
          ].map((e) => (
            <li key={e.label}>
              <button
                type="button"
                onClick={() => void downloadEvidencePack(e.label)}
                className="w-full rounded-xl border border-border/80 bg-muted/25 p-4 text-left transition hover:border-brand/30 hover:bg-muted/45"
              >
                <p className="text-[13.5px] font-bold">{e.label}</p>
                <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">{e.note}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-brand">
                  <Download className="size-3.5" /> Export CSV
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      <Dialog open={active !== null} onOpenChange={(v) => (v ? null : setActive(null))}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{active?.name}</DialogTitle>
            <DialogDescription>
              {active?.regulator} · {active?.period} · {active?.records.toLocaleString("en-NG")} records
            </DialogDescription>
          </DialogHeader>
          <ul className="grid gap-2 rounded-xl bg-muted/40 p-4 text-[12.5px] text-muted-foreground">
            <li>Owner: {active?.owner}</li>
            <li>Due: {active?.due}</li>
            <li>Validation: all mandatory fields present</li>
            <li>Sign-off: MLRO approval required before submission</li>
          </ul>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (!active) return;
                const n = downloadCsv(
                  `kipit-regulatory-${active.id}`,
                  ["Pack", "Regulator", "Period", "Due", "Status", "Records", "Owner"],
                  [
                    [
                      active.name,
                      active.regulator,
                      active.period,
                      active.due,
                      active.status,
                      active.records,
                      active.owner,
                    ],
                  ],
                );
                toast.success(`Downloaded ${n} rows`);
              }}
            >
              <Download className="size-4" /> Download pack
            </Button>
            <Button
              onClick={() => {
                if (active) setSubmitted((prev) => [...prev, active.id]);
                setActive(null);
                toast.success("Pack submitted for MLRO sign-off");
              }}
            >
              <Send className="size-4" /> Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
