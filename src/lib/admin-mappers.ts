/**
 * Map kipit-api admin payloads → UI fixture types (admin-*-data.ts).
 */

import {
  type AdminUserListItem,
  type AdminWithdrawalRow,
  fetchAdminAudit,
  fetchAdminChatSession,
  fetchAdminChatSessions,
  fetchAdminDashboard,
  fetchAdminFeed,
  fetchAdminKycQueue,
  fetchAdminProducts,
  fetchAdminRateRequests,
  fetchAdminRates,
  fetchAdminTeam,
  fetchAdminTickets,
  fetchAdminTransaction,
  fetchAdminTransactions,
  fetchAdminUser,
  fetchAdminUserPlacements,
  fetchAdminUserSessions,
  fetchAdminUserTransactions,
  fetchAdminUsers,
  fetchAdminWithdrawal,
  fetchAdminWithdrawals,
} from "./admin-api";
import type { ComplianceCase, CaseStatus } from "./admin-compliance-data";
import type { FeedCard, FeedCardStatus } from "./admin-marketing-data";
import type { AdminProduct, ProductCategory, ProductStatus } from "./admin-products-data";
import type { RateBand, RateRequest, RateRequestStatus, RateStatus } from "./admin-rates-data";
import type { SupportTicket, TicketCategory, TicketPriority, TicketStatus } from "./admin-support-data";
import type { AdminMember, AdminRoleId, AdminStatus, AuditArea, AuditEntry, AuditSeverity } from "./admin-team-data";
import type { LedgerChannel, LedgerProduct, LedgerTxn } from "./admin-transactions-data";
import type {
  AdminAudit,
  AdminInvestment,
  AdminSession,
  AdminTicket,
  AdminTxn,
  AdminTxnStatus,
  AdminTxnType,
  AdminUser,
  Tier,
  UserStatus,
} from "./admin-users-data";
import type { ChatSession, ChatTurn, ChatIntent } from "./admin-chat-data";
import type { Withdrawal, WithdrawalRisk, WithdrawalStatus } from "./admin-withdrawals-data";

export function formatAdminDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatAdminDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const date = formatAdminDate(iso);
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} · ${time}`;
}

export function mapKycTier(tier: string | undefined | null): Tier {
  const t = (tier ?? "").toUpperCase();
  if (t === "TIER_2" || t === "2") return 2;
  if (t === "TIER_1" || t === "1") return 1;
  return 0;
}

export function mapWithdrawalStatus(status: string): WithdrawalStatus {
  const u = status.toUpperCase();
  if (u === "SUCCESSFUL" || u === "COMPLETED") return "successful";
  if (u === "DECLINED" || u === "REJECTED") return "declined";
  if (u === "PROCESSING") return "pending";
  if (u === "PENDING") return "pending";
  return "pending";
}

function mapUserStatus(row: { frozen?: boolean; kycTier?: string; status?: string }): UserStatus {
  if (row.frozen) return "frozen";
  const st = (row.status ?? "").toLowerCase();
  if (st.includes("frozen")) return "frozen";
  if (st.includes("dormant")) return "dormant";
  if (st.includes("pending")) return "pending";
  if (mapKycTier(row.kycTier) === 0) return "pending";
  return "active";
}

function displayPhone(phone: string | null | undefined): string {
  return phone?.trim() ? phone : "—";
}

function displayEmail(email: string | null | undefined): string {
  return email?.trim() ? email : "—";
}

export function mapAdminUserListItem(row: AdminUserListItem): AdminUser {
  const balances = row.balances;
  const mapped: AdminUser = {
    id: row.id,
    name: row.name || "—",
    email: displayEmail(row.email),
    phone: displayPhone(row.phone),
    tier: mapKycTier(row.kycTier),
    status: mapUserStatus(row),
    joined: formatAdminDate(row.createdAt),
    lastActive: row.lastActiveAt ? formatAdminDateTime(row.lastActiveAt) : "—",
    wallet: balances?.wallet ?? row.wallet ?? 0,
    call: balances?.call ?? row.call ?? 0,
    fixed: balances?.fixed ?? row.fixed ?? 0,
    explore: balances?.explore ?? row.explore ?? 0,
  };
  if (row.frozen) {
    mapped.freeze = { reason: "Compliance review", date: "—", by: "Compliance" };
  }
  return mapped;
}

export function mapAdminUserDetail(
  row: Awaited<ReturnType<typeof fetchAdminUser>>,
): AdminUser {
  const mapped: AdminUser = {
    id: row.id,
    name: row.name || "—",
    email: displayEmail(row.email),
    phone: displayPhone(row.phone),
    tier: mapKycTier(row.kycTier),
    status: mapUserStatus(row),
    joined: formatAdminDate(row.createdAt),
    lastActive: row.lastActive ? formatAdminDateTime(row.lastActive) : "—",
    wallet: row.balances.wallet,
    call: row.balances.call,
    fixed: row.balances.fixed,
    explore: row.balances.explore,
  };
  if (row.frozen) {
    mapped.freeze = { reason: "Compliance review", date: "—", by: "Compliance" };
  }
  return mapped;
}

function mapTxnKind(kind: string): AdminTxnType {
  const k = kind.toLowerCase();
  if (k.includes("deposit") || k.includes("fund")) return "deposit";
  if (k.includes("placement") || k.includes("invest")) return "placement";
  if (k.includes("interest") || k.includes("accrual")) return "interest";
  if (k.includes("matur")) return "maturity";
  if (k.includes("withdraw") || k.includes("payout")) return "withdrawal";
  return "deposit";
}

function mapTxnStatus(_kind: string, direction?: string): AdminTxnStatus {
  return "successful";
}

export function mapAdminUserTxn(
  row: Awaited<ReturnType<typeof fetchAdminUserTransactions>>[number],
): AdminTxn {
  return {
    id: row.id,
    ref: row.reference,
    type: mapTxnKind(row.kind),
    label: row.description?.trim() || row.kind,
    amount: row.amount,
    status: mapTxnStatus(row.kind, row.direction),
    channel: "System",
    at: formatAdminDateTime(row.createdAt),
  };
}

export function mapAdminUserPlacement(
  row: Awaited<ReturnType<typeof fetchAdminUserPlacements>>[number],
): AdminInvestment {
  const state =
    row.status.toLowerCase().includes("matur") || row.status.toLowerCase() === "closed"
      ? "matured"
      : row.status.toLowerCase().includes("adjust")
        ? "adjusted"
        : "active";
  return {
    id: row.id,
    product: row.name,
    principal: row.principal,
    rate: `${row.ratePct.toFixed(1)}%`,
    start: formatAdminDate(row.createdAt),
    maturity: row.maturityDate ? formatAdminDate(row.maturityDate) : "—",
    expected: row.principal,
    state,
  };
}

export function mapAdminUserSession(
  row: Awaited<ReturnType<typeof fetchAdminUserSessions>>[number],
): AdminSession {
  const status = row.revokedAt ? "revoked" : row.current ? "active" : "expired";
  return {
    id: row.id,
    device: row.deviceName?.trim() || row.userAgent?.trim() || "—",
    os: row.userAgent?.trim() || "—",
    location: "—",
    ip: row.ipAddress?.trim() || "—",
    lastSeen: formatAdminDateTime(row.lastActiveAt),
    status,
    current: row.current,
  };
}

export function mapWithdrawalRow(
  row: AdminWithdrawalRow,
  extra?: { balances?: { wallet: number; call: number; fixed: number; explore: number } },
): Withdrawal {
  const status = mapWithdrawalStatus(row.status);
  const wallet = extra?.balances?.wallet ?? 0;
  const portfolio =
    wallet +
    (extra?.balances?.call ?? 0) +
    (extra?.balances?.fixed ?? 0) +
    (extra?.balances?.explore ?? 0);
  const created = formatAdminDateTime(row.createdAt);
  const isoDay = row.createdAt.slice(0, 10);
  return {
    id: row.id,
    ref: row.reference,
    status,
    amount: row.amount,
    fee: 0,
    bank: row.bank || "—",
    accountName: row.accountName?.trim() || "—",
    accountNumber: row.accountNumber || "—",
    requestedAt: created,
    requestedDate: isoDay,
    source: "Wallet",
    risk: "low" as WithdrawalRisk,
    userId: row.user.id,
    userName: row.user.name || "—",
    userEmail: displayEmail(row.user.email),
    userTier: mapKycTier(row.user.kycTier),
    userSince: row.user.createdAt ? formatAdminDate(row.user.createdAt) : "—",
    walletBalance: wallet,
    portfolioValue: portfolio,
    lifetimeWithdrawn: 0,
    priorWithdrawals: 0,
    notes: "—",
    timeline: [
      { label: "Request created", at: created },
      ...(row.processedAt
        ? [{ label: "Processed", at: formatAdminDateTime(row.processedAt) }]
        : []),
    ],
    ...(row.declineReason ? { declineReason: row.declineReason } : {}),
  };
}

export function mapKycQueueItem(
  row: Awaited<ReturnType<typeof fetchAdminKycQueue>>[number],
): ComplianceCase {
  const statusRaw = row.status.toLowerCase();
  let status: CaseStatus = "pending";
  if (statusRaw.includes("review")) status = "in-review";
  else if (statusRaw.includes("escalat")) status = "escalated";
  else if (statusRaw.includes("approv")) status = "approved";
  else if (statusRaw.includes("reject")) status = "rejected";

  return {
    id: row.userId,
    userId: row.userId,
    name: row.name || "—",
    email: displayEmail(row.email),
    phone: "—",
    tier: 2,
    status,
    priority: "standard",
    submitted: formatAdminDateTime(row.updatedAt),
    waiting: "—",
    slaHours: 6,
    ageHours: 0,
    assignee: "Unassigned",
    trigger: "KYC submission",
    riskScore: 0,
    checks: [],
    documents: [],
    timeline: [{ at: formatAdminDateTime(row.updatedAt), actor: "Customer", action: "Submitted for review" }],
  };
}

export function mapRateBand(
  row: Awaited<ReturnType<typeof fetchAdminRates>>[number],
): RateBand {
  const rate = row.rateBps / 100;
  const maxDays = row.maxDays ?? row.minDays;
  const band =
    row.maxDays == null && row.minDays === 0
      ? row.label || row.code
      : row.maxDays == null
        ? `${row.minDays}+ days`
        : `${row.minDays} – ${row.maxDays} days`;
  return {
    id: row.id,
    band,
    product: row.label || "Kipit Fixed",
    minDays: row.minDays,
    maxDays: maxDays,
    currentRate: rate,
    previousRate: rate,
    effectiveDate: row.effectiveFrom.slice(0, 10),
    status: "active" as RateStatus,
    minimum: 0,
    placements: 0,
    principal: 0,
    updatedBy: "—",
    history: [],
  };
}

function mapRateRequestStatus(status: string): RateRequestStatus {
  const s = status.toLowerCase();
  if (s.includes("approv")) return "approved";
  if (s.includes("reject")) return "rejected";
  return "awaiting";
}

export function mapRateRequest(
  row: Awaited<ReturnType<typeof fetchAdminRateRequests>>[number],
): RateRequest {
  return {
    id: row.id,
    bandId: row.bandId,
    band: row.band,
    product: "Kipit Fixed",
    currentRate: row.currentRate,
    proposedRate: row.proposedRate,
    effectiveDate: row.effectiveFrom.slice(0, 10),
    submittedBy: row.submittedBy,
    submittedAt: formatAdminDateTime(row.createdAt),
    reason: row.reason?.trim() || "—",
    status: mapRateRequestStatus(row.status),
    ...(row.decidedBy ? { decidedBy: row.decidedBy } : {}),
    ...(row.decidedAt ? { decidedAt: formatAdminDateTime(row.decidedAt) } : {}),
  };
}

function mapLedgerProduct(_kind: string): LedgerProduct {
  return "Wallet";
}

function mapLedgerChannel(kind: string): LedgerChannel {
  const k = kind.toLowerCase();
  if (k.includes("card")) return "Card";
  if (k.includes("payout") || k.includes("withdraw")) return "Payout";
  if (k.includes("bank") || k.includes("transfer")) return "Bank transfer";
  return "System";
}

export function mapLedgerTxn(
  row: Awaited<ReturnType<typeof fetchAdminTransactions>>[number],
): LedgerTxn {
  const type = mapTxnKind(row.kind);
  return {
    id: row.id,
    ref: row.reference,
    type,
    status: "successful",
    product: mapLedgerProduct(row.kind),
    channel: mapLedgerChannel(row.kind),
    label: row.description?.trim() || row.kind,
    amount: row.amount,
    fee: 0,
    userId: row.user?.id ?? "—",
    userName: row.user?.name ?? "—",
    userEmail: displayEmail(row.user?.email ?? null),
    date: row.createdAt.slice(0, 10),
    at: formatAdminDateTime(row.createdAt),
    balanceAfter: 0,
    narration: row.description?.trim() || "—",
    related: [],
  };
}

export function mapAuditEntry(
  row: Awaited<ReturnType<typeof fetchAdminAudit>>[number],
): AuditEntry {
  const area = mapAuditArea(row.entityType);
  const actor =
    row.actorEmail?.trim() ||
    row.actorName?.trim() ||
    (row.actorAdminId || row.actorUserId ? "Unknown actor" : "System");
  const target =
    row.entityEmail?.trim() ||
    row.entityLabel?.trim() ||
    row.entityId ||
    "—";
  const jsonPreview = (value: unknown) => {
    if (value == null) return "—";
    if (typeof value === "string") return value || "—";
    try {
      const s = JSON.stringify(value);
      return s.length > 80 ? `${s.slice(0, 77)}…` : s;
    } catch {
      return "—";
    }
  };
  return {
    id: row.id,
    at: formatAdminDateTime(row.createdAt),
    date: formatAdminDate(row.createdAt),
    actor,
    role: row.actorRole ?? "—",
    area,
    action: row.action,
    target,
    targetId: row.entityId ?? undefined,
    ip: "—",
    device: "—",
    severity: "info" as AuditSeverity,
    before: jsonPreview(row.before),
    after: jsonPreview(row.after),
  };
}

function mapAuditArea(entityType: string | null): AuditArea {
  const t = (entityType ?? "").toLowerCase();
  if (t.includes("user")) return "users";
  if (t.includes("kyc") || t.includes("compliance")) return "compliance";
  if (t.includes("withdraw")) return "withdrawals";
  if (t.includes("rate")) return "rates";
  if (t.includes("product")) return "products";
  if (t.includes("market")) return "marketing";
  return "console";
}

function mapTicketCategory(category: string): TicketCategory {
  const c = category.toLowerCase();
  if (c.includes("withdraw")) return "withdrawal";
  if (c.includes("kyc")) return "kyc";
  if (c.includes("deposit")) return "deposit";
  if (c.includes("invest")) return "investment";
  if (c.includes("account")) return "account";
  return "general";
}

function mapTicketStatus(status: string): TicketStatus {
  const s = status.toLowerCase();
  if (s.includes("resolve")) return "resolved";
  if (s.includes("close")) return "closed";
  if (s.includes("pending")) return "pending";
  return "open";
}

export function mapSupportTicket(
  row: Awaited<ReturnType<typeof fetchAdminTickets>>[number],
): SupportTicket {
  return {
    id: row.id,
    ref: row.id.slice(0, 8).toUpperCase(),
    subject: row.subject,
    category: mapTicketCategory(row.category),
    priority: "normal" as TicketPriority,
    status: mapTicketStatus(row.status),
    createdAt: formatAdminDateTime(row.createdAt),
    updatedAt: formatAdminDateTime(row.updatedAt),
    channel: "In-app chat",
    assignee: "Unassigned",
    firstResponse: "—",
    user: {
      id: row.user.id,
      name: row.user.name || "—",
      email: displayEmail(row.user.email),
      phone: "—",
      tier: 0,
      joined: "—",
      walletBalance: 0,
      invested: 0,
      lifetimeInterest: 0,
    },
    messages: [
      {
        id: `${row.id}-body`,
        author: row.user.name || "Customer",
        role: "customer",
        at: formatAdminDateTime(row.createdAt),
        body: row.body,
      },
    ],
    transactions: [],
    history: [{ at: formatAdminDateTime(row.createdAt), label: "Ticket opened", by: row.user.name || "Customer" }],
  };
}

export function mapUserSupportTicket(row: SupportTicket): AdminTicket {
  return {
    id: row.id,
    subject: row.subject,
    category: row.category,
    priority: row.priority === "urgent" || row.priority === "high" ? "high" : row.priority === "low" ? "low" : "normal",
    status: row.status === "closed" ? "resolved" : row.status,
    created: formatAdminDate(row.createdAt),
    lastMessage: row.messages.at(-1)?.body.slice(0, 80) ?? "—",
  };
}

function mapProductCategory(name: string): ProductCategory {
  const n = name.toLowerCase();
  if (n.includes("call")) return "Call Account";
  if (n.includes("treasury")) return "Treasury Bills";
  if (n.includes("commercial")) return "Commercial Paper";
  if (n.includes("bond")) return "Corporate Bond";
  if (n.includes("fund")) return "Mutual Fund";
  return "Fixed Income";
}

function mapProductStatus(availability: string): ProductStatus {
  const a = availability.toLowerCase();
  if (a.includes("open") || a.includes("live")) return "live";
  if (a.includes("review")) return "review";
  if (a.includes("close")) return "closed";
  return "draft";
}

export function mapAdminProduct(
  row: Awaited<ReturnType<typeof fetchAdminProducts>>[number],
): AdminProduct {
  const details = row.details ?? null;
  const documents =
    details?.documents?.map((d, i) => ({
      id: `doc-${row.id}-${i}`,
      name: d.name,
      kind: "Offer document" as const,
      size: d.meta || "—",
      uploadedAt: "—",
      uploadedBy: "—",
      url: d.url || undefined,
    })) ?? [];

  return {
    id: row.id,
    name: row.name,
    category: mapProductCategory(row.category.name),
    issuer: row.issuer?.trim() || "—",
    rate: row.ratePct,
    tenorDays: row.tenorDays,
    tenorLabel: `${row.tenorDays} days`,
    minimum: row.minimum,
    status: mapProductStatus(row.availability),
    description: row.description || row.blurb || "—",
    subscribers: 0,
    raised: 0,
    capacity: 0,
    openedAt: "—",
    closesAt: "—",
    updatedAt: "—",
    updatedBy: "—",
    documents,
    history: [],
    cms: {
      about: details?.about || row.description || row.blurb || "",
      how: details?.how ?? [],
      risks: details?.risks ?? [],
      faqs: details?.faqs ?? [],
      highlights: details?.highlights ?? [],
    },
  };
}

export function mapFeedCard(row: Awaited<ReturnType<typeof fetchAdminFeed>>[number]): FeedCard {
  const status: FeedCardStatus = row.active ? "published" : "draft";
  return {
    id: row.id,
    title: row.title,
    description: row.body,
    image: "—",
    cta: row.href ? "Open" : "—",
    destination: row.href ?? "—",
    status,
    position: row.sortOrder,
    impressions: 0,
    taps: 0,
    updatedBy: "—",
    updatedAt: "—",
  };
}

function mapAdminRole(role: string): AdminRoleId {
  const r = role.toLowerCase();
  if (r.includes("global") || r.includes("super")) return "global-admin";
  if (r.includes("compliance")) return "compliance";
  if (r.includes("finance")) return "finance";
  if (r.includes("support")) return "support";
  if (r.includes("read")) return "read-only";
  return "operations";
}

export function mapAdminMember(
  row: Awaited<ReturnType<typeof fetchAdminTeam>>[number],
): AdminMember {
  const status: AdminStatus = row.active ? "active" : "suspended";
  return {
    id: row.id,
    name: row.name || "—",
    email: row.email,
    phone: "—",
    role: mapAdminRole(row.role),
    status,
    department: "—",
    createdAt: formatAdminDate(row.createdAt),
    lastActive: "—",
    twoFactor: false,
    makerChecker: false,
    actions30d: 0,
    createdBy: "—",
  };
}

function mapChatIntent(content: string): ChatIntent {
  const t = content.toLowerCase();
  if (/balance|portfolio|how much|wallet|holdings/.test(t)) return "balance";
  if (/rate|product|fixed|explore|invest|90 day|call account/.test(t)) return "product";
  if (/what is|explain|how does|mean/.test(t)) return "explain";
  if (/matur|payout|when does/.test(t)) return "maturity";
  if (/withdraw|transaction|transfer|status|where is/.test(t)) return "transaction";
  if (/add money|fund|deposit|virtual account|card/.test(t)) return "funding";
  return "unsupported";
}

function mapChatOutcome(messageCount: number, sample: string): ChatOutcome {
  if (messageCount <= 2) return "abandoned";
  const t = sample.toLowerCase();
  if (/ticket|escalat|unacceptable|support/.test(t)) return "escalated";
  if (/set it up|open|continue|invest for me|handoff|secure/.test(t)) return "handoff";
  return "resolved";
}

export function mapChatSessionListItem(
  row: Awaited<ReturnType<typeof fetchAdminChatSessions>>[number],
): ChatSession {
  const sample = row.firstUserMessage || row.lastMessage || "";
  const turns = row.messageCount ?? (row.lastMessage ? 2 : 1);
  const outcome = mapChatOutcome(turns, sample);
  return {
    id: row.id,
    ref: row.id.slice(0, 8).toUpperCase(),
    user: {
      id: row.user.id,
      name: row.user.name || "—",
      email: displayEmail(row.user.email),
    },
    device: "Mobile app",
    startedAt: formatAdminDateTime(row.createdAt),
    startedDate: row.createdAt.slice(0, 10),
    duration: "—",
    turns,
    topIntent: mapChatIntent(sample),
    outcome,
    flagged: outcome === "escalated",
    transcript: row.lastMessage
      ? [
          {
            id: `${row.id}-preview`,
            role: "assistant",
            text: row.lastMessage,
            at: formatAdminDateTime(row.createdAt),
          },
        ]
      : [],
  };
}

export function mapChatSessionDetail(
  row: Awaited<ReturnType<typeof fetchAdminChatSession>>,
): ChatSession {
  const transcript: ChatTurn[] = row.messages.map((m) => {
    const base = {
      id: m.id,
      role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
      text: m.content,
      at: formatAdminDateTime(m.createdAt),
    };
    if (m.role === "user") {
      return { ...base, intent: mapChatIntent(m.content) };
    }
    return base;
  });
  const sample = row.messages.find((m) => m.role === "user")?.content ?? "";
  const outcome = mapChatOutcome(row.messages.length, sample);
  return {
    id: row.id,
    ref: row.id.slice(0, 8).toUpperCase(),
    user: {
      id: row.user.id,
      name: row.user.name || "—",
      email: displayEmail(row.user.email),
    },
    device: "Mobile app",
    startedAt: row.messages[0] ? formatAdminDateTime(row.messages[0].createdAt) : "—",
    duration: "—",
    turns: row.messages.length,
    topIntent: mapChatIntent(sample),
    outcome,
    flagged: outcome === "escalated",
    transcript,
  };
}

export function mapUserAuditEntry(row: AuditEntry, _userId: string): AdminAudit {
  return {
    id: row.id,
    admin: row.actor,
    action: row.action,
    entity: row.target,
    previous: row.before ?? "—",
    next: row.after ?? "—",
    at: row.at,
  };
}

/** Safe loaders — empty array/object on failure (no fixture fallback). */

export async function loadAdminUsers(q?: string): Promise<AdminUser[]> {
  try {
    const rows = await fetchAdminUsers(q);
    return rows.map(mapAdminUserListItem);
  } catch {
    return [];
  }
}

export async function loadAdminUser(userId: string): Promise<AdminUser | null> {
  try {
    const row = await fetchAdminUser(userId);
    return mapAdminUserDetail(row);
  } catch {
    return null;
  }
}

export async function loadAdminUserTransactions(userId: string): Promise<AdminTxn[]> {
  try {
    const rows = await fetchAdminUserTransactions(userId);
    return rows.map(mapAdminUserTxn);
  } catch {
    return [];
  }
}

export async function loadAdminUserPlacements(userId: string): Promise<AdminInvestment[]> {
  try {
    const rows = await fetchAdminUserPlacements(userId);
    return rows.map(mapAdminUserPlacement);
  } catch {
    return [];
  }
}

export async function loadAdminUserSessions(userId: string): Promise<AdminSession[]> {
  try {
    const rows = await fetchAdminUserSessions(userId);
    return rows.map(mapAdminUserSession);
  } catch {
    return [];
  }
}

export async function loadAdminWithdrawals(): Promise<Withdrawal[]> {
  try {
    const rows = await fetchAdminWithdrawals();
    return rows.map((r) => mapWithdrawalRow(r));
  } catch {
    return [];
  }
}

export async function loadAdminWithdrawal(id: string): Promise<Withdrawal | null> {
  try {
    const row = await fetchAdminWithdrawal(id);
    return mapWithdrawalRow(row, { balances: row.balances });
  } catch {
    return null;
  }
}

export async function loadAdminKycCases(): Promise<ComplianceCase[]> {
  try {
    const rows = await fetchAdminKycQueue();
    return rows.map(mapKycQueueItem);
  } catch {
    return [];
  }
}

export async function loadAdminRateBands(): Promise<RateBand[]> {
  try {
    const rows = await fetchAdminRates();
    return rows.map(mapRateBand);
  } catch {
    return [];
  }
}

export async function loadAdminRateRequests(): Promise<RateRequest[]> {
  try {
    const rows = await fetchAdminRateRequests();
    return rows.map(mapRateRequest);
  } catch {
    return [];
  }
}

export async function loadAdminLedger(): Promise<LedgerTxn[]> {
  try {
    const rows = await fetchAdminTransactions();
    return rows.map(mapLedgerTxn);
  } catch {
    return [];
  }
}

export async function loadAdminLedgerTxn(id: string): Promise<LedgerTxn | null> {
  try {
    const rows = await fetchAdminTransactions();
    const hit = rows.find((r) => r.id === id);
    if (hit) return mapLedgerTxn(hit);
    const detail = await fetchAdminTransaction(id);
    if (detail && typeof detail === "object") {
      const d = detail as Awaited<ReturnType<typeof fetchAdminTransactions>>[number];
      return mapLedgerTxn(d);
    }
    return null;
  } catch {
    return null;
  }
}

export async function loadAdminAuditLog(): Promise<AuditEntry[]> {
  try {
    const rows = await fetchAdminAudit();
    return rows.map(mapAuditEntry);
  } catch {
    return [];
  }
}

export async function loadAdminSupportTickets(): Promise<SupportTicket[]> {
  try {
    const rows = await fetchAdminTickets();
    return rows.map(mapSupportTicket);
  } catch {
    return [];
  }
}

export async function loadAdminProducts(): Promise<AdminProduct[]> {
  try {
    const rows = await fetchAdminProducts();
    return rows.map(mapAdminProduct);
  } catch {
    return [];
  }
}

export async function loadAdminFeedCards(): Promise<FeedCard[]> {
  try {
    const rows = await fetchAdminFeed();
    return rows.map(mapFeedCard);
  } catch {
    return [];
  }
}

export async function loadAdminTeamMembers(): Promise<AdminMember[]> {
  try {
    const rows = await fetchAdminTeam();
    return rows.map(mapAdminMember);
  } catch {
    return [];
  }
}

export async function loadAdminChatSessions(): Promise<ChatSession[]> {
  try {
    const rows = await fetchAdminChatSessions();
    return rows.map(mapChatSessionListItem);
  } catch {
    return [];
  }
}

export async function loadAdminChatSession(id: string): Promise<ChatSession | null> {
  try {
    const row = await fetchAdminChatSession(id);
    return mapChatSessionDetail(row);
  } catch {
    return null;
  }
}

export type AdminDashboardSnapshot = Awaited<ReturnType<typeof fetchAdminDashboard>>;

export async function loadAdminDashboard(): Promise<AdminDashboardSnapshot | null> {
  try {
    return await fetchAdminDashboard();
  } catch {
    return null;
  }
}
