/**
 * Reconciliation fixtures (ADM-090 – ADM-092).
 * Hydrated from kipit-api; starts empty.
 */

export type ReconStatus = "matched" | "unmatched" | "variance" | "investigating" | "resolved";

export type ReconSource = "Paystack" | "Flutterwave" | "NIBSS transfer" | "Card acquirer";

export type ReconRecord = {
  id: string;
  providerRef: string;
  internalRef: string;
  source: ReconSource;
  customer: string;
  providerAmount: number;
  ledgerAmount: number;
  date: string;
  status: ReconStatus;
  channel: "Deposit" | "Withdrawal" | "Card" | "Transfer";
  note?: string;
  owner?: string;
  timeline: { label: string; at: string; by: string }[];
};

export const RECON_STATUS_LABEL: Record<ReconStatus, string> = {
  matched: "Matched",
  unmatched: "Unmatched",
  variance: "Variance",
  investigating: "Investigating",
  resolved: "Resolved",
};

export const RECON_STATUS_TONE: Record<ReconStatus, string> = {
  matched: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20",
  unmatched: "bg-destructive/10 text-destructive ring-destructive/20",
  variance: "bg-gold/25 text-gold-foreground ring-gold/40",
  investigating: "bg-brand/10 text-brand ring-brand/20",
  resolved: "bg-muted text-muted-foreground ring-border",
};

export let RECON_RECORDS: ReconRecord[] = [];

export let RECON_SOURCES: { name: ReconSource; records: number; value: number; lastSync: string }[] = [
  { name: "Paystack", records: 0, value: 0, lastSync: "—" },
  { name: "Flutterwave", records: 0, value: 0, lastSync: "—" },
  { name: "NIBSS transfer", records: 0, value: 0, lastSync: "—" },
  { name: "Card acquirer", records: 0, value: 0, lastSync: "—" },
];

export let RECON_TREND = [
  { day: "29 Aug", matched: 0, exceptions: 0 },
  { day: "30 Aug", matched: 0, exceptions: 0 },
  { day: "31 Aug", matched: 0, exceptions: 0 },
  { day: "01 Sep", matched: 0, exceptions: 0 },
  { day: "02 Sep", matched: 0, exceptions: 0 },
  { day: "03 Sep", matched: 0, exceptions: 0 },
  { day: "04 Sep", matched: 0, exceptions: 0 },
];

const count = (s: ReconStatus) => RECON_RECORDS.filter((r) => r.status === s).length;

export function computeReconTotals() {
  return {
    matched: count("matched"),
    unmatched: count("unmatched"),
    variance: count("variance"),
    investigating: count("investigating"),
    resolved: count("resolved"),
    total: RECON_RECORDS.length,
    varianceValue: RECON_RECORDS.reduce(
      (s, r) => s + Math.abs(r.providerAmount - r.ledgerAmount),
      0,
    ),
    providerValue: RECON_SOURCES.reduce((s, r) => s + r.value, 0),
  };
}

export let RECON_TOTALS = computeReconTotals();

export function findReconRecord(id: string) {
  return RECON_RECORDS.find((r) => r.id === id);
}

function mapSource(raw: string): ReconSource {
  const s = raw.toLowerCase();
  if (raw === "Flutterwave" || s.includes("flutterwave")) return "Flutterwave";
  if (raw === "NIBSS transfer" || s.includes("nibss") || s.includes("monnify") || s.includes("transfer")) {
    return "NIBSS transfer";
  }
  if (raw === "Card acquirer" || s.includes("card")) return "Card acquirer";
  return "Paystack";
}

function mapStatus(raw: string): ReconStatus {
  if (
    raw === "unmatched" ||
    raw === "variance" ||
    raw === "investigating" ||
    raw === "resolved" ||
    raw === "matched"
  ) {
    return raw;
  }
  // Backend historically stored open exceptions as "open".
  if (raw === "open") return "unmatched";
  return "unmatched";
}

function mapChannel(raw: string): ReconRecord["channel"] {
  if (raw === "Withdrawal" || raw === "Card" || raw === "Transfer" || raw === "Deposit") return raw;
  const s = raw.toLowerCase();
  if (s.includes("withdraw")) return "Withdrawal";
  if (s.includes("card")) return "Card";
  if (s.includes("transfer") || s.includes("nibss") || s.includes("monnify")) return "Transfer";
  return "Deposit";
}

function refreshReconAggregates() {
  const sources: ReconSource[] = ["Paystack", "Flutterwave", "NIBSS transfer", "Card acquirer"];
  RECON_SOURCES = sources.map((name) => {
    const rows = RECON_RECORDS.filter((r) => r.source === name);
    const latest = rows
      .map((r) => r.date)
      .sort()
      .at(-1);
    return {
      name,
      records: rows.length,
      value: rows.reduce((s, r) => s + Math.abs(r.providerAmount - r.ledgerAmount), 0),
      lastSync: latest
        ? new Date(latest).toLocaleDateString("en-NG", { day: "2-digit", month: "short" })
        : "—",
    };
  });

  const days: string[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  RECON_TREND = days.map((iso) => {
    const dayRows = RECON_RECORDS.filter((r) => r.date === iso);
    const label = new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      timeZone: "UTC",
    });
    return {
      day: label,
      matched: dayRows.filter((r) => r.status === "matched" || r.status === "resolved").length,
      exceptions: dayRows.filter(
        (r) => r.status === "unmatched" || r.status === "variance" || r.status === "investigating",
      ).length,
    };
  });

  RECON_TOTALS = computeReconTotals();
}

export async function hydrateAdminReconFromApi() {
  try {
    const { getAdminAccessToken, fetchAdminRecon } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      RECON_RECORDS = [];
      refreshReconAggregates();
      return [];
    }
    const rows = await fetchAdminRecon();
    RECON_RECORDS = rows.map((r) => ({
      id: r.id,
      providerRef: r.providerRef,
      internalRef: r.internalRef,
      source: mapSource(r.source),
      customer: r.customer,
      providerAmount: r.providerAmount,
      ledgerAmount: r.ledgerAmount,
      date: r.date,
      status: mapStatus(r.status),
      channel: mapChannel(r.channel),
      timeline: r.timeline ?? [],
      ...(r.note ? { note: r.note } : {}),
      ...(r.owner ? { owner: r.owner } : {}),
    }));
    refreshReconAggregates();
    return RECON_RECORDS;
  } catch {
    RECON_RECORDS = [];
    refreshReconAggregates();
    return [];
  }
}
