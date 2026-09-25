/** Support desk fixtures for the admin console (ADM-110 / ADM-111). */

export type TicketStatus = "open" | "pending" | "resolved" | "closed";
export type TicketPriority = "urgent" | "high" | "normal" | "low";
export type TicketCategory =
  | "withdrawal"
  | "kyc"
  | "deposit"
  | "investment"
  | "account"
  | "general";

export type TicketMessage = {
  id: string;
  author: string;
  role: "customer" | "agent" | "system";
  at: string;
  body: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
};

export type TicketEvent = { at: string; label: string; by: string };

export type TicketTransaction = {
  id: string;
  label: string;
  amount: number;
  at: string;
  status: string;
};

export type SupportTicket = {
  id: string;
  ref: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  channel: "In-app chat" | "Email" | "Phone";
  assignee: string;
  firstResponse: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    tier: 0 | 1 | 2;
    joined: string;
    walletBalance: number;
    invested: number;
    lifetimeInterest: number;
  };
  messages: TicketMessage[];
  transactions: TicketTransaction[];
  history: TicketEvent[];
};

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Open",
  pending: "Awaiting customer",
  resolved: "Resolved",
  closed: "Closed",
};

export const TICKET_STATUS_TONE: Record<TicketStatus, string> = {
  open: "bg-brand/10 text-brand ring-brand/20",
  pending: "bg-gold/20 text-gold-foreground ring-gold/40",
  resolved: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20",
  closed: "bg-muted text-muted-foreground ring-border",
};

export const PRIORITY_TONE: Record<TicketPriority, string> = {
  urgent: "bg-destructive/10 text-destructive ring-destructive/20",
  high: "bg-gold/20 text-gold-foreground ring-gold/40",
  normal: "bg-brand/8 text-brand ring-brand/20",
  low: "bg-muted text-muted-foreground ring-border",
};

export const CATEGORY_LABEL: Record<TicketCategory, string> = {
  withdrawal: "Withdrawal",
  kyc: "KYC & verification",
  deposit: "Deposit / funding",
  investment: "Investment",
  account: "Account & security",
  general: "General enquiry",
};

export const SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: "t1",
    ref: "KPT-8841",
    subject: "Withdrawal has not landed in my GTBank account",
    category: "withdrawal",
    priority: "urgent",
    status: "open",
    createdAt: "4 Sep 2026, 08:12",
    updatedAt: "12 min ago",
    channel: "In-app chat",
    assignee: "Tolu A.",
    firstResponse: "6 min",
    user: {
      id: "u1",
      name: "Amara Nwosu",
      email: "amara.nwosu@gmail.com",
      phone: "+234 803 442 1180",
      tier: 2,
      joined: "12 Feb 2026",
      walletBalance: 148_500,
      invested: 4_250_000,
      lifetimeInterest: 386_400,
    },
    messages: [
      {
        id: "m1",
        author: "Amara Nwosu",
        role: "customer",
        at: "08:12",
        body: "I requested ₦250,000 yesterday evening and the app says successful, but nothing has hit my GTBank account.",
      },
      {
        id: "m2",
        author: "System",
        role: "system",
        at: "08:12",
        body: "Ticket created and routed to Payments queue · priority set to Urgent.",
      },
      {
        id: "m3",
        author: "Tolu A.",
        role: "agent",
        at: "08:18",
        body: "Thanks Amara. I can see the payout was released at 19:42 with reference WD-99213. Bank settlement can take up to 24 hours on late-night transfers. I am raising a trace with the settlement bank now.",
      },
      {
        id: "m4",
        author: "Amara Nwosu",
        role: "customer",
        at: "08:40",
        body: "Please treat urgently, I need the funds today.",
      },
    ],
    transactions: [
      { id: "WD-99213", label: "Withdrawal to GTBank ****4471", amount: -250_000, at: "3 Sep, 19:42", status: "Sent to bank" },
      { id: "IN-77120", label: "Interest payout · Fixed 90 days", amount: 41_250, at: "1 Sep, 00:05", status: "Paid" },
    ],
    history: [
      { at: "4 Sep, 08:12", label: "Ticket created from in-app chat", by: "Amara Nwosu" },
      { at: "4 Sep, 08:14", label: "Assigned to Payments queue", by: "Auto-routing" },
      { at: "4 Sep, 08:18", label: "First response sent", by: "Tolu A." },
      { at: "4 Sep, 08:31", label: "Settlement trace raised with bank", by: "Tolu A." },
    ],
  },
  {
    id: "t2",
    ref: "KPT-8836",
    subject: "BVN verification keeps failing on Tier 1",
    category: "kyc",
    priority: "high",
    status: "pending",
    createdAt: "3 Sep 2026, 16:04",
    updatedAt: "2 hours ago",
    channel: "Email",
    assignee: "Ngozi E.",
    firstResponse: "22 min",
    user: {
      id: "u4",
      name: "Chidi Okafor",
      email: "chidi.okafor@outlook.com",
      phone: "+234 810 229 7741",
      tier: 0,
      joined: "28 Aug 2026",
      walletBalance: 0,
      invested: 0,
      lifetimeInterest: 0,
    },
    messages: [
      {
        id: "m1",
        author: "Chidi Okafor",
        role: "customer",
        at: "16:04",
        body: "Every time I enter my BVN it says details do not match. My phone number on the BVN is an old MTN line.",
      },
      {
        id: "m2",
        author: "Ngozi E.",
        role: "agent",
        at: "16:26",
        body: "Thanks Chidi. The check compares the phone number on your BVN record. Could you share a photo of your ID so we can verify manually?",
      },
    ],
    transactions: [],
    history: [
      { at: "3 Sep, 16:04", label: "Ticket created from email", by: "Chidi Okafor" },
      { at: "3 Sep, 16:26", label: "First response sent", by: "Ngozi E." },
      { at: "3 Sep, 16:27", label: "Status set to awaiting customer", by: "Ngozi E." },
    ],
  },
  {
    id: "t3",
    ref: "KPT-8829",
    subject: "Card funding debited twice",
    category: "deposit",
    priority: "high",
    status: "open",
    createdAt: "3 Sep 2026, 11:47",
    updatedAt: "5 hours ago",
    channel: "In-app chat",
    assignee: "Unassigned",
    firstResponse: "—",
    user: {
      id: "u2",
      name: "Bola Adeyemi",
      email: "bola.adeyemi@yahoo.com",
      phone: "+234 706 118 5520",
      tier: 2,
      joined: "3 Mar 2026",
      walletBalance: 62_000,
      invested: 1_180_000,
      lifetimeInterest: 94_300,
    },
    messages: [
      {
        id: "m1",
        author: "Bola Adeyemi",
        role: "customer",
        at: "11:47",
        body: "I funded ₦100,000 with my card and my bank sent two debit alerts but only one shows in Kipit.",
      },
    ],
    transactions: [
      { id: "DP-55190", label: "Card funding · Access ****2210", amount: 100_000, at: "3 Sep, 11:44", status: "Successful" },
      { id: "DP-55191", label: "Card funding · Access ****2210", amount: 100_000, at: "3 Sep, 11:45", status: "Reversed by provider" },
    ],
    history: [
      { at: "3 Sep, 11:47", label: "Ticket created from in-app chat", by: "Bola Adeyemi" },
      { at: "3 Sep, 11:50", label: "Linked to reconciliation exception REC-2214", by: "Auto-routing" },
    ],
  },
  {
    id: "t4",
    ref: "KPT-8815",
    subject: "Can I break my 180-day plan early?",
    category: "investment",
    priority: "normal",
    status: "resolved",
    createdAt: "2 Sep 2026, 09:22",
    updatedAt: "Yesterday",
    channel: "In-app chat",
    assignee: "Tolu A.",
    firstResponse: "9 min",
    user: {
      id: "u3",
      name: "Ifeoma Chukwu",
      email: "ifeoma.chukwu@gmail.com",
      phone: "+234 802 771 0093",
      tier: 2,
      joined: "19 Jan 2026",
      walletBalance: 310_400,
      invested: 7_600_000,
      lifetimeInterest: 612_900,
    },
    messages: [
      {
        id: "m1",
        author: "Ifeoma Chukwu",
        role: "customer",
        at: "09:22",
        body: "I have a 180-day plan maturing in November. Can I liquidate early and what do I lose?",
      },
      {
        id: "m2",
        author: "Tolu A.",
        role: "agent",
        at: "09:31",
        body: "Yes — early liquidation is allowed. You keep your principal and earn the Call Account rate for the days held instead of the fixed rate. Settlement is same day into your wallet.",
      },
      {
        id: "m3",
        author: "Ifeoma Chukwu",
        role: "customer",
        at: "09:45",
        body: "Understood, I will leave it to maturity. Thank you.",
      },
    ],
    transactions: [
      { id: "FX-31088", label: "Fixed plan · 180 days @ 21.5%", amount: 3_000_000, at: "14 May, 10:02", status: "Active" },
    ],
    history: [
      { at: "2 Sep, 09:22", label: "Ticket created from in-app chat", by: "Ifeoma Chukwu" },
      { at: "2 Sep, 09:31", label: "First response sent", by: "Tolu A." },
      { at: "2 Sep, 10:05", label: "Marked resolved", by: "Tolu A." },
    ],
  },
  {
    id: "t5",
    ref: "KPT-8802",
    subject: "Change the phone number on my account",
    category: "account",
    priority: "low",
    status: "closed",
    createdAt: "1 Sep 2026, 14:35",
    updatedAt: "2 days ago",
    channel: "Phone",
    assignee: "Ngozi E.",
    firstResponse: "3 min",
    user: {
      id: "u5",
      name: "Emeka Obi",
      email: "emeka.obi@gmail.com",
      phone: "+234 815 990 4412",
      tier: 1,
      joined: "7 Jun 2026",
      walletBalance: 18_250,
      invested: 450_000,
      lifetimeInterest: 21_700,
    },
    messages: [
      {
        id: "m1",
        author: "Emeka Obi",
        role: "customer",
        at: "14:35",
        body: "I changed networks and want my Kipit number updated.",
      },
      {
        id: "m2",
        author: "Ngozi E.",
        role: "agent",
        at: "14:38",
        body: "Done — we verified you on the call and sent an OTP to the new line. Security alert emailed to you.",
      },
    ],
    transactions: [],
    history: [
      { at: "1 Sep, 14:35", label: "Ticket created from phone call", by: "Ngozi E." },
      { at: "1 Sep, 14:38", label: "Phone number updated", by: "Ngozi E." },
      { at: "2 Sep, 09:00", label: "Ticket closed", by: "Ngozi E." },
    ],
  },
  {
    id: "t6",
    ref: "KPT-8796",
    subject: "Explore product subscription stuck on processing",
    category: "investment",
    priority: "high",
    status: "open",
    createdAt: "1 Sep 2026, 10:10",
    updatedAt: "1 day ago",
    channel: "Email",
    assignee: "Tolu A.",
    firstResponse: "31 min",
    user: {
      id: "u6",
      name: "Zainab Bello",
      email: "zainab.bello@gmail.com",
      phone: "+234 809 663 2287",
      tier: 2,
      joined: "22 Apr 2026",
      walletBalance: 940_000,
      invested: 2_100_000,
      lifetimeInterest: 158_200,
    },
    messages: [
      {
        id: "m1",
        author: "Zainab Bello",
        role: "customer",
        at: "10:10",
        body: "My ₦1,000,000 subscription to the commercial paper has said processing since yesterday.",
      },
      {
        id: "m2",
        author: "Tolu A.",
        role: "agent",
        at: "10:41",
        body: "The issuer allotment confirms at close of business today. Your funds are ringfenced and you will get a confirmation the moment allotment lands.",
      },
    ],
    transactions: [
      { id: "EX-14002", label: "Explore subscription · Commercial paper", amount: 1_000_000, at: "31 Aug, 15:20", status: "Processing" },
    ],
    history: [
      { at: "1 Sep, 10:10", label: "Ticket created from email", by: "Zainab Bello" },
      { at: "1 Sep, 10:41", label: "First response sent", by: "Tolu A." },
    ],
  },
];

export const SUPPORT_TOTALS = {
  open: SUPPORT_TICKETS.filter((t) => t.status === "open").length,
  pending: SUPPORT_TICKETS.filter((t) => t.status === "pending").length,
  urgent: SUPPORT_TICKETS.filter((t) => t.priority === "urgent").length,
  resolvedToday: 7,
  avgFirstResponse: "14 min",
  csat: "4.7 / 5",
};

let liveSupportTickets: SupportTicket[] = [];

export function setLiveSupportTickets(tickets: SupportTicket[]) {
  liveSupportTickets = tickets;
}

export function getLiveSupportTickets() {
  return liveSupportTickets;
}

export function ticketById(id: string) {
  return liveSupportTickets.find((t) => t.id === id || t.ref === id);
}

export async function hydrateAdminSupportFromApi() {
  try {
    const { getAdminAccessToken } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      liveSupportTickets = [];
      return [];
    }
    const { loadAdminSupportTickets } = await import("./admin-mappers");
    liveSupportTickets = await loadAdminSupportTickets();
    return liveSupportTickets;
  } catch {
    liveSupportTickets = [];
    return [];
  }
}
