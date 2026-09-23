/**
 * Administration console â€” user management demo data (ADM-020â€“025).
 * Prototype-only records modelled on the UX specification.
 */

export type Tier = 0 | 1 | 2;
export type UserStatus = "active" | "frozen" | "dormant" | "pending";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  tier: Tier;
  status: UserStatus;
  joined: string;
  lastActive: string;
  wallet: number;
  call: number;
  fixed: number;
  explore: number;
  freeze?: { reason: string; date: string; by: string };
};

export const portfolioValue = (u: AdminUser) => u.wallet + u.call + u.fixed + u.explore;

export const TIER_LABEL: Record<Tier, string> = {
  0: "Tier 0",
  1: "Tier 1",
  2: "Tier 2",
};

export const STATUS_LABEL: Record<UserStatus, string> = {
  active: "Active",
  frozen: "Frozen",
  dormant: "Dormant",
  pending: "Pending KYC",
};

export let ADMIN_USERS: AdminUser[] = [];

export async function hydrateAdminUsersFromApi(q?: string) {
  try {
    const { fetchAdminUsers, getAdminAccessToken } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      ADMIN_USERS = [];
      return [];
    }
    const { mapAdminUserListItem } = await import("./admin-mappers");
    const rows = await fetchAdminUsers(q);
    ADMIN_USERS = rows.map(mapAdminUserListItem);
    return ADMIN_USERS;
  } catch {
    ADMIN_USERS = [];
    return [];
  }
}

export const findUser = (id: string) => ADMIN_USERS.find((u) => u.id === id);

export async function hydrateAdminUserFromApi(userId: string) {
  try {
    const { getAdminAccessToken } = await import("./admin-api");
    if (!getAdminAccessToken()) return null;
    const { loadAdminUser } = await import("./admin-mappers");
    const user = await loadAdminUser(userId);
    if (user) {
      const idx = ADMIN_USERS.findIndex((u) => u.id === userId);
      if (idx >= 0) ADMIN_USERS[idx] = user;
      else ADMIN_USERS.push(user);
    }
    return user;
  } catch {
    return null;
  }
}

/* â”€â”€ ADM-023 transactions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export type AdminTxnType =
  | "deposit"
  | "placement"
  | "interest"
  | "withdrawal"
  | "maturity";
export type AdminTxnStatus = "successful" | "processing" | "failed" | "declined";

export type AdminTxn = {
  id: string;
  ref: string;
  type: AdminTxnType;
  label: string;
  amount: number;
  status: AdminTxnStatus;
  channel: string;
  at: string;
};

export const USER_TRANSACTIONS: Record<string, AdminTxn[]> = {
  default: [
    {
      id: "t1",
      ref: "KP-DEP-88231",
      type: "deposit",
      label: "Wallet funding Â· bank transfer",
      amount: 1_500_000,
      status: "successful",
      channel: "Bank transfer",
      at: "03 Sep 2026 Â· 09:12",
    },
    {
      id: "t2",
      ref: "KP-PLC-44190",
      type: "placement",
      label: "Fixed plan Â· 90 days",
      amount: 1_200_000,
      status: "successful",
      channel: "Wallet",
      at: "03 Sep 2026 Â· 09:20",
    },
    {
      id: "t3",
      ref: "KP-INT-77120",
      type: "interest",
      label: "Call Account daily interest",
      amount: 4_820,
      status: "successful",
      channel: "System",
      at: "02 Sep 2026 Â· 00:05",
    },
    {
      id: "t4",
      ref: "KP-WDL-88213",
      type: "withdrawal",
      label: "Withdrawal to GTBank ****4471",
      amount: 400_000,
      status: "processing",
      channel: "Payout",
      at: "01 Sep 2026 Â· 16:44",
    },
    {
      id: "t5",
      ref: "KP-MAT-31908",
      type: "maturity",
      label: "Fixed plan matured Â· 30 days",
      amount: 1_269_000,
      status: "successful",
      channel: "System",
      at: "28 Aug 2026 Â· 00:02",
    },
    {
      id: "t6",
      ref: "KP-DEP-88044",
      type: "deposit",
      label: "Card funding Â· Visa ****2214",
      amount: 250_000,
      status: "failed",
      channel: "Card",
      at: "26 Aug 2026 Â· 21:03",
    },
  ],
};

export const txnsFor = (id: string) => USER_TRANSACTIONS[id] ?? USER_TRANSACTIONS["default"]!;

/* â”€â”€ ADM-024 investments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export type AdminInvestment = {
  id: string;
  product: string;
  principal: number;
  rate: string;
  start: string;
  maturity: string;
  expected: number;
  state: "active" | "matured" | "adjusted";
  note?: string;
};

export const USER_INVESTMENTS: Record<string, AdminInvestment[]> = {
  default: [
    {
      id: "i1",
      product: "Kipit Fixed Â· 90 days",
      principal: 4_500_000,
      rate: "20.0%",
      start: "08 Jun 2026",
      maturity: "06 Sep 2026",
      expected: 4_721_000,
      state: "active",
    },
    {
      id: "i2",
      product: "FGN Treasury Bills",
      principal: 3_200_000,
      rate: "19.4%",
      start: "15 Jul 2026",
      maturity: "13 Oct 2026",
      expected: 3_353_000,
      state: "active",
    },
    {
      id: "i3",
      product: "Kipit Call Account",
      principal: 2_150_000,
      rate: "12.0%",
      start: "12 Jan 2026",
      maturity: "Open-ended",
      expected: 2_150_000,
      state: "active",
    },
    {
      id: "i4",
      product: "Kipit Fixed Â· 30 days",
      principal: 1_250_000,
      rate: "18.5%",
      start: "29 Jul 2026",
      maturity: "28 Aug 2026",
      expected: 1_269_000,
      state: "matured",
    },
    {
      id: "i5",
      product: "Kipit Fixed Â· 180 days",
      principal: 2_000_000,
      rate: "21.5%",
      start: "04 Mar 2026",
      maturity: "31 Aug 2026",
      expected: 2_215_000,
      state: "adjusted",
      note: "Tenor shortened by 5 days â€” approved by Global Admin (maker-checker AD-4471).",
    },
  ],
};

export const investmentsFor = (id: string) =>
  USER_INVESTMENTS[id] ?? USER_INVESTMENTS["default"]!;

/* â”€â”€ KYC tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export type KycCheck = {
  label: string;
  value: string;
  state: "passed" | "pending" | "failed";
};

export const USER_KYC: Record<string, { tier: Tier; submitted: string; reviewer: string; checks: KycCheck[] }> = {
  default: {
    tier: 2,
    submitted: "14 Feb 2026",
    reviewer: "Ngozi Umeh",
    checks: [
      { label: "BVN verification", value: "2213**** Â· name and DOB matched", state: "passed" },
      { label: "NIN verification", value: "1187**** Â· matched", state: "passed" },
      { label: "Liveness check", value: "Score 0.94 Â· passed", state: "passed" },
      { label: "Selfie match", value: "Score 0.91 Â· matched to NIN photo", state: "passed" },
      { label: "Address", value: "12 Bode Thomas, Surulere, Lagos", state: "passed" },
      { label: "Utility bill", value: "IKEDC bill Â· Jul 2026", state: "passed" },
      { label: "Occupation & source of funds", value: "Product designer Â· salary", state: "passed" },
    ],
  },
};

export const kycFor = (id: string) => USER_KYC[id] ?? USER_KYC["default"]!;

/* â”€â”€ ADM-025 sessions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export type AdminSession = {
  id: string;
  device: string;
  os: string;
  location: string;
  ip: string;
  lastSeen: string;
  status: "active" | "expired" | "revoked";
  current?: boolean;
};

export const USER_SESSIONS: Record<string, AdminSession[]> = {
  default: [
    {
      id: "s1",
      device: "iPhone 15 Pro Â· Kipit iOS 1.4.2",
      os: "iOS 18.2",
      location: "Lagos, NG",
      ip: "102.89.44.18",
      lastSeen: "18 min ago",
      status: "active",
      current: true,
    },
    {
      id: "s2",
      device: "Chrome Â· Kipit Web",
      os: "macOS 15.1",
      location: "Lagos, NG",
      ip: "105.112.7.204",
      lastSeen: "Yesterday Â· 20:41",
      status: "active",
    },
    {
      id: "s3",
      device: "Samsung S23 Â· Kipit Android 1.4.0",
      os: "Android 14",
      location: "Abuja, NG",
      ip: "197.210.85.9",
      lastSeen: "21 Aug 2026",
      status: "expired",
    },
    {
      id: "s4",
      device: "Chrome Â· Kipit Web",
      os: "Windows 11",
      location: "Accra, GH",
      ip: "154.160.22.87",
      lastSeen: "02 Aug 2026",
      status: "revoked",
    },
  ],
};

export const sessionsFor = (id: string) => USER_SESSIONS[id] ?? USER_SESSIONS["default"]!;

/* â”€â”€ Support tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export type AdminTicket = {
  id: string;
  subject: string;
  category: string;
  priority: "low" | "normal" | "high";
  status: "open" | "pending" | "resolved";
  created: string;
  lastMessage: string;
};

export const USER_TICKETS: Record<string, AdminTicket[]> = {
  default: [
    {
      id: "TK-4471",
      subject: "Withdrawal not received after 24 hours",
      category: "Withdrawals",
      priority: "high",
      status: "open",
      created: "02 Sep 2026",
      lastMessage: "Ops confirmed payout re-queued with provider.",
    },
    {
      id: "TK-4390",
      subject: "How is Call Account interest calculated?",
      category: "Product",
      priority: "low",
      status: "resolved",
      created: "18 Aug 2026",
      lastMessage: "Explained daily accrual and monthly credit.",
    },
  ],
};

export const ticketsFor = (id: string) => USER_TICKETS[id] ?? USER_TICKETS["default"]!;

/* â”€â”€ Audit tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export type AdminAudit = {
  id: string;
  admin: string;
  action: string;
  entity: string;
  previous: string;
  next: string;
  at: string;
};

export const USER_AUDIT: Record<string, AdminAudit[]> = {
  default: [
    {
      id: "au1",
      admin: "Ngozi Umeh",
      action: "Approved KYC Tier 2",
      entity: "kyc/u-10241",
      previous: "Under review",
      next: "Approved",
      at: "03 Sep 2026 Â· 08:14",
    },
    {
      id: "au2",
      admin: "Kelechi Obi",
      action: "Processed withdrawal",
      entity: "withdrawal/WD-88213",
      previous: "Pending",
      next: "Processing",
      at: "01 Sep 2026 Â· 16:52",
    },
    {
      id: "au3",
      admin: "Seyi Adeleke",
      action: "Plan adjustment approved",
      entity: "investment/i5",
      previous: "185 days",
      next: "180 days",
      at: "31 Aug 2026 Â· 11:07",
    },
    {
      id: "au4",
      admin: "System",
      action: "Login from new device",
      entity: "session/s2",
      previous: "â€”",
      next: "Chrome Â· macOS",
      at: "30 Aug 2026 Â· 20:41",
    },
  ],
};

export const auditFor = (id: string) => USER_AUDIT[id] ?? USER_AUDIT["default"]!;
