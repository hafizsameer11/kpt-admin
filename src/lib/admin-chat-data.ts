/** Fixtures for the admin "Ask AI" usage & history console. */

export type ChatIntent =
  | "balance"
  | "product"
  | "explain"
  | "maturity"
  | "transaction"
  | "funding"
  | "unsupported";

export type ChatOutcome = "resolved" | "handoff" | "abandoned" | "escalated";

export const INTENT_LABEL: Record<ChatIntent, string> = {
  balance: "Balance & portfolio",
  product: "Product discovery",
  explain: "Explainers",
  maturity: "Maturity & payouts",
  transaction: "Transaction status",
  funding: "Funding help",
  unsupported: "Unsupported request",
};

export const OUTCOME_LABEL: Record<ChatOutcome, string> = {
  resolved: "Resolved in chat",
  handoff: "Handed off to journey",
  abandoned: "Abandoned",
  escalated: "Escalated to support",
};

export const OUTCOME_TONE: Record<ChatOutcome, string> = {
  resolved: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20",
  handoff: "bg-brand/10 text-brand ring-brand/20",
  abandoned: "bg-muted text-muted-foreground ring-border",
  escalated: "bg-destructive/10 text-destructive ring-destructive/20",
};

export type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: string;
  intent?: ChatIntent;
  card?: string;
  flagged?: boolean;
};

export type ChatSession = {
  id: string;
  ref: string;
  user: { id: string; name: string; email: string };
  device: "Mobile app" | "Desktop web";
  startedAt: string;
  /** ISO date for chart bucketing */
  startedDate?: string;
  duration: string;
  turns: number;
  topIntent: ChatIntent;
  outcome: ChatOutcome;
  handoffTo?: string;
  satisfaction?: "positive" | "negative";
  flagged: boolean;
  transcript: ChatTurn[];
};

export type ChatTotals = {
  sessions30d: number;
  sessionsToday: number;
  activeUsers30d: number;
  messages30d: number;
  avgTurns: string;
  containment: string;
  handoffRate: string;
  flagged: number;
  avgResponse: string;
};

export let CHAT_TOTALS: ChatTotals = {
  sessions30d: 0,
  sessionsToday: 0,
  activeUsers30d: 0,
  messages30d: 0,
  avgTurns: "0",
  containment: "0%",
  handoffRate: "0%",
  flagged: 0,
  avgResponse: "—",
};

/** Sessions per day, split by outcome — last 14 days (live). */
export let CHAT_VOLUME: { day: string; resolved: number; handoff: number; abandoned: number }[] = [];

export let INTENT_MIX: { intent: ChatIntent; sessions: number }[] = [
  { intent: "balance", sessions: 0 },
  { intent: "product", sessions: 0 },
  { intent: "explain", sessions: 0 },
  { intent: "maturity", sessions: 0 },
  { intent: "transaction", sessions: 0 },
  { intent: "funding", sessions: 0 },
  { intent: "unsupported", sessions: 0 },
];

export let TOP_QUESTIONS: { text: string; asked: number; resolvedPct: number }[] = [];

export let HANDOFF_DESTINATIONS: { label: string; count: number }[] = [];

/** @deprecated empty — list hydrates from API */
export const CHAT_SESSIONS: ChatSession[] = [];

let liveChatSessions: ChatSession[] = [];

export function setLiveChatSessions(sessions: ChatSession[]) {
  liveChatSessions = sessions;
}

export function getLiveChatSessions() {
  return liveChatSessions;
}

export function sessionById(id: string) {
  return liveChatSessions.find((s) => s.id === id);
}

export async function hydrateAdminChatFromApi() {
  try {
    const { getAdminAccessToken } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      liveChatSessions = [];
      return [];
    }
    const { loadAdminChatSessions } = await import("./admin-mappers");
    liveChatSessions = await loadAdminChatSessions();
    return liveChatSessions;
  } catch {
    liveChatSessions = [];
    return [];
  }
}

export async function hydrateAdminChatAnalyticsFromApi() {
  try {
    const { getAdminAccessToken, fetchAdminChatAnalytics } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      CHAT_TOTALS = {
        sessions30d: 0,
        sessionsToday: 0,
        activeUsers30d: 0,
        messages30d: 0,
        avgTurns: "0",
        containment: "0%",
        handoffRate: "0%",
        flagged: 0,
        avgResponse: "—",
      };
      CHAT_VOLUME = [];
      INTENT_MIX = INTENT_MIX.map((i) => ({ ...i, sessions: 0 }));
      TOP_QUESTIONS = [];
      HANDOFF_DESTINATIONS = [];
      return null;
    }
    const data = await fetchAdminChatAnalytics();
    CHAT_TOTALS = {
      sessions30d: data.sessions30d,
      sessionsToday: data.sessionsToday,
      activeUsers30d: data.activeUsers30d,
      messages30d: data.messages30d,
      avgTurns: data.avgTurns,
      containment: data.containment,
      handoffRate: data.handoffRate,
      flagged: data.flagged,
      avgResponse: data.avgResponse,
    };
    CHAT_VOLUME = data.volume;
    INTENT_MIX = data.intentMix.map((i) => ({
      intent: (i.intent as ChatIntent) || "unsupported",
      sessions: i.sessions,
    }));
    TOP_QUESTIONS = data.topQuestions;
    HANDOFF_DESTINATIONS = data.handoffs;
    return data;
  } catch {
    return null;
  }
}

export async function hydrateAdminChatSessionFromApi(id: string) {
  try {
    const { getAdminAccessToken } = await import("./admin-api");
    if (!getAdminAccessToken()) return null;
    const { loadAdminChatSession } = await import("./admin-mappers");
    const session = await loadAdminChatSession(id);
    if (session) {
      const idx = liveChatSessions.findIndex((s) => s.id === id);
      if (idx >= 0) liveChatSessions[idx] = session;
      else liveChatSessions = [session, ...liveChatSessions];
    }
    return session;
  } catch {
    return null;
  }
}
