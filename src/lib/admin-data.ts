/**
 * Administration console dashboard metrics (ADM-010–013).
 * Figures hydrate from kipit-api; fixtures start empty / zeroed.
 */

export const naira = (value: number) =>
  `₦${value.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

export const compactNaira = (value: number) => {
  if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(2)}b`;
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}m`;
  if (value >= 1_000) return `₦${Math.round(value / 1_000)}k`;
  return naira(value);
};

/* ── ADM-010 primary metrics ─────────────────────────────────────────── */

export let WALLET_BALANCES = 0;
export let CALL_PRINCIPAL = 0;
export let FIXED_PRINCIPAL = 0;
export let EXPLORE_PRINCIPAL = 0;

export let FUM =
  WALLET_BALANCES + CALL_PRINCIPAL + FIXED_PRINCIPAL + EXPLORE_PRINCIPAL;

export let INTEREST_ACCRUED = 0;
export let INTEREST_PAYABLE = 0;

export let FUM_SERIES = [0, 0, 0, 0, 0, 0, 0];
export const FUM_LABELS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
export let FUM_CHANGE_PCT = 0;

export type Metric = {
  id: string;
  label: string;
  value: number;
  helper: string;
  changePct?: number;
};

export const PRIMARY_METRICS: Metric[] = [
  {
    id: "wallet",
    label: "Wallet balances",
    value: WALLET_BALANCES,
    helper: "Uninvested customer cash",
    changePct: 0,
  },
  {
    id: "call",
    label: "Call principal",
    value: CALL_PRINCIPAL,
    helper: "Daily-accrual Call Account",
    changePct: 0,
  },
  {
    id: "fixed",
    label: "Fixed principal",
    value: FIXED_PRINCIPAL,
    helper: "Kipit fixed-return plans",
    changePct: 0,
  },
  {
    id: "explore",
    label: "Explore principal",
    value: EXPLORE_PRINCIPAL,
    helper: "Marketplace subscriptions",
    changePct: 0,
  },
];

/* ── ADM-011 FUM breakdown ───────────────────────────────────────────── */

export type Slice = { id: string; label: string; value: number; tone: string };

export const FUM_BREAKDOWN: Slice[] = [
  { id: "fixed", label: "Fixed plans", value: FIXED_PRINCIPAL, tone: "bg-brand" },
  { id: "explore", label: "Explore products", value: EXPLORE_PRINCIPAL, tone: "bg-gold" },
  { id: "call", label: "Call money", value: CALL_PRINCIPAL, tone: "bg-brand/60" },
  { id: "wallet", label: "Wallet balances", value: WALLET_BALANCES, tone: "bg-brand/30" },
];

/** Pull live FUM + secondary dashboard panels from kipit-api. */
export let CAN_VIEW_AUM = true;

export async function hydrateAdminDashboardFromApi() {
  try {
    const {
      fetchAdminDashboard,
      fetchAdminMaturities,
      fetchAdminRecentActivity,
      fetchAdminTodayFlows,
      fetchAdminPrincipalByTenor,
      fetchAdminPrincipalByProduct,
      getAdminAccessToken,
    } = await import("./admin-api");
    if (!getAdminAccessToken()) return false;
    const [dash, maturities, activity, flows, byTenor, byProduct] = await Promise.all([
      fetchAdminDashboard(),
      fetchAdminMaturities().catch(() => [] as typeof MATURITIES),
      fetchAdminRecentActivity().catch(() => [] as typeof RECENT_ACTIVITY),
      fetchAdminTodayFlows().catch(() => ({
        deposits: 0,
        placements: 0,
        interestCredits: 0,
        withdrawals: 0,
      })),
      fetchAdminPrincipalByTenor().catch(() => [] as typeof PRINCIPAL_BY_TENOR),
      fetchAdminPrincipalByProduct().catch(() => [] as typeof PRINCIPAL_BY_PRODUCT),
    ]);
    CAN_VIEW_AUM = dash.canViewAum !== false && dash.fum != null && dash.breakdown != null;
    WALLET_BALANCES = dash.breakdown?.wallet ?? 0;
    CALL_PRINCIPAL = dash.breakdown?.call ?? 0;
    FIXED_PRINCIPAL = dash.breakdown?.placements ?? 0;
    EXPLORE_PRINCIPAL = 0;
    FUM = dash.fum ?? 0;
    FUM_CHANGE_PCT = 0;
    INTEREST_ACCRUED = 0;
    INTEREST_PAYABLE = 0;
    for (let i = 0; i < FUM_SERIES.length; i++) FUM_SERIES[i] = 0;
    zeroDemoChartSeries();
    const byId: Record<string, number> = {
      wallet: WALLET_BALANCES,
      call: CALL_PRINCIPAL,
      fixed: FIXED_PRINCIPAL,
      explore: EXPLORE_PRINCIPAL,
    };
    for (const m of PRIMARY_METRICS) {
      if (byId[m.id] !== undefined) {
        m.value = byId[m.id]!;
        m.changePct = 0;
      }
    }
    for (const s of FUM_BREAKDOWN) {
      if (byId[s.id] !== undefined) s.value = byId[s.id]!;
    }
    for (const a of ALERTS) {
      if (a.id === "kyc") a.count = dash.pendingKyc;
      if (a.id === "withdrawals") a.count = dash.pendingWithdrawals;
      if (a.id === "maturities") a.count = maturities.filter((m) => m.window === "week").length;
      if (a.id === "recon" || a.id === "failed") a.count = 0;
    }
    MATURITIES = maturities;
    RECENT_ACTIVITY = activity;
    TODAY_FLOWS.deposits = flows.deposits;
    TODAY_FLOWS.placements = flows.placements;
    TODAY_FLOWS.interestCredits = flows.interestCredits;
    TODAY_FLOWS.withdrawals = flows.withdrawals;
    PRINCIPAL_BY_TENOR = byTenor;
    PRINCIPAL_BY_PRODUCT = byProduct;
    return true;
  } catch {
    return false;
  }
}

function zeroDemoChartSeries() {
  for (const row of FUM_TREND) {
    row.total = 0;
    row.fixed = 0;
    row.explore = 0;
    row.call = 0;
    row.wallet = 0;
  }
  for (const row of FLOW_TREND) {
    row.deposits = 0;
    row.withdrawals = 0;
  }
  for (const row of INTEREST_TREND) {
    row.accrued = 0;
    row.paid = 0;
  }
  for (const row of MATURITY_SCHEDULE) {
    row.value = 0;
  }
  for (const key of Object.keys(METRIC_SPARKS)) {
    METRIC_SPARKS[key] = METRIC_SPARKS[key]!.map(() => 0);
  }
}

export let PRINCIPAL_BY_TENOR: { band: string; value: number; rate: string }[] = [];

export let PRINCIPAL_BY_PRODUCT: { product: string; value: number }[] = [];

/* ── ADM-012 maturity tracker ────────────────────────────────────────── */

export type MaturityRow = {
  id: string;
  user: string;
  product: string;
  principal: number;
  expected: number;
  date: string;
  window: "week" | "month";
};

export let MATURITIES: MaturityRow[] = [];

/* ── ADM-013 operational alerts ──────────────────────────────────────── */

export type Alert = {
  id: string;
  label: string;
  count: number;
  helper: string;
  severity: "critical" | "warning" | "info";
  to: string;
};

export const ALERTS: Alert[] = [
  {
    id: "kyc",
    label: "Pending KYC",
    count: 0,
    helper: "Awaiting compliance review",
    severity: "warning",
    to: "/",
  },
  {
    id: "withdrawals",
    label: "Pending withdrawals",
    count: 0,
    helper: "Awaiting processing",
    severity: "critical",
    to: "/",
  },
  {
    id: "recon",
    label: "Failed reconciliation",
    count: 0,
    helper: "Provider vs ledger variance",
    severity: "critical",
    to: "/",
  },
  {
    id: "failed",
    label: "Failed transactions",
    count: 0,
    helper: "Card and transfer failures today",
    severity: "warning",
    to: "/",
  },
  {
    id: "maturities",
    label: "Upcoming maturities",
    count: 0,
    helper: "Due in the next 7 days",
    severity: "info",
    to: "/",
  },
];

/* ── Supporting activity feed ────────────────────────────────────────── */

export type AdminActivityKind = "kyc" | "payout" | "rate" | "content" | "decline";

export let RECENT_ACTIVITY: {
  id: string;
  kind: AdminActivityKind;
  team: string;
  who: string;
  action: string;
  detail: string;
  at: string;
  amount?: number;
}[] = [];

export let TODAY_FLOWS = {
  deposits: 0,
  placements: 0,
  interestCredits: 0,
  withdrawals: 0,
};

/* ── Chart series (empty until API provides series) ──────────────────── */

/** FUM trend in ₦m, split by pool, for the stacked area chart. */
export const FUM_TREND = FUM_LABELS.map((month) => ({
  month,
  total: 0,
  fixed: 0,
  explore: 0,
  call: 0,
  wallet: 0,
}));

/** Last 7 days of money movement in ₦m. */
export const FLOW_TREND = [
  { day: "Fri", deposits: 0, withdrawals: 0 },
  { day: "Sat", deposits: 0, withdrawals: 0 },
  { day: "Sun", deposits: 0, withdrawals: 0 },
  { day: "Mon", deposits: 0, withdrawals: 0 },
  { day: "Tue", deposits: 0, withdrawals: 0 },
  { day: "Wed", deposits: 0, withdrawals: 0 },
  { day: "Thu", deposits: 0, withdrawals: 0 },
];

/** Interest accrued vs paid out, ₦m per month. */
export const INTEREST_TREND = FUM_LABELS.map((month) => ({
  month,
  accrued: 0,
  paid: 0,
}));

/** Maturities due, ₦m per week. */
export const MATURITY_SCHEDULE = [
  { week: "W1", value: 0 },
  { week: "W2", value: 0 },
  { week: "W3", value: 0 },
  { week: "W4", value: 0 },
  { week: "W5", value: 0 },
  { week: "W6", value: 0 },
];

/** Small sparkline series keyed by metric id (₦m). */
export const METRIC_SPARKS: Record<string, number[]> = {
  wallet: Array.from({ length: 14 }, () => 0),
  call: Array.from({ length: 14 }, () => 0),
  fixed: Array.from({ length: 14 }, () => 0),
  explore: Array.from({ length: 14 }, () => 0),
};
