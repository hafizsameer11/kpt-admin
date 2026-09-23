/**
 * Global transaction ledger fixtures (ADM-040 / ADM-041).
 * Prototype-only data for the admin console transactions workspace.
 */

import type { AdminTxnStatus, AdminTxnType } from "./admin-users-data";

export type LedgerProduct = "Wallet" | "Call Account" | "Fixed plan" | "Explore";
export type LedgerChannel =
  | "Bank transfer"
  | "Card"
  | "Wallet"
  | "System"
  | "Payout";

export type LedgerTxn = {
  id: string;
  ref: string;
  type: AdminTxnType;
  status: AdminTxnStatus;
  product: LedgerProduct;
  channel: LedgerChannel;
  label: string;
  amount: number;
  fee: number;
  userId: string;
  userName: string;
  userEmail: string;
  date: string; // ISO day
  at: string; // display timestamp
  balanceAfter: number;
  narration: string;
  related: { label: string; value: string }[];
};

export const TXN_TYPE_LABEL: Record<AdminTxnType, string> = {
  deposit: "Deposit",
  placement: "Placement",
  interest: "Interest",
  maturity: "Maturity",
  withdrawal: "Withdrawal",
};

export const TXN_STATUS_TONE: Record<AdminTxnStatus, string> = {
  successful: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20",
  processing: "bg-gold/25 text-gold-foreground ring-gold/40",
  failed: "bg-destructive/10 text-destructive ring-destructive/20",
  declined: "bg-destructive/10 text-destructive ring-destructive/20",
};

const PEOPLE = [
  { id: "u-10241", name: "Adebayo Ilesanmi", email: "adebayo.i@gmail.com" },
  { id: "u-10242", name: "Chiamaka Obi", email: "chiamaka.obi@outlook.com" },
  { id: "u-10243", name: "Tunde Bakare", email: "tunde.bakare@yahoo.com" },
  { id: "u-10244", name: "Zainab Yusuf", email: "zainab.y@gmail.com" },
  { id: "u-10245", name: "Emeka Nwosu", email: "emeka.nwosu@gmail.com" },
  { id: "u-10246", name: "Folake Adeyemi", email: "folake.a@gmail.com" },
] as const;

type Seed = {
  type: AdminTxnType;
  status: AdminTxnStatus;
  product: LedgerProduct;
  channel: LedgerChannel;
  label: string;
  amount: number;
  fee: number;
  person: number;
  day: number; // 1..4 September
  time: string;
  narration: string;
};

const SEEDS: Seed[] = [
  { type: "deposit", status: "successful", product: "Wallet", channel: "Bank transfer", label: "Wallet funding · virtual account", amount: 2_500_000, fee: 0, person: 0, day: 4, time: "08:42", narration: "Providus virtual account credit matched to the customer wallet." },
  { type: "placement", status: "successful", product: "Fixed plan", channel: "Wallet", label: "Fixed plan · 180 days @ 21.5%", amount: 2_000_000, fee: 0, person: 0, day: 4, time: "08:51", narration: "Wallet debited and principal locked into a 180-day fixed plan." },
  { type: "withdrawal", status: "processing", product: "Wallet", channel: "Payout", label: "Payout to GTBank ••4471", amount: 750_000, fee: 50, person: 1, day: 4, time: "08:20", narration: "Awaiting NIP settlement confirmation from the payout partner." },
  { type: "interest", status: "successful", product: "Call Account", channel: "System", label: "Call Account daily accrual", amount: 18_420, fee: 0, person: 2, day: 4, time: "00:05", narration: "Daily interest accrual posted by the overnight batch." },
  { type: "deposit", status: "failed", product: "Wallet", channel: "Card", label: "Card funding · Visa ••4821", amount: 300_000, fee: 4_500, person: 3, day: 4, time: "07:58", narration: "Issuer declined the authorisation — insufficient funds." },
  { type: "maturity", status: "successful", product: "Fixed plan", channel: "System", label: "Fixed plan matured · 90 days", amount: 1_356_000, fee: 0, person: 4, day: 3, time: "23:10", narration: "Principal plus interest returned to the customer wallet at maturity." },
  { type: "placement", status: "successful", product: "Explore", channel: "Wallet", label: "Explore · Commercial paper subscription", amount: 5_000_000, fee: 0, person: 5, day: 3, time: "16:32", narration: "Subscription allotted against the September commercial paper offer." },
  { type: "withdrawal", status: "successful", product: "Wallet", channel: "Payout", label: "Payout to Zenith Bank ••9902", amount: 1_200_000, fee: 50, person: 2, day: 3, time: "14:04", narration: "Settled same day via NIP." },
  { type: "deposit", status: "successful", product: "Wallet", channel: "Bank transfer", label: "Wallet funding · virtual account", amount: 850_000, fee: 0, person: 1, day: 3, time: "11:47", narration: "Inbound transfer auto-matched by reference." },
  { type: "interest", status: "successful", product: "Fixed plan", channel: "System", label: "Fixed plan interest accrual", amount: 96_300, fee: 0, person: 5, day: 3, time: "00:05", narration: "Accrual posted to the plan interest ledger." },
  { type: "placement", status: "successful", product: "Call Account", channel: "Wallet", label: "Call Account top-up", amount: 400_000, fee: 0, person: 3, day: 2, time: "18:22", narration: "Idle wallet cash moved into the Call Account." },
  { type: "withdrawal", status: "declined", product: "Wallet", channel: "Payout", label: "Payout to Access Bank ••1188", amount: 3_400_000, fee: 50, person: 4, day: 2, time: "15:19", narration: "Declined at review — payout account name mismatch." },
  { type: "deposit", status: "successful", product: "Wallet", channel: "Card", label: "Card funding · Mastercard ••7734", amount: 150_000, fee: 2_250, person: 5, day: 2, time: "12:03", narration: "Card funding successful, 1.5% processing fee applied." },
  { type: "maturity", status: "successful", product: "Explore", channel: "System", label: "Explore product matured", amount: 7_240_000, fee: 0, person: 0, day: 2, time: "09:00", narration: "Marketplace product redeemed at maturity." },
  { type: "interest", status: "successful", product: "Call Account", channel: "System", label: "Call Account daily accrual", amount: 22_940, fee: 0, person: 1, day: 2, time: "00:05", narration: "Daily interest accrual posted by the overnight batch." },
  { type: "placement", status: "processing", product: "Fixed plan", channel: "Wallet", label: "Fixed plan · 365 days @ 23.0%", amount: 10_000_000, fee: 0, person: 2, day: 1, time: "17:41", narration: "Large-ticket placement pending treasury confirmation." },
  { type: "deposit", status: "successful", product: "Wallet", channel: "Bank transfer", label: "Wallet funding · virtual account", amount: 4_600_000, fee: 0, person: 4, day: 1, time: "13:26", narration: "Inbound transfer auto-matched by reference." },
  { type: "withdrawal", status: "successful", product: "Wallet", channel: "Payout", label: "Payout to UBA ••3320", amount: 220_000, fee: 50, person: 3, day: 1, time: "10:12", narration: "Settled same day via NIP." },
  { type: "interest", status: "successful", product: "Fixed plan", channel: "System", label: "Fixed plan interest accrual", amount: 141_700, fee: 0, person: 0, day: 1, time: "00:05", narration: "Accrual posted to the plan interest ledger." },
  { type: "deposit", status: "processing", product: "Wallet", channel: "Bank transfer", label: "Wallet funding · unmatched reference", amount: 1_000_000, fee: 0, person: 5, day: 1, time: "09:33", narration: "Awaiting manual matching by reconciliation." },
];

const PREFIX: Record<AdminTxnType, string> = {
  deposit: "DEP",
  placement: "PLC",
  interest: "INT",
  maturity: "MAT",
  withdrawal: "WDR",
};

export const LEDGER: LedgerTxn[] = SEEDS.map((s, i) => {
  const p = PEOPLE[s.person]!;
  const day = String(s.day).padStart(2, "0");
  return {
    id: `tx-${(1001 + i).toString()}`,
    ref: `KP-${PREFIX[s.type]}-${(50120 + i * 137).toString()}`,
    type: s.type,
    status: s.status,
    product: s.product,
    channel: s.channel,
    label: s.label,
    amount: s.amount,
    fee: s.fee,
    userId: p.id,
    userName: p.name,
    userEmail: p.email,
    date: `2026-09-${day}`,
    at: `${day} Sep 2026 · ${s.time}`,
    balanceAfter: 120_000 + ((i * 733_000) % 9_400_000),
    narration: s.narration,
    related: [
      { label: "Settlement batch", value: `BATCH-2026-09-${day}` },
      { label: "Ledger entry", value: `GL-${(880_100 + i * 17).toString()}` },
      { label: "Initiated by", value: s.channel === "System" ? "Kipit batch job" : "Customer app" },
    ],
  };
});

let liveLedger: LedgerTxn[] = [];

export function setLiveLedger(rows: LedgerTxn[]) {
  liveLedger = rows;
}

export function getLiveLedger() {
  return liveLedger;
}

export const findLedgerTxn = (id: string) => liveLedger.find((t) => t.id === id);

export const relatedTxns = (t: LedgerTxn) =>
  liveLedger.filter((o) => o.userId === t.userId && o.id !== t.id).slice(0, 4);

export async function hydrateAdminLedgerFromApi() {
  try {
    const { getAdminAccessToken } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      liveLedger = [];
      return [];
    }
    const { loadAdminLedger } = await import("./admin-mappers");
    liveLedger = await loadAdminLedger();
    return liveLedger;
  } catch {
    liveLedger = [];
    return [];
  }
}

/* ── ADM-040 headline metrics ────────────────────────────────────────── */

export const TOTAL_INVESTED = LEDGER.filter((t) => t.type === "placement" && t.status === "successful").reduce(
  (sum, t) => sum + t.amount,
  0,
);
export const TOTAL_INTEREST_PAID = LEDGER.filter((t) => t.type === "interest").reduce(
  (sum, t) => sum + t.amount,
  0,
);
export const TXN_VOLUME = LEDGER.reduce((sum, t) => sum + t.amount, 0);

/** Daily volume split used by the ADM-040 flow chart. */
export const DAILY_FLOW = ["01", "02", "03", "04"].map((d) => {
  const rows = LEDGER.filter((t) => t.date.endsWith(`-${d}`));
  return {
    day: `${d} Sep`,
    inflow: rows
      .filter((t) => t.type === "deposit" || t.type === "maturity")
      .reduce((s, t) => s + t.amount, 0),
    outflow: rows.filter((t) => t.type === "withdrawal").reduce((s, t) => s + t.amount, 0),
    placements: rows.filter((t) => t.type === "placement").reduce((s, t) => s + t.amount, 0),
  };
});
