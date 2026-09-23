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
  if (raw === "Flutterwave") return "Flutterwave";
  if (raw === "NIBSS transfer") return "NIBSS transfer";
  if (raw === "Card acquirer") return "Card acquirer";
  return "Paystack";
}

function mapStatus(raw: string): ReconStatus {
  if (raw === "unmatched" || raw === "variance" || raw === "investigating" || raw === "resolved") {
    return raw;
  }
  return "matched";
}

function mapChannel(raw: string): ReconRecord["channel"] {
  if (raw === "Withdrawal" || raw === "Card" || raw === "Transfer") return raw;
  return "Deposit";
}

export async function hydrateAdminReconFromApi() {
  try {
    const { getAdminAccessToken, fetchAdminRecon } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      RECON_RECORDS = [];
      RECON_TOTALS = computeReconTotals();
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
    RECON_TOTALS = computeReconTotals();
    return RECON_RECORDS;
  } catch {
    RECON_RECORDS = [];
    RECON_TOTALS = computeReconTotals();
    return [];
  }
}
