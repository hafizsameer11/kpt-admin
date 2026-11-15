/**
 * Rate management fixtures (ADM-070 – ADM-073).
 * Prototype-only data: tenor bands, effective dating and maker-checker requests.
 */

export type RateStatus = "active" | "pending" | "scheduled" | "retired";

export type RateFamilyTab = "CALL" | "LOCK" | "FLEX" | "LEGACY";

export type RateBand = {
  id: string;
  code: string;
  band: string;
  product: string;
  family: RateFamilyTab | null;
  payout: "AT_MATURITY" | "UPFRONT" | null;
  standardTenorDays: number | null;
  minDays: number;
  maxDays: number;
  /** Net rate % (what client earns after WHT). */
  currentRate: number;
  /** Gross = net / 0.9 */
  currentGrossRate: number;
  rateLabel: string;
  previousRate: number;
  previousGrossRate: number;
  effectiveDate: string;
  status: RateStatus;
  minimum: number;
  placements: number;
  principal: number;
  updatedBy: string;
  history: { rate: number; effectiveDate: string; by: string; note: string }[];
};

export type RateRequestStatus = "awaiting" | "approved" | "rejected";

export type RateRequest = {
  id: string;
  bandId: string;
  band: string;
  product: string;
  family?: string | null;
  payout?: string | null;
  currentRate: number;
  currentGrossRate?: number;
  proposedRate: number;
  proposedGrossRate?: number;
  effectiveDate: string;
  submittedBy: string;
  submittedAt: string;
  reason: string;
  status: RateRequestStatus;
  decidedBy?: string;
  decidedAt?: string;
  decisionNote?: string;
};

/** Gross from net (C10 / B28). */
export function grossFromNetPct(netPct: number) {
  return netPct / 0.9;
}

/** Suggested Lock upfront net from at-maturity net (C10 formula). */
export function suggestUpfrontNetPct(atMaturityNetPct: number, days: number) {
  if (days <= 0) return atMaturityNetPct;
  const r = atMaturityNetPct / 100;
  return (r / (1 + (r * days) / 365)) * 100;
}

export const RATE_STATUS_LABEL: Record<RateStatus, string> = {
  active: "Active",
  pending: "Pending approval",
  scheduled: "Scheduled",
  retired: "Retired",
};

export const RATE_STATUS_TONE: Record<RateStatus, string> = {
  active: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20",
  pending: "bg-gold/25 text-gold-foreground ring-gold/40",
  scheduled: "bg-brand/10 text-brand ring-brand/20",
  retired: "bg-muted text-muted-foreground ring-border",
};

export const REQUEST_STATUS_LABEL: Record<RateRequestStatus, string> = {
  awaiting: "Awaiting approval",
  approved: "Approved",
  rejected: "Rejected",
};

export const REQUEST_STATUS_TONE: Record<RateRequestStatus, string> = {
  awaiting: "bg-gold/25 text-gold-foreground ring-gold/40",
  approved: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20",
  rejected: "bg-destructive/10 text-destructive ring-destructive/20",
};

export const RATE_BANDS: RateBand[] = [];

export const RATE_REQUESTS: RateRequest[] = [];

let liveRateBands: RateBand[] = [];
let liveRateRequests: RateRequest[] = [];

export function setLiveRateBands(bands: RateBand[]) {
  liveRateBands = bands;
}

export function setLiveRateRequests(requests: RateRequest[]) {
  liveRateRequests = requests;
}

export function getLiveRateBands() {
  return liveRateBands;
}

export function getLiveRateRequests() {
  return liveRateRequests;
}

export const RATE_TOTALS = {
  bands: 0,
  active: 0,
  awaiting: 0,
  scheduled: 0,
  principal: 0,
  weightedRate: 0,
};

export function findBand(id: string) {
  return liveRateBands.find((b) => b.id === id);
}

export function findRequest(id: string) {
  return liveRateRequests.find((r) => r.id === id);
}

export async function hydrateAdminRatesFromApi() {
  try {
    const { getAdminAccessToken } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      liveRateBands = [];
      liveRateRequests = [];
      return [];
    }
    const { loadAdminRateBands, loadAdminRateRequests } = await import("./admin-mappers");
    const [bands, requests] = await Promise.all([
      loadAdminRateBands(),
      loadAdminRateRequests().catch(() => [] as RateRequest[]),
    ]);
    liveRateRequests = requests;

    const awaitingByBand = new Map(
      requests
        .filter((r) => r.status === "awaiting")
        .map((r) => [r.bandId, r] as const),
    );

    liveRateBands = bands.map((band) => {
      if (band.status === "pending" || band.status === "scheduled" || band.status === "retired") {
        return band;
      }
      const awaiting = awaitingByBand.get(band.id);
      if (!awaiting) return band;
      const proposedGross = awaiting.proposedGrossRate ?? grossFromNetPct(awaiting.proposedRate);
      return {
        ...band,
        status: "pending" as const,
        previousRate: band.currentRate,
        previousGrossRate: band.currentGrossRate,
        currentRate: awaiting.proposedRate,
        currentGrossRate: proposedGross,
        rateLabel: `${awaiting.proposedRate.toFixed(2)}% net (${proposedGross.toFixed(2)}% gross)`,
        effectiveDate: awaiting.effectiveDate || band.effectiveDate,
        history: [
          {
            rate: awaiting.proposedRate,
            effectiveDate: awaiting.effectiveDate,
            by: awaiting.submittedBy,
            note: "Awaiting second approver",
          },
          ...band.history,
        ],
      };
    });
    return liveRateBands;
  } catch {
    liveRateBands = [];
    return [];
  }
}

export async function hydrateAdminRateRequestsFromApi() {
  try {
    const { getAdminAccessToken } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      liveRateRequests = [];
      return [];
    }
    const { loadAdminRateRequests } = await import("./admin-mappers");
    liveRateRequests = await loadAdminRateRequests();
    return liveRateRequests;
  } catch {
    liveRateRequests = [];
    return [];
  }
}
