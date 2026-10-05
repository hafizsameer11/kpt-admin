/**
 * Plan adjustment fixtures (ADM-080 – ADM-081).
 * Hydrated from kipit-api; starts empty.
 */

export type AdjustmentType =
  | "rate"
  | "tenor"
  | "maturity-date"
  | "principal"
  | "payout-frequency"
  | "status";

export type AdjustmentStatus = "awaiting" | "approved" | "rejected";

export type AdjustableInvestment = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  product: string;
  reference: string;
  principal: number;
  rate: number;
  tenorDays: number;
  startDate: string;
  maturityDate: string;
  payoutFrequency: string;
  status: string;
};

export type AdjustmentRequest = {
  id: string;
  investmentId: string;
  userName: string;
  product: string;
  reference: string;
  type: AdjustmentType;
  previous: string;
  proposed: string;
  reason: string;
  submittedBy: string;
  submittedAt: string;
  status: AdjustmentStatus;
  impact: string;
  decidedBy?: string;
  decidedAt?: string;
  decisionNote?: string;
};

export const ADJUSTMENT_TYPE_LABEL: Record<AdjustmentType, string> = {
  rate: "Rate",
  tenor: "Tenor",
  "maturity-date": "Maturity date",
  principal: "Principal",
  "payout-frequency": "Payout frequency",
  status: "Plan status",
};

export const ADJUSTMENT_STATUS_LABEL: Record<AdjustmentStatus, string> = {
  awaiting: "Awaiting approval",
  approved: "Approved",
  rejected: "Rejected",
};

export const ADJUSTMENT_STATUS_TONE: Record<AdjustmentStatus, string> = {
  awaiting: "bg-gold/25 text-gold-foreground ring-gold/40",
  approved: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20",
  rejected: "bg-destructive/10 text-destructive ring-destructive/20",
};

export let ADJUSTABLE_INVESTMENTS: AdjustableInvestment[] = [];

export let ADJUSTMENT_REQUESTS: AdjustmentRequest[] = [];

export function findAdjustment(id: string) {
  return ADJUSTMENT_REQUESTS.find((r) => r.id === id);
}

export function findAdjustableInvestment(id: string) {
  return ADJUSTABLE_INVESTMENTS.find((i) => i.id === id);
}

const TYPES: AdjustmentType[] = [
  "rate",
  "tenor",
  "maturity-date",
  "principal",
  "payout-frequency",
  "status",
];

function mapType(raw: string): AdjustmentType {
  if (raw === "maturity" || raw === "maturity-date") return "maturity-date";
  if (raw === "payout" || raw === "payout-frequency") return "payout-frequency";
  if (raw === "status") return "status";
  if (raw === "rate" || raw === "tenor" || raw === "principal") return raw;
  return "rate";
}

function formatListedValue(type: AdjustmentType, raw: string) {
  const value = String(raw ?? "").trim();
  if (!value) return "—";
  if (type === "rate") {
    const n = Number(value.replace(/%/g, "").trim());
    return Number.isFinite(n) ? `${n.toFixed(2)}%` : value;
  }
  if (type === "tenor") {
    const n = Number(value.replace(/days/gi, "").trim());
    return Number.isFinite(n) ? `${n} days` : value;
  }
  if (type === "principal") {
    const n = Number(value.replace(/[₦,\s]/g, ""));
    return Number.isFinite(n) ? `₦${n.toLocaleString("en-NG")}` : value;
  }
  if (type === "maturity-date") {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    return match?.[1] ?? value;
  }
  if (type === "payout-frequency") {
    if (value === "WALLET") return "Wallet at maturity";
    if (value === "ROLLOVER") return "Roll over";
    if (value === "PAYOUT") return "Call Account";
  }
  return value;
}

function mapStatus(raw: string): AdjustmentStatus {
  if (raw === "approved" || raw === "rejected") return raw;
  return "awaiting";
}

export async function hydrateAdminAdjustmentsFromApi() {
  try {
    const { getAdminAccessToken, fetchAdminAdjustments } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      ADJUSTMENT_REQUESTS = [];
      ADJUSTABLE_INVESTMENTS = [];
      return { requests: [], investments: [] };
    }
    const data = await fetchAdminAdjustments();
    ADJUSTMENT_REQUESTS = data.requests.map((r) => ({
      id: r.id,
      investmentId: r.investmentId,
      userName: r.userName,
      product: r.product,
      reference: r.reference,
      type: mapType(r.type),
      previous: formatListedValue(mapType(r.type), r.previous),
      proposed: formatListedValue(mapType(r.type), r.proposed),
      reason: r.reason,
      submittedBy: r.submittedBy,
      submittedAt: r.submittedAt,
      status: mapStatus(r.status),
      impact: r.impact,
      ...(r.decidedBy ? { decidedBy: r.decidedBy } : {}),
      ...(r.decidedAt ? { decidedAt: r.decidedAt } : {}),
      ...(r.decisionNote ? { decisionNote: r.decisionNote } : {}),
    }));
    ADJUSTABLE_INVESTMENTS = data.investments.map((i) => ({ ...i }));
    return { requests: ADJUSTMENT_REQUESTS, investments: ADJUSTABLE_INVESTMENTS };
  } catch {
    ADJUSTMENT_REQUESTS = [];
    ADJUSTABLE_INVESTMENTS = [];
    return { requests: [], investments: [] };
  }
}
