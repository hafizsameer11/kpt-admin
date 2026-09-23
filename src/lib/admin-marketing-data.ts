/**
 * Marketing console fixtures (ADM-100 – ADM-105).
 * Prototype-only data: campaigns, audiences, home feed cards and digest settings.
 */

export type CampaignChannel = "push" | "email";
export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent";

export type Campaign = {
  id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
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
};

export type FeedCardStatus = "published" | "draft" | "unpublished";

export type FeedCard = {
  id: string;
  title: string;
  description: string;
  image: string;
  cta: string;
  destination: string;
  status: FeedCardStatus;
  position: number;
  impressions: number;
  taps: number;
  updatedBy: string;
  updatedAt: string;
};

export type Segment = {
  id: string;
  name: string;
  description: string;
  size: number;
  tier: string;
  investmentStatus: string;
};

export const CHANNEL_LABEL: Record<CampaignChannel, string> = {
  push: "Push notification",
  email: "Email",
};

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  sending: "Sending",
  sent: "Sent",
};

export const CAMPAIGN_STATUS_TONE: Record<CampaignStatus, string> = {
  draft: "bg-muted text-muted-foreground ring-border",
  scheduled: "bg-brand/10 text-brand ring-brand/20",
  sending: "bg-gold/25 text-gold-foreground ring-gold/40",
  sent: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20",
};

export const FEED_STATUS_LABEL: Record<FeedCardStatus, string> = {
  published: "Published",
  draft: "Draft",
  unpublished: "Unpublished",
};

export const FEED_STATUS_TONE: Record<FeedCardStatus, string> = {
  published: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20",
  draft: "bg-muted text-muted-foreground ring-border",
  unpublished: "bg-gold/25 text-gold-foreground ring-gold/40",
};

export const CAMPAIGNS: Campaign[] = [];

export const SEGMENTS: Segment[] = [
  {
    id: "seg-all",
    name: "All customers",
    description: "Everyone with a Kipit account",
    size: 0,
    tier: "Any tier",
    investmentStatus: "Any",
  },
  {
    id: "seg-active",
    name: "Active investors",
    description: "At least one live plan",
    size: 0,
    tier: "Tier 1 and Tier 2",
    investmentStatus: "Active plan",
  },
  {
    id: "seg-idle",
    name: "Idle cash holders",
    description: "Wallet above ₦100,000 with no active plan",
    size: 0,
    tier: "Tier 1 and Tier 2",
    investmentStatus: "No active plan",
  },
  {
    id: "seg-tier0",
    name: "Unverified signups",
    description: "Tier 0 accounts that never funded",
    size: 0,
    tier: "Tier 0",
    investmentStatus: "Never invested",
  },
  {
    id: "seg-maturing",
    name: "Maturing in 7 days",
    description: "Plans reaching maturity within a week",
    size: 0,
    tier: "Tier 1 and Tier 2",
    investmentStatus: "Maturing soon",
  },
];

export const FEED_CARDS: FeedCard[] = [];

export type DigestDefaults = {
  enabled: boolean;
  sendTime: string;
  audience: string;
  lastRun: string;
  deliveredYesterday: number;
  openRate: number;
};

export let DIGEST_DEFAULTS: DigestDefaults = {
  enabled: false,
  sendTime: "07:30",
  audience: "seg-active",
  lastRun: "—",
  deliveredYesterday: 0,
  openRate: 0,
};

export async function hydrateAdminDigestFromApi() {
  try {
    const { getAdminAccessToken, fetchAdminDigest } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      DIGEST_DEFAULTS = {
        enabled: false,
        sendTime: "07:30",
        audience: "seg-active",
        lastRun: "—",
        deliveredYesterday: 0,
        openRate: 0,
      };
      return DIGEST_DEFAULTS;
    }
    const data = await fetchAdminDigest();
    DIGEST_DEFAULTS = {
      enabled: data.enabled,
      sendTime: data.sendTime,
      audience: data.audience,
      lastRun: data.lastRun ?? "—",
      deliveredYesterday: data.deliveredYesterday,
      openRate: data.openRate,
    };
    return DIGEST_DEFAULTS;
  } catch {
    DIGEST_DEFAULTS = {
      enabled: false,
      sendTime: "07:30",
      audience: "seg-active",
      lastRun: "—",
      deliveredYesterday: 0,
      openRate: 0,
    };
    return DIGEST_DEFAULTS;
  }
}

let liveCampaigns: Campaign[] = [];

export function setLiveCampaigns(rows: Campaign[]) {
  liveCampaigns = rows;
  CAMPAIGNS.length = 0;
  CAMPAIGNS.push(...rows);
}

export function getLiveCampaigns() {
  return liveCampaigns;
}

export function findCampaign(id: string) {
  return liveCampaigns.find((c) => c.id === id) ?? CAMPAIGNS.find((c) => c.id === id);
}

export function findFeedCard(id: string) {
  return liveFeedCards.find((c) => c.id === id);
}

let liveFeedCards: FeedCard[] = [];

export function setLiveFeedCards(cards: FeedCard[]) {
  liveFeedCards = cards;
}

export function getLiveFeedCards() {
  return liveFeedCards;
}

export async function hydrateAdminFeedFromApi() {
  try {
    const { getAdminAccessToken } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      liveFeedCards = [];
      return [];
    }
    const { loadAdminFeedCards } = await import("./admin-mappers");
    liveFeedCards = await loadAdminFeedCards();
    return liveFeedCards;
  } catch {
    liveFeedCards = [];
    return [];
  }
}

export async function hydrateAdminCampaignsFromApi() {
  try {
    const { getAdminAccessToken, fetchAdminCampaigns } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      setLiveCampaigns([]);
      return [];
    }
    const rows = await fetchAdminCampaigns();
    const mapped: Campaign[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      channel: (r.channel === "email" ? "email" : "push") as Campaign["channel"],
      status: (["draft", "scheduled", "sending", "sent"].includes(r.status)
        ? r.status
        : "draft") as Campaign["status"],
      audience: r.audience,
      reach: r.reach,
      title: r.title,
      content: r.content,
      cta: r.cta,
      deepLink: r.deepLink,
      createdBy: r.createdBy,
      ...(r.sentAt ? { sentAt: r.sentAt } : {}),
      ...(r.scheduledFor ? { scheduledFor: r.scheduledFor } : {}),
      ...(r.delivered !== undefined ? { delivered: r.delivered } : {}),
      ...(r.opened !== undefined ? { opened: r.opened } : {}),
      ...(r.clicked !== undefined ? { clicked: r.clicked } : {}),
    }));
    setLiveCampaigns(mapped);
    return mapped;
  } catch {
    setLiveCampaigns([]);
    return [];
  }
}

/** ADM-100 — referral programme rules (maker-checker configurable). */
export type ReferralRule = {
  id: string;
  label: string;
  helper: string;
  value: string;
  kind: "amount" | "days" | "count" | "text";
};

export const REFERRAL_RULES: ReferralRule[] = [
  { id: "rr-inviter", label: "Inviter reward", helper: "Paid to the existing customer once the invite qualifies", value: "5000", kind: "amount" },
  { id: "rr-invitee", label: "Invitee reward", helper: "Welcome bonus credited to the new customer", value: "2500", kind: "amount" },
  { id: "rr-min", label: "Qualifying funding", helper: "Minimum first deposit before a reward is released", value: "50000", kind: "amount" },
  { id: "rr-hold", label: "Hold period", helper: "Days the qualifying funds must stay invested", value: "30", kind: "days" },
  { id: "rr-expiry", label: "Invite expiry", helper: "Days before an unused invite lapses", value: "30", kind: "days" },
  { id: "rr-cap", label: "Monthly cap per customer", helper: "Maximum rewarded referrals per inviter each month", value: "10", kind: "count" },
];

export const REFERRAL_PROGRAMME = {
  enabled: true,
  requiresKyc: true,
  payoutDestination: "Kipit wallet",
  updatedBy: "—",
  updatedAt: "—",
  invitesSent: 0,
  invitesQualified: 0,
  rewardsPaid: 0,
  pendingApproval: 0,
};

export let REFERRAL_LEADERS: {
  name: string;
  invites: number;
  qualified: number;
  rewarded: number;
}[] = [];

export const REFERRAL_CHANGE_LOG: { at: string; by: string; change: string; status: string }[] = [];

export async function hydrateAdminReferralsFromApi() {
  try {
    const { getAdminAccessToken, fetchAdminReferralStats } = await import("./admin-api");
    if (!getAdminAccessToken()) return REFERRAL_PROGRAMME;
    const data = await fetchAdminReferralStats();
    REFERRAL_PROGRAMME.invitesSent = data.invitesSent;
    REFERRAL_PROGRAMME.invitesQualified = data.invitesQualified;
    REFERRAL_PROGRAMME.rewardsPaid = data.rewardsPaid;
    REFERRAL_PROGRAMME.pendingApproval = data.pendingApproval;
    REFERRAL_LEADERS = data.leaders.map((l) => ({
      name: l.name,
      invites: l.invites,
      qualified: l.qualified,
      rewarded: l.rewarded,
    }));
    return { ...REFERRAL_PROGRAMME };
  } catch {
    return { ...REFERRAL_PROGRAMME };
  }
}
