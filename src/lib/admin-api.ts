/**
 * Admin console → kipit-api client. Tokens only; no UI redesign.
 */

const TOKEN_KEY = "kipit.admin.accessToken";
const MFA_TOKEN_KEY = "kipit.admin.mfaToken";

export const API_BASE =
  (typeof import.meta !== "undefined" &&
    (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL) ||
  "https://kipit-backend.amctraders.online";

export class AdminApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    if (code !== undefined) this.code = code;
  }
}

export function getAdminAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAdminAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function getAdminMfaToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(MFA_TOKEN_KEY);
}

export function setAdminMfaToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(MFA_TOKEN_KEY, token);
  else window.localStorage.removeItem(MFA_TOKEN_KEY);
}

export async function adminApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAdminAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 204) return undefined as T;
  const json = (await res.json().catch(() => ({}))) as {
    data?: T;
    error?: { message?: string; code?: string };
  };
  if (!res.ok) {
    throw new AdminApiError(
      res.status,
      json.error?.message ?? `Request failed (${res.status})`,
      json.error?.code,
    );
  }
  return (json.data ?? json) as T;
}

export async function adminLogin(email: string, password: string) {
  const data = await adminApi<{
    mfaRequired: boolean;
    mfaToken?: string;
    accessToken?: string;
    admin: { id: string; email: string; name: string; role: string };
    debugCode?: string;
  }>("/v1/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data.accessToken && !data.mfaRequired) {
    setAdminMfaToken(null);
    setAdminAccessToken(data.accessToken);
  } else {
    setAdminAccessToken(null);
    setAdminMfaToken(data.mfaToken ?? null);
  }
  return data;
}

export async function adminVerifyLoginOtp(code: string) {
  const mfaToken = getAdminMfaToken();
  if (!mfaToken) throw new AdminApiError(401, "MFA session expired. Sign in again.", "MFA_EXPIRED");
  const data = await adminApi<{
    accessToken: string;
    admin: { id: string; email: string; name: string; role: string };
  }>("/v1/admin/login/otp", {
    method: "POST",
    body: JSON.stringify({ mfaToken, code }),
  });
  setAdminMfaToken(null);
  setAdminAccessToken(data.accessToken);
  return data;
}

export async function adminResendLoginOtp() {
  const mfaToken = getAdminMfaToken();
  if (!mfaToken) throw new AdminApiError(401, "MFA session expired. Sign in again.", "MFA_EXPIRED");
  return adminApi<{ sent: boolean; debugCode?: string }>("/v1/admin/login/otp/resend", {
    method: "POST",
    body: JSON.stringify({ mfaToken }),
  });
}

export async function adminUnlockSession(pin: string) {
  return adminApi<{ unlocked: boolean }>("/v1/admin/session/unlock", {
    method: "POST",
    body: JSON.stringify({ pin }),
  });
}

export async function adminLogout() {
  try {
    if (getAdminAccessToken()) {
      await adminApi<void>("/v1/admin/logout", { method: "POST" });
    }
  } catch {
    /* still clear local token */
  }
  setAdminAccessToken(null);
  setAdminMfaToken(null);
}

export async function fetchAdminDashboard() {
  return adminApi<{
    fum: number | null;
    canViewAum?: boolean;
    users: number;
    pendingKyc: number;
    pendingWithdrawals: number;
    breakdown: { wallet: number; call: number; placements: number } | null;
  }>("/v1/admin/dashboard");
}

export type AdminUserListItem = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  kycTier: "TIER_0" | "TIER_1" | "TIER_2";
  frozen: boolean;
  createdAt: string;
  lastActiveAt?: string;
  status?: string;
  wallet?: number;
  call?: number;
  fixed?: number;
  explore?: number;
  balances?: { wallet: number; call: number; fixed: number; explore: number };
};

export async function fetchAdminUsers(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return adminApi<AdminUserListItem[]>(`/v1/admin/users${qs}`);
}

export async function createAdminUser(input: {
  accountType: "PERSONAL" | "BUSINESS";
  email: string;
  phone?: string;
  firstName: string;
  middleName?: string;
  surname: string;
  businessName?: string;
  businessRcNumber?: string;
  password?: string;
  kycTier?: "TIER_0" | "TIER_1" | "TIER_2";
}) {
  return adminApi<{
    id: string;
    email: string | null;
    name: string;
    accountType: string;
    tempPassword: string;
  }>("/v1/admin/users", { method: "POST", body: JSON.stringify(input) });
}

export async function createAdminPlacement(
  userId: string,
  input: {
    kind?: "FIXED" | "CALL" | "EXPLORE";
    amount: number;
    tenorDays?: number;
    name?: string;
    productId?: string;
    debitWallet?: boolean;
  },
) {
  return adminApi<{
    id?: string;
    name?: string;
    kind: string;
    amount?: number;
    ratePct?: number;
    tenorDays?: number;
    maturityDate?: string;
    balance?: number;
  }>(`/v1/admin/users/${userId}/placements`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchSignupDropoffs() {
  return adminApi<
    {
      id: string;
      email: string | null;
      phone: string | null;
      deviceId: string | null;
      step: string;
      lastSeenAt: string;
      metadata: unknown;
    }[]
  >("/v1/admin/funnel/dropoffs");
}

export async function fetchAdminUser(userId: string) {
  return adminApi<{
    id: string;
    email: string | null;
    phone: string | null;
    name: string;
    firstName: string;
    surname: string;
    kycTier: string;
    frozen: boolean;
    createdAt: string;
    lastActive: string;
    balances: { wallet: number; call: number; fixed: number; explore: number };
    kyc: unknown;
    kycDocuments?: {
      selfieUrl: string | null;
      addressDocUrl: string | null;
      addressStreet: string | null;
      addressCity: string | null;
      addressState: string | null;
      addressLga: string | null;
      ninName: string | null;
      bvnName: string | null;
      occupation: string | null;
      employmentStatus: string | null;
      sourceOfFunds: string | null;
    };
  }>(`/v1/admin/users/${userId}`);
}

export async function fetchAdminUserTransactions(userId: string) {
  return adminApi<
    {
      id: string;
      reference: string;
      kind: string;
      description: string | null;
      amount: number;
      direction: string;
      createdAt: string;
    }[]
  >(`/v1/admin/users/${userId}/transactions`);
}

export async function fetchAdminUserPlacements(userId: string) {
  return adminApi<
    {
      id: string;
      name: string;
      kind: string;
      status: string;
      principal: number;
      ratePct: number;
      maturityDate: string | null;
      createdAt: string;
    }[]
  >(`/v1/admin/users/${userId}/placements`);
}

export async function fetchAdminUserSessions(userId: string) {
  return adminApi<
    {
      id: string;
      deviceName: string | null;
      userAgent: string | null;
      ipAddress: string | null;
      lastActiveAt: string;
      revokedAt: string | null;
      current: boolean;
    }[]
  >(`/v1/admin/users/${userId}/sessions`);
}

export async function setAdminUserFrozen(userId: string, frozen: boolean, reason?: string) {
  return adminApi<{ id: string; frozen: boolean }>(`/v1/admin/users/${userId}/frozen`, {
    method: "PATCH",
    body: JSON.stringify({ frozen, reason }),
  });
}

export async function fetchAdminKycQueue() {
  return adminApi<
    {
      userId: string;
      name: string;
      email: string | null;
      status: string;
      updatedAt: string;
      hasSelfie?: boolean;
      hasAddressDoc?: boolean;
      selfieUrl?: string | null;
      addressDocUrl?: string | null;
      ninProviderStatus?: string | null;
      bvnProviderStatus?: string | null;
      tierTarget?: number;
    }[]
  >("/v1/admin/kyc/queue");
}

export async function reviewAdminKyc(userId: string, approve: boolean, reason?: string) {
  return adminApi<unknown>(`/v1/admin/kyc/${userId}/review`, {
    method: "POST",
    body: JSON.stringify({ approve, reason }),
  });
}

export type AdminWithdrawalRow = {
  id: string;
  reference: string;
  status: string;
  amount: number;
  declineReason?: string | null;
  bank?: string;
  accountName?: string;
  accountNumber?: string;
  /** Legacy nested shape from older admin detail responses */
  payoutBank?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
  };
  createdAt: string;
  processedAt?: string | null;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone?: string | null;
    kycTier?: string;
    createdAt?: string;
  };
};

export async function fetchAdminWithdrawals() {
  return adminApi<AdminWithdrawalRow[]>("/v1/admin/withdrawals");
}

export async function fetchAdminWithdrawal(id: string) {
  return adminApi<AdminWithdrawalRow & { balances: { wallet: number; call: number; fixed: number; explore: number } }>(
    `/v1/admin/withdrawals/${id}`,
  );
}

export async function completeAdminWithdrawal(id: string) {
  return adminApi<{ id: string; status: string }>(`/v1/admin/withdrawals/${id}/complete`, {
    method: "POST",
  });
}

export async function declineAdminWithdrawal(id: string, reason: string) {
  return adminApi<{ id: string; status: string }>(`/v1/admin/withdrawals/${id}/decline`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function fetchAdminRates() {
  return adminApi<
    {
      id: string;
      code: string;
      label: string;
      minDays: number;
      maxDays: number | null;
      rateBps: number;
      effectiveFrom: string;
    }[]
  >("/v1/admin/rates");
}

export async function fetchAdminRateRequests() {
  return adminApi<
    {
      id: string;
      bandId: string;
      band: string;
      currentRate: number;
      proposedRate: number;
      effectiveFrom: string;
      reason: string | null;
      status: string;
      submittedBy: string;
      decidedBy: string | null;
      decidedAt: string | null;
      createdAt: string;
    }[]
  >("/v1/admin/rates/requests");
}

export async function proposeAdminRate(input: {
  bandId: string;
  proposedBps: number;
  effectiveFrom: string;
  reason?: string;
}) {
  return adminApi<unknown>("/v1/admin/rates/propose", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function decideAdminRate(requestId: string, approve: boolean) {
  return adminApi<{ id: string; status: string }>(`/v1/admin/rates/${requestId}/decide`, {
    method: "POST",
    body: JSON.stringify({ approve }),
  });
}

export async function fetchAdminTransactions() {
  return adminApi<
    {
      id: string;
      reference: string;
      kind: string;
      description: string | null;
      amount: number;
      createdAt: string;
      user: { id: string; name: string; email: string | null } | null;
    }[]
  >("/v1/admin/transactions");
}

export async function fetchAdminTransaction(reference: string) {
  return adminApi<unknown>(`/v1/admin/transactions/${encodeURIComponent(reference)}`);
}

export async function fetchAdminAudit() {
  return adminApi<
    {
      id: string;
      action: string;
      entityType: string | null;
      entityId: string | null;
      actorAdminId: string | null;
      actorUserId: string | null;
      actorEmail: string | null;
      actorName: string | null;
      actorRole: string | null;
      entityEmail: string | null;
      entityLabel: string | null;
      before?: unknown;
      after?: unknown;
      createdAt: string;
    }[]
  >("/v1/admin/audit");
}

export async function fetchAdminTickets() {
  return adminApi<
    {
      id: string;
      category: string;
      subject: string;
      body: string;
      status: string;
      attachmentUrl?: string | null;
      attachmentName?: string | null;
      createdAt: string;
      updatedAt: string;
      user: { id: string; name: string; email: string | null };
    }[]
  >("/v1/admin/support/tickets");
}

export async function updateAdminTicket(
  id: string,
  input: { status?: string; adminNote?: string; reply?: string; assignee?: string },
) {
  return adminApi<unknown>(`/v1/admin/support/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function createAdminFeedCard(input: {
  title: string;
  body: string;
  kind?: string;
  href?: string;
  active?: boolean;
}) {
  return adminApi<{ id: string; title: string; active: boolean }>("/v1/admin/marketing/feed", {
    method: "POST",
    body: JSON.stringify({
      title: input.title,
      body: input.body,
      kind: input.kind ?? "promo",
      href: input.href,
      active: input.active ?? true,
    }),
  });
}

export async function updateAdminFeedCard(
  id: string,
  input: { title?: string; body?: string; active?: boolean; href?: string | null },
) {
  return adminApi<{ id: string; active: boolean }>(`/v1/admin/marketing/feed/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function createAdminTeamMember(input: {
  email: string;
  name: string;
  role: string;
  password?: string;
  pin?: string;
}) {
  return adminApi<{
    id: string;
    email: string;
    name: string;
    role: string;
    active: boolean;
    tempPassword?: string;
    tempPin?: string;
  }>("/v1/admin/team", { method: "POST", body: JSON.stringify(input) });
}

export async function updateAdminTeamMember(
  id: string,
  input: { name?: string; role?: string; active?: boolean },
) {
  return adminApi<{ id: string; active: boolean; role: string }>(`/v1/admin/team/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function revokeAdminUserSession(userId: string, sessionId: string) {
  return adminApi<{ id: string; revoked: boolean }>(
    `/v1/admin/users/${userId}/sessions/${sessionId}/revoke`,
    { method: "POST" },
  );
}

export async function createAdminCampaign(input: {
  name: string;
  channel?: string;
  audience?: string;
  subject: string;
  body: string;
  status?: string;
  scheduledAt?: string | null;
}) {
  return adminApi<{ id: string; name: string; status: string }>("/v1/admin/campaigns", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAdminCampaign(
  id: string,
  input: { status?: string; name?: string; subject?: string; body?: string },
) {
  return adminApi<{ id: string; status: string }>(`/v1/admin/campaigns/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function createAdminAdjustment(input: {
  placementId: string;
  type: "principal" | "rate" | "tenor" | "maturity";
  toValue: string;
  reason: string;
}) {
  return adminApi<{ id: string; status: string }>("/v1/admin/adjustments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function decideAdminAdjustment(
  id: string,
  input: { approve: boolean; note?: string },
) {
  return adminApi<{ id: string; status: string }>(`/v1/admin/adjustments/${id}/decide`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateAdminAmlAlert(
  id: string,
  input: { status?: string; note?: string; assignee?: string | null },
) {
  return adminApi<{ id: string; status: string }>(`/v1/admin/aml/alerts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function updateAdminReconRecord(
  id: string,
  input: { status?: string; note?: string },
) {
  return adminApi<{ id: string; status: string }>(`/v1/admin/recon/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export type AdminProductDetails = {
  about?: string;
  how?: string[];
  risks?: string[];
  documents?: { name: string; meta?: string; url?: string }[];
  faqs?: { q: string; a: string }[];
  highlights?: { label: string; value: string }[];
};

export async function fetchAdminProducts() {
  return adminApi<
    {
      id: string;
      slug: string;
      name: string;
      blurb: string;
      description?: string | null;
      ratePct: number;
      tenorDays: number;
      minimum: number;
      availability: string;
      issuer: string | null;
      category: { id: string; name: string };
      details?: AdminProductDetails | null;
    }[]
  >("/v1/admin/products");
}

export async function fetchAdminProductCategories() {
  return adminApi<{ id: string; slug: string; name: string }[]>("/v1/admin/products/categories");
}

export async function createAdminProduct(input: {
  name: string;
  categoryName?: string;
  categoryId?: string;
  blurb?: string;
  description?: string;
  ratePct: number;
  tenorDays: number;
  minimum: number;
  issuer?: string;
  availability?: "OPEN" | "CLOSING" | "CLOSED" | "COMING_SOON";
  details?: AdminProductDetails;
}) {
  return adminApi<{
    id: string;
    slug: string;
    name: string;
    ratePct: number;
    tenorDays: number;
    minimum: number;
    availability: string;
    details?: AdminProductDetails | null;
  }>("/v1/admin/products", { method: "POST", body: JSON.stringify(input) });
}

export async function updateAdminProduct(
  id: string,
  input: {
    name?: string;
    blurb?: string;
    description?: string;
    ratePct?: number;
    tenorDays?: number;
    minimum?: number;
    availability?: "OPEN" | "CLOSING" | "CLOSED" | "COMING_SOON";
    issuer?: string;
    details?: AdminProductDetails;
  },
) {
  return adminApi<{
    id: string;
    name: string;
    ratePct: number;
    tenorDays: number;
    minimum: number;
    availability: string;
    details?: AdminProductDetails | null;
  }>(`/v1/admin/products/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export async function fetchAdminFeed() {
  return adminApi<
    {
      id: string;
      title: string;
      body: string;
      kind: string;
      href: string | null;
      active: boolean;
      sortOrder: number;
    }[]
  >("/v1/admin/marketing/feed");
}

export async function fetchAdminTeam() {
  return adminApi<
    { id: string; email: string; name: string; role: string; active: boolean; createdAt: string }[]
  >("/v1/admin/team");
}

export async function fetchAdminJobs() {
  return adminApi<{ id: string; name: string; status: string; startedAt: string; finishedAt: string | null }[]>(
    "/v1/admin/jobs",
  );
}

export async function fetchAdminChatSessions() {
  return adminApi<
    {
      id: string;
      user: { id: string; name: string; email: string | null };
      createdAt: string;
      messageCount?: number;
      firstUserMessage?: string | null;
      lastMessage: string | null;
    }[]
  >("/v1/admin/chat/sessions");
}

export async function fetchAdminChatAnalytics() {
  return adminApi<{
    sessions30d: number;
    sessionsToday: number;
    activeUsers30d: number;
    messages30d: number;
    avgTurns: string;
    containment: string;
    handoffRate: string;
    flagged: number;
    avgResponse: string;
    volume: { day: string; resolved: number; handoff: number; abandoned: number }[];
    intentMix: { intent: string; sessions: number }[];
    topQuestions: { text: string; asked: number; resolvedPct: number }[];
    handoffs: { label: string; count: number }[];
  }>("/v1/admin/chat/analytics");
}

export async function fetchAdminReferralStats() {
  return adminApi<{
    invitesSent: number;
    invitesQualified: number;
    rewardsPaid: number;
    pendingApproval: number;
    totalUsers: number;
    leaders: {
      name: string;
      email: string | null;
      invites: number;
      qualified: number;
      rewarded: number;
    }[];
  }>("/v1/admin/referrals/stats");
}

export async function fetchAdminChatSession(id: string) {
  return adminApi<{
    id: string;
    user: { id: string; name: string; email: string | null };
    messages: { id: string; role: string; content: string; createdAt: string }[];
  }>(`/v1/admin/chat/sessions/${id}`);
}

export async function fetchAdminAmlAlerts() {
  return adminApi<
    {
      id: string;
      userId: string;
      name: string;
      type: string;
      status: string;
      raised: string;
      score: number;
      summary: string;
      matchedAgainst: string;
      analyst: string;
      notes?: { at: string; actor: string; text: string }[];
    }[]
  >("/v1/admin/aml/alerts");
}

export async function fetchAdminRecon() {
  return adminApi<
    {
      id: string;
      providerRef: string;
      internalRef: string;
      source: string;
      customer: string;
      providerAmount: number;
      ledgerAmount: number;
      date: string;
      status: string;
      channel: string;
      note?: string;
      owner?: string;
      timeline?: { label: string; at: string; by: string }[];
    }[]
  >("/v1/admin/recon");
}

export async function fetchAdminCampaigns() {
  return adminApi<
    {
      id: string;
      name: string;
      channel: string;
      status: string;
      audience: string;
      reach: number;
      title: string;
      content: string;
      cta: string;
      deepLink: string;
      sentAt?: string;
      scheduledFor?: string;
      delivered?: number;
      opened?: number;
      clicked?: number;
      createdBy: string;
    }[]
  >("/v1/admin/campaigns");
}

export async function fetchAdminAdjustments() {
  return adminApi<{
    requests: {
      id: string;
      investmentId: string;
      userName: string;
      product: string;
      reference: string;
      type: string;
      previous: string;
      proposed: string;
      reason: string;
      submittedBy: string;
      submittedAt: string;
      status: string;
      impact: string;
      decidedBy?: string;
      decidedAt?: string;
      decisionNote?: string;
    }[];
    investments: {
      id: string;
      userId: string;
      userName: string;
      userEmail: string;
      product: string;
      reference: string;
      principal: number;
      rate: number;
      tenorDays: number;
      startDate: string;
      maturityDate: string;
      payoutFrequency: string;
      status: string;
    }[];
  }>("/v1/admin/adjustments");
}

export async function fetchAdminNotifications() {
  return adminApi<
    {
      id: string;
      kind: string;
      title: string;
      body: string;
      time: string;
      day: "Today" | "Yesterday" | "Earlier";
      unread: boolean;
      priority: "high" | "normal";
      to?: string;
    }[]
  >("/v1/admin/notifications");
}

export async function fetchAdminMaturities() {
  return adminApi<
    {
      id: string;
      user: string;
      product: string;
      principal: number;
      expected: number;
      date: string;
      window: "week" | "month";
    }[]
  >("/v1/admin/dashboard/maturities");
}

export async function fetchAdminRecentActivity() {
  return adminApi<
    {
      id: string;
      kind: "kyc" | "payout" | "rate" | "content" | "decline";
      team: string;
      who: string;
      action: string;
      detail: string;
      at: string;
      amount?: number;
    }[]
  >("/v1/admin/dashboard/activity");
}

export async function fetchAdminTodayFlows() {
  return adminApi<{
    deposits: number;
    placements: number;
    interestCredits: number;
    withdrawals: number;
  }>("/v1/admin/dashboard/today-flows");
}

export async function fetchAdminPrincipalByTenor() {
  return adminApi<{ band: string; value: number; rate: string }[]>(
    "/v1/admin/dashboard/principal-by-tenor",
  );
}

export async function fetchAdminPrincipalByProduct() {
  return adminApi<{ product: string; value: number }[]>(
    "/v1/admin/dashboard/principal-by-product",
  );
}

/* ------------------------------------------------------------------ */
/* Analytics / settings / digest / reports                             */
/* ------------------------------------------------------------------ */

export type AnalyticsRange = "30 days" | "90 days" | "6 months" | "Year";

export type AdminAnalytics = {
  range: string;
  kpis: { label: string; value: string; delta: string; up: boolean }[];
  growthSeries: { month: string; signups: number; funded: number }[];
  netFlowSeries: { month: string; inflow: number; outflow: number; net: number }[];
  retentionSeries: { month: string; retention: number }[];
  productMix: { name: string; value: number }[];
  channelMix: { name: string; value: number }[];
};

export async function fetchAdminAnalytics(range: AnalyticsRange = "6 months") {
  return adminApi<AdminAnalytics>(
    `/v1/admin/analytics?range=${encodeURIComponent(range)}`,
  );
}

export type AdminFeeRow = { id: string; label: string; value: string; note: string };

export type AdminFeatureFlag = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  audience: string;
};

export type AdminSystemSettings = {
  fees: AdminFeeRow[];
  limits: AdminFeeRow[];
  cutoffs: AdminFeeRow[];
  flags: AdminFeatureFlag[];
  maintenance: { enabled: boolean; message: string };
};

export async function fetchAdminSettings() {
  return adminApi<AdminSystemSettings>("/v1/admin/settings");
}

export async function putAdminSettings(body: Partial<AdminSystemSettings>) {
  return adminApi<AdminSystemSettings>("/v1/admin/settings", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export type AdminDigestSettings = {
  enabled: boolean;
  sendTime: string;
  audience: string;
  lastRun: string | null;
  deliveredYesterday: number;
  openRate: number;
};

export async function fetchAdminDigest() {
  return adminApi<AdminDigestSettings>("/v1/admin/marketing/digest");
}

export async function putAdminDigest(body: {
  enabled: boolean;
  sendTime: string;
  audience: string;
}) {
  return adminApi<AdminDigestSettings>("/v1/admin/marketing/digest", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export type AdminReportPack = {
  id: string;
  name: string;
  category: string;
  description: string;
  formats: string[];
  cadence: string;
  owner: string;
  lastRun: string;
};

export type AdminReportSchedule = {
  id: string;
  pack: string;
  cadence: string;
  recipients: string;
  next: string;
  active: boolean;
};

export type AdminReportExport = {
  id: string;
  name: string;
  status: string;
  at: string;
  detail: unknown;
};

export type AdminReportsPayload = {
  packs: AdminReportPack[];
  schedules: AdminReportSchedule[];
  exports: AdminReportExport[];
  generatedToday: number;
};

export async function fetchAdminReports() {
  return adminApi<AdminReportsPayload>("/v1/admin/reports");
}

export async function runAdminReport(body: {
  packId: string;
  format: string;
  from?: string;
  to?: string;
}) {
  return adminApi<{
    id: string;
    packId: string;
    name: string;
    format: string;
    rowCount: number;
    status: string;
    message: string;
  }>("/v1/admin/reports/run", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function putAdminReportSchedules(schedules: AdminReportSchedule[]) {
  return adminApi<AdminReportSchedule[]>("/v1/admin/reports/schedules", {
    method: "PUT",
    body: JSON.stringify(schedules),
  });
}
