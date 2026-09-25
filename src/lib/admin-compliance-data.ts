/**
 * Administration console — compliance & KYC demo data (ADM-030–035).
 * Prototype-only records modelled on the UX specification.
 */

export type CaseTier = 1 | 2;
export type CaseStatus = "pending" | "in-review" | "escalated" | "approved" | "rejected";
export type CasePriority = "standard" | "high" | "urgent";

export type CheckResult = "pass" | "warn" | "fail" | "pending";

export type ComplianceCheck = {
  label: string;
  result: CheckResult;
  detail: string;
};

export type CaseDocument = {
  label: string;
  kind: "bvn" | "nin" | "selfie" | "address" | "occupation";
  captured: string;
  note: string;
  /** Durable URL when available — admin can open/view the file. */
  url?: string | null;
};

export type CaseEvent = {
  at: string;
  actor: string;
  action: string;
  note?: string;
};

export type ComplianceCase = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  tier: CaseTier;
  status: CaseStatus;
  priority: CasePriority;
  submitted: string;
  waiting: string;
  slaHours: number;
  ageHours: number;
  assignee: string;
  trigger: string;
  riskScore: number;
  checks: ComplianceCheck[];
  documents: CaseDocument[];
  timeline: CaseEvent[];
};

export const CASE_STATUS_LABEL: Record<CaseStatus, string> = {
  pending: "Pending",
  "in-review": "In review",
  escalated: "Escalated",
  approved: "Approved",
  rejected: "Rejected",
};

export const REJECTION_REASONS = [
  "Document illegible or cropped",
  "Selfie does not match ID photo",
  "BVN name mismatch",
  "NIN could not be verified",
  "Address proof older than 3 months",
  "Suspected document tampering",
];

export const ESCALATION_REASONS = [
  "Possible sanctions match",
  "PEP relationship declared",
  "Adverse media hit",
  "Source of funds unclear",
  "Multiple accounts, same BVN",
];

export const COMPLIANCE_CASES: ComplianceCase[] = [];

export type AmlHitType = "sanctions" | "pep" | "adverse-media" | "transaction";
export type AmlStatus = "open" | "investigating" | "cleared" | "reported";

export type AmlAlert = {
  id: string;
  userId: string;
  name: string;
  type: AmlHitType;
  status: AmlStatus;
  raised: string;
  score: number;
  summary: string;
  matchedAgainst: string;
  analyst: string;
  notes: { at: string; actor: string; text: string }[];
};

export const AML_TYPE_LABEL: Record<AmlHitType, string> = {
  sanctions: "Sanctions",
  pep: "PEP",
  "adverse-media": "Adverse media",
  transaction: "Transaction pattern",
};

export const AML_STATUS_LABEL: Record<AmlStatus, string> = {
  open: "Open",
  investigating: "Investigating",
  cleared: "Cleared",
  reported: "Reported to NFIU",
};

export let AML_ALERTS: AmlAlert[] = [];

export type MonitoringTask = {
  id: string;
  userId: string;
  name: string;
  kind: "Re-verification" | "Document expiry" | "Dormancy review" | "Risk refresh";
  due: string;
  daysLeft: number;
  tier: CaseTier;
  detail: string;
};

export const MONITORING_TASKS: MonitoringTask[] = [];

export type ReportPack = {
  id: string;
  name: string;
  regulator: "CBN" | "NFIU" | "SEC" | "Internal";
  period: string;
  due: string;
  status: "draft" | "ready" | "submitted";
  records: number;
  owner: string;
};

export const REPORT_PACKS: ReportPack[] = [];

let liveComplianceCases: ComplianceCase[] = [];

export function setLiveComplianceCases(cases: ComplianceCase[]) {
  liveComplianceCases = cases;
}

export function getLiveComplianceCases() {
  return liveComplianceCases;
}

export const caseById = (id: string) => liveComplianceCases.find((c) => c.id === id);
export const amlById = (id: string) => AML_ALERTS.find((a) => a.id === id);

export async function hydrateAdminKycQueueFromApi() {
  try {
    const { getAdminAccessToken } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      liveComplianceCases = [];
      return [];
    }
    const { loadAdminKycCases } = await import("./admin-mappers");
    liveComplianceCases = await loadAdminKycCases();
    return liveComplianceCases;
  } catch {
    liveComplianceCases = [];
    return [];
  }
}

export async function hydrateAdminAmlFromApi() {
  try {
    const { getAdminAccessToken, fetchAdminAmlAlerts } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      AML_ALERTS = [];
      return [];
    }
    const rows = await fetchAdminAmlAlerts();
    AML_ALERTS = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      name: r.name,
      type: (["sanctions", "pep", "adverse-media", "transaction"].includes(r.type)
        ? r.type
        : "transaction") as AmlHitType,
      status: (["open", "investigating", "cleared", "reported"].includes(r.status)
        ? r.status
        : "open") as AmlStatus,
      raised: r.raised,
      score: r.score,
      summary: r.summary,
      matchedAgainst: r.matchedAgainst,
      analyst: r.analyst,
      notes: r.notes ?? [],
    }));
    return AML_ALERTS;
  } catch {
    AML_ALERTS = [];
    return [];
  }
}
