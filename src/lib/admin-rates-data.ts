/**
 * Rate management fixtures (ADM-070 – ADM-073).
 * Prototype-only data: tenor bands, effective dating and maker-checker requests.
 */

export type RateStatus = "active" | "pending" | "scheduled" | "retired";

export type RateBand = {
  id: string;
  band: string;
  product: string;
  minDays: number;
  maxDays: number;
  currentRate: number;
  previousRate: number;
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
  currentRate: number;
  proposedRate: number;
  effectiveDate: string;
  submittedBy: string;
  submittedAt: string;
  reason: string;
  status: RateRequestStatus;
  decidedBy?: string;
  decidedAt?: string;
  decisionNote?: string;
};

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

export const RATE_BANDS: RateBand[] = [
  {
    id: "rb-call",
    band: "Call — instant access",
    product: "Kipit Call Account",
    minDays: 0,
    maxDays: 0,
    currentRate: 12.5,
    previousRate: 12.0,
    effectiveDate: "2026-08-01",
    status: "active",
    minimum: 5000,
    placements: 8412,
    principal: 1_940_000_000,
    updatedBy: "Tunde A. (Treasury)",
    history: [
      { rate: 12.5, effectiveDate: "2026-08-01", by: "Tunde A.", note: "Liquidity repricing" },
      { rate: 12.0, effectiveDate: "2026-05-14", by: "Tunde A.", note: "OMO yield alignment" },
      { rate: 11.5, effectiveDate: "2026-02-02", by: "Ify N.", note: "Launch rate refresh" },
    ],
  },
  {
    id: "rb-30",
    band: "30 – 59 days",
    product: "Kipit Fixed",
    minDays: 30,
    maxDays: 59,
    currentRate: 16.25,
    previousRate: 15.75,
    effectiveDate: "2026-08-12",
    status: "active",
    minimum: 50_000,
    placements: 2140,
    principal: 780_500_000,
    updatedBy: "Tunde A. (Treasury)",
    history: [
      { rate: 16.25, effectiveDate: "2026-08-12", by: "Tunde A.", note: "T-bill stop rate up 60bps" },
      { rate: 15.75, effectiveDate: "2026-06-03", by: "Tunde A.", note: "Quarterly review" },
    ],
  },
  {
    id: "rb-60",
    band: "60 – 89 days",
    product: "Kipit Fixed",
    minDays: 60,
    maxDays: 89,
    currentRate: 17.4,
    previousRate: 17.4,
    effectiveDate: "2026-07-20",
    status: "active",
    minimum: 50_000,
    placements: 1633,
    principal: 912_300_000,
    updatedBy: "Ify N. (Treasury)",
    history: [
      { rate: 17.4, effectiveDate: "2026-07-20", by: "Ify N.", note: "Held flat" },
      { rate: 17.0, effectiveDate: "2026-04-08", by: "Tunde A.", note: "Curve steepening" },
    ],
  },
  {
    id: "rb-90",
    band: "90 – 179 days",
    product: "Kipit Fixed",
    minDays: 90,
    maxDays: 179,
    currentRate: 18.75,
    previousRate: 18.25,
    effectiveDate: "2026-09-08",
    status: "pending",
    minimum: 100_000,
    placements: 1204,
    principal: 1_356_800_000,
    updatedBy: "Chika O. (Treasury)",
    history: [
      { rate: 18.25, effectiveDate: "2026-06-18", by: "Chika O.", note: "Mid-year reset" },
      { rate: 17.9, effectiveDate: "2026-03-11", by: "Tunde A.", note: "Funding cost pass-through" },
    ],
  },
  {
    id: "rb-180",
    band: "180 – 269 days",
    product: "Kipit Fixed",
    minDays: 180,
    maxDays: 269,
    currentRate: 19.6,
    previousRate: 19.1,
    effectiveDate: "2026-09-15",
    status: "scheduled",
    minimum: 100_000,
    placements: 688,
    principal: 604_100_000,
    updatedBy: "Tunde A. (Treasury)",
    history: [
      { rate: 19.1, effectiveDate: "2026-05-30", by: "Tunde A.", note: "Long-tenor incentive" },
    ],
  },
  {
    id: "rb-270",
    band: "270 – 365 days",
    product: "Kipit Fixed",
    minDays: 270,
    maxDays: 365,
    currentRate: 20.25,
    previousRate: 20.25,
    effectiveDate: "2026-07-01",
    status: "active",
    minimum: 250_000,
    placements: 402,
    principal: 723_400_000,
    updatedBy: "Ify N. (Treasury)",
    history: [
      { rate: 20.25, effectiveDate: "2026-07-01", by: "Ify N.", note: "Annual band review" },
    ],
  },
  {
    id: "rb-legacy",
    band: "365+ days (legacy)",
    product: "Kipit Fixed",
    minDays: 366,
    maxDays: 730,
    currentRate: 20.9,
    previousRate: 20.9,
    effectiveDate: "2026-01-15",
    status: "retired",
    minimum: 500_000,
    placements: 46,
    principal: 88_200_000,
    updatedBy: "Chika O. (Treasury)",
    history: [
      { rate: 20.9, effectiveDate: "2026-01-15", by: "Chika O.", note: "Band retired to new placements" },
    ],
  },
];

export const RATE_REQUESTS: RateRequest[] = [
  {
    id: "rr-1041",
    bandId: "rb-90",
    band: "90 – 179 days",
    product: "Kipit Fixed",
    currentRate: 18.25,
    proposedRate: 18.75,
    effectiveDate: "2026-09-08",
    submittedBy: "Chika O. (Treasury)",
    submittedAt: "2026-09-03 16:42",
    reason:
      "Primary market auction cleared 55bps higher. Repricing keeps the 90-day band competitive without eroding spread.",
    status: "awaiting",
  },
  {
    id: "rr-1040",
    bandId: "rb-180",
    band: "180 – 269 days",
    product: "Kipit Fixed",
    currentRate: 19.1,
    proposedRate: 19.6,
    effectiveDate: "2026-09-15",
    submittedBy: "Tunde A. (Treasury)",
    submittedAt: "2026-09-02 11:05",
    reason: "Long tenor incentive ahead of the September campaign. Spread impact reviewed with finance.",
    status: "awaiting",
  },
  {
    id: "rr-1039",
    bandId: "rb-call",
    band: "Call — instant access",
    product: "Kipit Call Account",
    currentRate: 12.0,
    proposedRate: 12.5,
    effectiveDate: "2026-08-01",
    submittedBy: "Tunde A. (Treasury)",
    submittedAt: "2026-07-28 09:20",
    reason: "Liquidity repricing following money market yield move.",
    status: "approved",
    decidedBy: "Bola R. (Head of Treasury)",
    decidedAt: "2026-07-29 08:15",
    decisionNote: "Approved. Applies to new placements only.",
  },
  {
    id: "rr-1038",
    bandId: "rb-30",
    band: "30 – 59 days",
    product: "Kipit Fixed",
    currentRate: 15.75,
    proposedRate: 16.9,
    effectiveDate: "2026-08-05",
    submittedBy: "Chika O. (Treasury)",
    submittedAt: "2026-07-25 14:31",
    reason: "Match competitor promo rate for short tenor.",
    status: "rejected",
    decidedBy: "Bola R. (Head of Treasury)",
    decidedAt: "2026-07-26 10:02",
    decisionNote: "Rejected — spread falls below policy floor. Resubmit at 16.25%.",
  },
];

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
  bands: RATE_BANDS.length,
  active: RATE_BANDS.filter((b) => b.status === "active").length,
  awaiting: RATE_REQUESTS.filter((r) => r.status === "awaiting").length,
  scheduled: RATE_BANDS.filter((b) => b.status === "scheduled").length,
  principal: RATE_BANDS.reduce((s, b) => s + b.principal, 0),
  weightedRate:
    RATE_BANDS.reduce((s, b) => s + b.currentRate * b.principal, 0) /
    RATE_BANDS.reduce((s, b) => s + b.principal, 0),
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
      return [];
    }
    const { loadAdminRateBands } = await import("./admin-mappers");
    liveRateBands = await loadAdminRateBands();
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
