/**
 * Withdrawal queue fixtures (ADM-050 / ADM-051 / ADM-052).
 * Prototype-only data for the admin console withdrawals workspace.
 */

export type WithdrawalStatus = "pending" | "processing" | "successful" | "declined";

export type WithdrawalRisk = "low" | "medium" | "high";

export type Withdrawal = {
  id: string;
  ref: string;
  status: WithdrawalStatus;
  amount: number;
  fee: number;
  bank: string;
  accountName: string;
  accountNumber: string;
  requestedAt: string;
  requestedDate: string;
  source: "Wallet" | "Call Account" | "Matured plan";
  risk: WithdrawalRisk;
  userId: string;
  userName: string;
  userEmail: string;
  userTier: 0 | 1 | 2;
  userSince: string;
  walletBalance: number;
  portfolioValue: number;
  lifetimeWithdrawn: number;
  priorWithdrawals: number;
  notes: string;
  declineReason?: string;
  timeline: { label: string; at: string; note?: string }[];
};

export const WITHDRAWAL_STATUS_LABEL: Record<WithdrawalStatus, string> = {
  pending: "Pending review",
  processing: "Processing",
  successful: "Successful",
  declined: "Declined",
};

export const WITHDRAWAL_STATUS_TONE: Record<WithdrawalStatus, string> = {
  pending: "bg-gold/25 text-gold-foreground ring-gold/40",
  processing: "bg-brand/10 text-brand ring-brand/20",
  successful: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20",
  declined: "bg-destructive/10 text-destructive ring-destructive/20",
};

export const RISK_TONE: Record<WithdrawalRisk, string> = {
  low: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20",
  medium: "bg-gold/25 text-gold-foreground ring-gold/40",
  high: "bg-destructive/10 text-destructive ring-destructive/20",
};

/** Reasons an operator may pick when declining (ADM-052). */
export const DECLINE_REASONS = [
  "Account name mismatch",
  "Suspected fraudulent activity",
  "Insufficient available balance",
  "Bank account could not be verified",
  "Pending compliance review",
  "Duplicate request",
];

export let WITHDRAWALS: Withdrawal[] = [];

export async function hydrateAdminWithdrawalsFromApi() {
  try {
    const { fetchAdminWithdrawals, getAdminAccessToken } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      WITHDRAWALS = [];
      return [];
    }
    const { mapWithdrawalRow } = await import("./admin-mappers");
    const rows = await fetchAdminWithdrawals();
    WITHDRAWALS = rows.map((r) => mapWithdrawalRow(r));
    return WITHDRAWALS;
  } catch {
    WITHDRAWALS = [];
    return [];
  }
}

export function getWithdrawalTotals(list: Withdrawal[] = WITHDRAWALS) {
  const pending = list.filter((w) => w.status === "pending");
  const processing = list.filter((w) => w.status === "processing");
  const successful = list.filter((w) => w.status === "successful");
  return {
    pendingCount: pending.length,
    pendingValue: pending.reduce((s, w) => s + w.amount, 0),
    processingValue: processing.reduce((s, w) => s + w.amount, 0),
    settledToday: successful.reduce((s, w) => s + w.amount, 0),
  };
}

export function withdrawalById(id: string) {
  return WITHDRAWALS.find((w) => w.id === id);
}

export async function hydrateAdminWithdrawalFromApi(id: string) {
  try {
    const { fetchAdminWithdrawal, getAdminAccessToken } = await import("./admin-api");
    if (!getAdminAccessToken()) return null;
    const { mapWithdrawalRow } = await import("./admin-mappers");
    const row = await fetchAdminWithdrawal(id);
    return mapWithdrawalRow(row, { balances: row.balances });
  } catch {
    return null;
  }
}
