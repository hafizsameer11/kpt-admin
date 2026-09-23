/**
 * Administration console — cross-cutting console data: notifications, global
 * search index, analytics series, export/report packs, operator preferences
 * and system settings. Live values hydrate from kipit-api.
 */

import { ADMIN_USERS, portfolioValue } from "./admin-users-data";

/* ------------------------------------------------------------------ */
/* Notifications centre                                                */
/* ------------------------------------------------------------------ */

export type NotificationKind =
  | "compliance"
  | "withdrawal"
  | "reconciliation"
  | "rates"
  | "system"
  | "support";

export type AdminNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  time: string;
  day: "Today" | "Yesterday" | "Earlier";
  unread: boolean;
  priority: "high" | "normal";
  to?: string;
};

export const NOTIFICATION_LABEL: Record<NotificationKind, string> = {
  compliance: "Compliance",
  withdrawal: "Withdrawals",
  reconciliation: "Reconciliation",
  rates: "Rates",
  system: "System",
  support: "Support",
};

export const NOTIFICATION_TONE: Record<NotificationKind, string> = {
  compliance: "bg-brand/10 text-brand ring-brand/20",
  withdrawal: "bg-gold/20 text-gold-foreground ring-gold/40",
  reconciliation: "bg-amber-500/12 text-amber-700 ring-amber-500/25",
  rates: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25",
  system: "bg-muted text-muted-foreground ring-border",
  support: "bg-sky-500/12 text-sky-700 ring-sky-500/25",
};

export let ADMIN_NOTIFICATIONS: AdminNotification[] = [];

export async function hydrateAdminNotificationsFromApi() {
  try {
    const { getAdminAccessToken, fetchAdminNotifications } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      ADMIN_NOTIFICATIONS = [];
      return [];
    }
    const rows = await fetchAdminNotifications();
    const kinds: NotificationKind[] = [
      "compliance",
      "withdrawal",
      "reconciliation",
      "rates",
      "system",
      "support",
    ];
    ADMIN_NOTIFICATIONS = rows.map((r) => ({
      id: r.id,
      kind: (kinds.includes(r.kind as NotificationKind) ? r.kind : "system") as NotificationKind,
      title: r.title,
      body: r.body,
      time: r.time,
      day: r.day,
      unread: r.unread,
      priority: r.priority === "high" ? "high" : "normal",
      ...(r.to ? { to: r.to } : {}),
    }));
    return ADMIN_NOTIFICATIONS;
  } catch {
    ADMIN_NOTIFICATIONS = [];
    return [];
  }
}

/* ------------------------------------------------------------------ */
/* Global search                                                       */
/* ------------------------------------------------------------------ */

export type SearchGroup =
  | "Customers"
  | "Transactions"
  | "Withdrawals"
  | "Products"
  | "Admin pages"
  | "Console users";

export type SearchResult = {
  id: string;
  group: SearchGroup;
  title: string;
  subtitle: string;
  meta?: string;
  to: string;
  params?: Record<string, string>;
};

const PAGE_INDEX: SearchResult[] = [
  { id: "p-dash", group: "Admin pages", title: "Executive dashboard", subtitle: "FUM, flows, alerts", to: "/" },
  { id: "p-users", group: "Admin pages", title: "Users", subtitle: "Customer directory", to: "/users" },
  { id: "p-comp", group: "Admin pages", title: "Compliance & KYC", subtitle: "Queues, AML, reporting", to: "/compliance" },
  { id: "p-frozen", group: "Admin pages", title: "Frozen accounts", subtitle: "ADM-034 restricted access", to: "/compliance/frozen" },
  { id: "p-txn", group: "Admin pages", title: "Transactions", subtitle: "Ledger movements", to: "/transactions" },
  { id: "p-wd", group: "Admin pages", title: "Withdrawals", subtitle: "Payout queue", to: "/withdrawals" },
  { id: "p-recon", group: "Admin pages", title: "Reconciliation", subtitle: "Provider vs ledger", to: "/reconciliation" },
  { id: "p-prod", group: "Admin pages", title: "Products", subtitle: "Catalogue and rates", to: "/products" },
  { id: "p-rates", group: "Admin pages", title: "Rate management", subtitle: "Proposals and approvals", to: "/rates" },
  { id: "p-mkt", group: "Admin pages", title: "Marketing", subtitle: "Campaigns and feed", to: "/marketing" },
  { id: "p-sup", group: "Admin pages", title: "Support", subtitle: "Tickets and conversations", to: "/support" },
  { id: "p-ai", group: "Admin pages", title: "Ask AI log", subtitle: "Assistant usage history", to: "/ai-chat" },
  { id: "p-analytics", group: "Admin pages", title: "Reports & analytics", subtitle: "Growth, retention, product mix", to: "/analytics" },
  { id: "p-reports", group: "Admin pages", title: "Reports & exports centre", subtitle: "Scheduled packs and downloads", to: "/reports" },
  { id: "p-settings", group: "Admin pages", title: "System settings", subtitle: "Fees, limits, cut-offs, flags", to: "/settings" },
  { id: "p-profile", group: "Admin pages", title: "My profile & preferences", subtitle: "Password, 2FA, sessions", to: "/profile" },
  { id: "p-audit", group: "Admin pages", title: "Audit log", subtitle: "Immutable console trail", to: "/audit" },
  { id: "p-team", group: "Admin pages", title: "Admin users", subtitle: "Console team and roles", to: "/team" },
];

/** Operational search hits come from live API-backed directories; no seeded rows. */
const OPERATIONAL_INDEX: SearchResult[] = [];

/** Simple prototype relevance search across customers, operations and pages. */
export function globalSearch(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const customers: SearchResult[] = ADMIN_USERS.filter((u) =>
    [u.name, u.email, u.phone, u.id].some((f) => f.toLowerCase().includes(q)),
  ).map((u) => ({
    id: `c-${u.id}`,
    group: "Customers" as const,
    title: u.name,
    subtitle: `${u.email} · ${u.id}`,
    meta: `₦${portfolioValue(u).toLocaleString("en-NG")}`,
    to: "/users/$userId",
    params: { userId: u.id },
  }));

  const rest = [...OPERATIONAL_INDEX, ...PAGE_INDEX].filter((r) =>
    [r.title, r.subtitle, r.meta ?? ""].some((f) => f.toLowerCase().includes(q)),
  );

  return [...customers, ...rest];
}

/** Populated when a search-suggestions API exists; empty until then. */
export const SEARCH_SUGGESTIONS: string[] = [];

/* ------------------------------------------------------------------ */
/* Reports & analytics                                                 */
/* ------------------------------------------------------------------ */

export type AnalyticsKpi = {
  label: string;
  value: string;
  delta: string;
  up: boolean;
  helper: string;
};

export type GrowthPoint = { month: string; signups: number; funded: number; active: number };
export type NetFlowPoint = { month: string; deposits: number; withdrawals: number };
export type RetentionPoint = { cohort: string; m1: number; m2: number; m3: number };
export type ProductMixSlice = { id: string; label: string; value: number; tone: string };
export type ChannelMixRow = { channel: string; value: number };

export let ANALYTICS_MONTHS: string[] = [];
export let GROWTH_SERIES: GrowthPoint[] = [];
export let NET_FLOW_SERIES: NetFlowPoint[] = [];
export let RETENTION_SERIES: RetentionPoint[] = [];
export let PRODUCT_MIX: ProductMixSlice[] = [];
export let CHANNEL_MIX: ChannelMixRow[] = [];
export let ANALYTICS_KPIS: AnalyticsKpi[] = [];

const PRODUCT_TONES: Record<string, string> = {
  Fixed: "var(--brand)",
  Explore: "var(--gold)",
  Call: "#4C7DF0",
  Wallet: "#9AB0D6",
};

export async function hydrateAdminAnalyticsFromApi(
  range: "30 days" | "90 days" | "6 months" | "Year" = "6 months",
) {
  try {
    const { getAdminAccessToken, fetchAdminAnalytics } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      ANALYTICS_KPIS = [];
      GROWTH_SERIES = [];
      NET_FLOW_SERIES = [];
      RETENTION_SERIES = [];
      PRODUCT_MIX = [];
      CHANNEL_MIX = [];
      ANALYTICS_MONTHS = [];
      return null;
    }
    const data = await fetchAdminAnalytics(range);
    ANALYTICS_KPIS = data.kpis.map((k) => ({
      ...k,
      helper: data.range,
    }));
    GROWTH_SERIES = data.growthSeries.map((g) => ({
      month: g.month,
      signups: g.signups,
      funded: g.funded,
      active: g.funded,
    }));
    NET_FLOW_SERIES = data.netFlowSeries.map((n) => ({
      month: n.month,
      deposits: n.inflow,
      withdrawals: n.outflow,
    }));
    RETENTION_SERIES = data.retentionSeries.map((r) => ({
      cohort: r.month,
      m1: r.retention,
      m2: Math.max(50, r.retention - 8),
      m3: Math.max(50, r.retention - 14),
    }));
    PRODUCT_MIX = data.productMix.map((p) => ({
      id: p.name.toLowerCase(),
      label: p.name,
      value: p.value,
      tone: PRODUCT_TONES[p.name] ?? "var(--brand)",
    }));
    CHANNEL_MIX = data.channelMix.map((c) => ({
      channel: c.name,
      value: c.value,
    }));
    ANALYTICS_MONTHS = GROWTH_SERIES.map((g) => g.month);
    return data;
  } catch {
    ANALYTICS_KPIS = [];
    GROWTH_SERIES = [];
    NET_FLOW_SERIES = [];
    RETENTION_SERIES = [];
    PRODUCT_MIX = [];
    CHANNEL_MIX = [];
    ANALYTICS_MONTHS = [];
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Reports & exports centre                                            */
/* ------------------------------------------------------------------ */

export type ReportCategory = "Finance" | "Compliance" | "Operations" | "Growth";

export type ReportPack = {
  id: string;
  name: string;
  category: ReportCategory;
  description: string;
  formats: string[];
  cadence: "Daily" | "Weekly" | "Monthly" | "On demand" | string;
  lastRun: string;
  owner: string;
};

export let REPORT_PACKS: ReportPack[] = [];

export type ScheduledReport = {
  id: string;
  pack: string;
  cadence: string;
  recipients: string;
  next: string;
  active: boolean;
};

export let SCHEDULED_REPORTS: ScheduledReport[] = [];

export type RecentExport = {
  id: string;
  name: string;
  by: string;
  size: string;
  when: string;
  status: string;
};

export let RECENT_EXPORTS: RecentExport[] = [];

export let REPORTS_GENERATED_TODAY = 0;

function asReportCategory(value: string): ReportCategory {
  if (value === "Finance" || value === "Compliance" || value === "Operations" || value === "Growth") {
    return value;
  }
  return "Operations";
}

function formatExportWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-NG", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export async function hydrateAdminReportsFromApi() {
  try {
    const { getAdminAccessToken, fetchAdminReports } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      REPORT_PACKS = [];
      SCHEDULED_REPORTS = [];
      RECENT_EXPORTS = [];
      REPORTS_GENERATED_TODAY = 0;
      return null;
    }
    const data = await fetchAdminReports();
    REPORT_PACKS = data.packs.map((p) => ({
      id: p.id,
      name: p.name,
      category: asReportCategory(p.category),
      description: p.description,
      formats: p.formats,
      cadence: p.cadence,
      lastRun: p.lastRun,
      owner: p.owner,
    }));
    SCHEDULED_REPORTS = data.schedules.map((s) => ({ ...s }));
    RECENT_EXPORTS = data.exports.map((e) => {
      const detail =
        e.detail && typeof e.detail === "object" ? (e.detail as Record<string, unknown>) : {};
      const rowCount = typeof detail["rowCount"] === "number" ? detail["rowCount"] : null;
      const format = typeof detail["format"] === "string" ? detail["format"] : "";
      return {
        id: e.id,
        name: e.name,
        by: "System",
        size: rowCount != null ? `${rowCount.toLocaleString("en-NG")} rows` : format || "—",
        when: formatExportWhen(e.at),
        status: e.status === "SUCCESS" ? "Ready" : e.status,
      };
    });
    REPORTS_GENERATED_TODAY = data.generatedToday;
    return data;
  } catch {
    REPORT_PACKS = [];
    SCHEDULED_REPORTS = [];
    RECENT_EXPORTS = [];
    REPORTS_GENERATED_TODAY = 0;
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Operator profile                                                    */
/* ------------------------------------------------------------------ */

export type OperatorSession = {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastSeen: string;
  current: boolean;
};

export const OPERATOR_SESSIONS: OperatorSession[] = [
  {
    id: "os-1",
    device: "Chrome 128 · macOS",
    location: "Lagos, Nigeria",
    ip: "102.89.44.18",
    lastSeen: "Active now",
    current: true,
  },
  {
    id: "os-2",
    device: "Safari · iPhone 15",
    location: "Lagos, Nigeria",
    ip: "197.210.76.221",
    lastSeen: "Yesterday 20:11",
    current: false,
  },
  {
    id: "os-3",
    device: "Edge 127 · Windows 11",
    location: "Abuja, Nigeria",
    ip: "105.112.9.64",
    lastSeen: "31 Aug 09:48",
    current: false,
  },
];

export const OPERATOR_ACTIVITY = [
  { id: "oa-1", action: "Approved withdrawal WDL-40908", when: "Today 09:12" },
  { id: "oa-2", action: "Published rate change · 180-day fixed", when: "Yesterday 16:52" },
  { id: "oa-3", action: "Invited admin user Ify Chukwu", when: "02 Sep 11:02" },
  { id: "oa-4", action: "Exported console audit extract", when: "28 Aug 10:04" },
];

/* ------------------------------------------------------------------ */
/* System settings                                                     */
/* ------------------------------------------------------------------ */

export type FeeSetting = { id: string; label: string; value: string; note: string };

export let FEE_SETTINGS: FeeSetting[] = [];
export let LIMIT_SETTINGS: FeeSetting[] = [];
export let CUTOFF_SETTINGS: FeeSetting[] = [];

export type FeatureFlag = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  audience: string;
};

export let FEATURE_FLAGS: FeatureFlag[] = [];

export type MaintenanceSettings = {
  enabled: boolean;
  message: string;
  window: string;
};

export let MAINTENANCE_DEFAULT: MaintenanceSettings = {
  enabled: false,
  message: "",
  window: "",
};

export async function hydrateAdminSettingsFromApi() {
  try {
    const { getAdminAccessToken, fetchAdminSettings } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      FEE_SETTINGS = [];
      LIMIT_SETTINGS = [];
      CUTOFF_SETTINGS = [];
      FEATURE_FLAGS = [];
      MAINTENANCE_DEFAULT = { enabled: false, message: "", window: "" };
      return null;
    }
    const data = await fetchAdminSettings();
    FEE_SETTINGS = data.fees.map((r) => ({ ...r }));
    LIMIT_SETTINGS = data.limits.map((r) => ({ ...r }));
    CUTOFF_SETTINGS = data.cutoffs.map((r) => ({ ...r }));
    FEATURE_FLAGS = data.flags.map((f) => ({ ...f }));
    MAINTENANCE_DEFAULT = {
      enabled: data.maintenance.enabled,
      message: data.maintenance.message,
      window: MAINTENANCE_DEFAULT.window,
    };
    return data;
  } catch {
    FEE_SETTINGS = [];
    LIMIT_SETTINGS = [];
    CUTOFF_SETTINGS = [];
    FEATURE_FLAGS = [];
    MAINTENANCE_DEFAULT = { enabled: false, message: "", window: "" };
    return null;
  }
}
