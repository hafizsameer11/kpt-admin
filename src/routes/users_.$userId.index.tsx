import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  ChevronRight,
  Clock,
  CreditCard,
  History,
  LifeBuoy,
  Lock,
  Percent,
  PiggyBank,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { Panel } from "@/components/kipit/AdminBits";
import { naira } from "@/lib/admin-data";
import {
  findUser,
  hydrateAdminUserFromApi,
  portfolioValue,
  type AdminInvestment,
  type AdminSession,
  type AdminTicket,
  type AdminTxn,
  type AdminAudit,
} from "@/lib/admin-users-data";
import {
  loadAdminAuditLog,
  loadAdminSupportTickets,
  loadAdminUserPlacements,
  loadAdminUserSessions,
  loadAdminUserTransactions,
  mapUserAuditEntry,
  mapUserSupportTicket,
} from "@/lib/admin-mappers";

export const Route = createFileRoute("/users_/$userId/")({
  component: Overview,
});

const TXN_ICON = {
  deposit: ArrowDownLeft,
  placement: PiggyBank,
  interest: Percent,
  withdrawal: ArrowUpRight,
  maturity: Banknote,
} as const;

const TXN_TONE: Record<AdminTxn["type"], string> = {
  deposit: "bg-emerald-500/12 text-emerald-700",
  placement: "bg-brand/10 text-brand",
  interest: "bg-gold/20 text-gold-foreground",
  withdrawal: "bg-destructive/10 text-destructive",
  maturity: "bg-brand/10 text-brand",
};

const STATUS_TEXT: Record<AdminTxn["status"], string> = {
  successful: "text-emerald-700",
  processing: "text-gold-foreground",
  failed: "text-destructive",
  declined: "text-destructive",
};

function Overview() {
  const { userId } = Route.useParams();
  const [user, setUser] = useState(findUser(userId));
  const [txns, setTxns] = useState<AdminTxn[]>([]);
  const [investments, setInvestments] = useState<AdminInvestment[]>([]);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [audit, setAudit] = useState<AdminAudit[]>([]);

  useEffect(() => {
    void hydrateAdminUserFromApi(userId).then((u) => {
      if (u) setUser(u);
    });
    void loadAdminUserTransactions(userId).then(setTxns);
    void loadAdminUserPlacements(userId).then(setInvestments);
    void loadAdminUserSessions(userId).then(setSessions);
    void loadAdminSupportTickets().then((all) =>
      setTickets(all.filter((t) => t.user.id === userId).map(mapUserSupportTicket)),
    );
    void loadAdminAuditLog().then((entries) =>
      setAudit(
        entries
          .filter((e) => e.target === userId || e.action.includes(userId))
          .map((e) => mapUserAuditEntry(e, userId)),
      ),
    );
  }, [userId]);

  if (!user) {
    return <p className="text-[13px] text-muted-foreground">Loading profile…</p>;
  }

  const kycChecks: { state: "passed" | "pending" | "failed" }[] = [];

  const total = portfolioValue(user);
  const pools = [
    { key: "wallet", label: "Wallet", value: user.wallet, color: "var(--gold)", icon: Wallet, helper: "Uninvested cash" },
    { key: "call", label: "Call Account", value: user.call, color: "#4C7DF0", icon: CreditCard, helper: "Daily accrual" },
    { key: "fixed", label: "Fixed", value: user.fixed, color: "#0B1D3A", icon: Lock, helper: "Locked principal" },
    { key: "explore", label: "Explore", value: user.explore, color: "#6FA8FF", icon: TrendingUp, helper: "Marketplace" },
  ];

  const activeInvestments = investments.filter((i) => i.state === "active");
  const expected = activeInvestments.reduce((s, i) => s + i.expected, 0);
  const passedChecks = kycChecks.filter((c) => c.state === "passed").length;
  const kycPct = kycChecks.length ? Math.round((passedChecks / kycChecks.length) * 100) : 0;
  const activeSessions = sessions.filter((s) => s.status === "active");
  const openTickets = tickets.filter((t) => t.status !== "resolved");

  const inflow = txns
    .filter((t) => t.type === "deposit" && t.status === "successful")
    .reduce((s, t) => s + t.amount, 0);
  const outflow = txns
    .filter((t) => t.type === "withdrawal" && t.status === "successful")
    .reduce((s, t) => s + t.amount, 0);

  const nextMaturity = [...activeInvestments].sort((a, b) =>
    a.maturity.localeCompare(b.maturity),
  )[0];

  return (
    <div className="space-y-5">
      {user.freeze ? (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/8 p-5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-destructive/12 text-destructive">
            <AlertTriangle className="size-4.5" strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-extrabold text-destructive">Account frozen</p>
            <p className="mt-1 text-[13px] text-foreground/80">{user.freeze.reason}</p>
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              Frozen {user.freeze.date} by {user.freeze.by}
            </p>
          </div>
        </div>
      ) : null}

      {/* Allocation hero */}
      <section className="relative overflow-hidden rounded-2xl border border-transparent bg-brand-gradient p-6 text-primary-foreground shadow-[0_20px_50px_-30px_rgba(11,29,58,0.9)]">
        <span className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-gold/20 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-white/8 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[minmax(260px,auto)_minmax(0,1fr)] lg:items-center">
          <div className="flex items-center gap-5">
            <div className="relative size-[132px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pools.filter((p) => p.value > 0)}
                    dataKey="value"
                    innerRadius={46}
                    outerRadius={64}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {pools
                      .filter((p) => p.value > 0)
                      .map((p) => (
                        <Cell key={p.key} fill={p.color} />
                      ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-primary-foreground/60">
                    Pools
                  </p>
                  <p className="font-display text-[19px] font-extrabold">
                    {pools.filter((p) => p.value > 0).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-primary-foreground/60">
                Portfolio total
              </p>
              <p className="mt-1 whitespace-nowrap font-display text-[26px] font-extrabold tracking-[-0.03em]">
                {naira(total)}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {pools.map((p) => {
              const share = total ? Math.round((p.value / total) * 100) : 0;
              return (
                <div
                  key={p.key}
                  className="rounded-xl bg-white/8 p-3.5 ring-1 ring-white/12 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary-foreground/70">
                      {p.label}
                    </p>
                  </div>
                  <p className="mt-1.5 font-display text-[18px] font-extrabold tracking-[-0.02em]">
                    {naira(p.value)}
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/15">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${share}%`, backgroundColor: p.color }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-primary-foreground/60">
                    {share}% · {p.helper}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Signal strip */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SignalCard
          icon={ArrowDownLeft}
          label="Lifetime deposits"
          value={naira(inflow)}
          helper={`${txns.filter((t) => t.type === "deposit").length} deposits on record`}
          tone="emerald"
        />
        <SignalCard
          icon={ArrowUpRight}
          label="Lifetime withdrawals"
          value={naira(outflow)}
          helper={`${txns.filter((t) => t.type === "withdrawal").length} payouts processed`}
          tone="rose"
        />
        <SignalCard
          icon={TrendingUp}
          label="Expected at maturity"
          value={naira(expected)}
          helper={`${activeInvestments.length} active placements`}
          tone="brand"
        />
        <SignalCard
          icon={Clock}
          label="Next maturity"
          value={nextMaturity ? nextMaturity.maturity : "—"}
          helper={nextMaturity ? nextMaturity.product : "No active placement"}
          tone="gold"
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* Activity feed */}
        <Panel
          title="Recent activity"
          eyebrow="Money movement"
          icon={History}
          action={
            <Link
              to="/users/$userId/transactions"
              params={{ userId }}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12.5px] font-bold text-brand transition hover:bg-brand/8"
            >
              View all <ChevronRight className="size-3.5" />
            </Link>
          }
        >
          <ul className="relative space-y-1">
            <span className="pointer-events-none absolute bottom-4 left-[18px] top-4 w-px bg-border" />
            {txns.slice(0, 5).map((t) => {
              const Icon = TXN_ICON[t.type];
              const negative = t.type === "withdrawal";
              return (
                <li
                  key={t.id}
                  className="relative flex items-center gap-3.5 rounded-xl px-2 py-2.5 transition hover:bg-muted/50"
                >
                  <span
                    className={`relative z-10 grid size-9 shrink-0 place-items-center rounded-full ring-4 ring-card ${TXN_TONE[t.type]}`}
                  >
                    <Icon className="size-4" strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold">{t.label}</p>
                    <p className="text-[11.5px] text-muted-foreground">
                      {t.ref} · {t.channel} · {t.at}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={`font-display text-[14px] font-extrabold tracking-[-0.02em] ${
                        negative ? "text-destructive" : "text-foreground"
                      }`}
                    >
                      {negative ? "−" : "+"}
                      {naira(t.amount)}
                    </p>
                    <p className={`text-[11px] font-bold capitalize ${STATUS_TEXT[t.status]}`}>
                      {t.status}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <div className="space-y-5">
          {/* KYC progress */}
          <Panel
            title="Verification"
            eyebrow={`Tier ${user.tier}`}
            icon={ShieldCheck}
            action={
              <Link
                to="/users/$userId/kyc"
                params={{ userId }}
                className="rounded-lg px-2 py-1 text-[12.5px] font-bold text-brand transition hover:bg-brand/8"
              >
                Open
              </Link>
            }
          >
            <div className="flex items-center gap-4">
              <div className="relative grid size-16 shrink-0 place-items-center">
                <svg viewBox="0 0 36 36" className="size-16 -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    strokeWidth="4"
                    className="stroke-muted"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="stroke-brand"
                    strokeDasharray={`${(kycPct / 100) * 97.4} 97.4`}
                  />
                </svg>
                <span className="absolute font-display text-[13px] font-extrabold">{kycPct}%</span>
              </div>
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold">
                  {kycChecks.length
                    ? `${passedChecks} of ${kycChecks.length} checks passed`
                    : "No verification detail from API"}
                </p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Submitted — · reviewer —
                </p>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5">
              {kycChecks.slice(0, 4).map((c) => (
                <li key={c.state} className="flex items-center justify-between gap-3 text-[12.5px]">
                  <span className="truncate text-muted-foreground">—</span>
                  <span className="shrink-0 font-bold capitalize text-muted-foreground">{c.state}</span>
                </li>
              ))}
              {kycChecks.length === 0 ? (
                <li className="text-[12.5px] text-muted-foreground">—</li>
              ) : null}
            </ul>
          </Panel>

          {/* Jump-offs */}
          <Panel title="At a glance" eyebrow="Account health" icon={LifeBuoy}>
            <ul className="space-y-2">
              <GlanceRow
                to="/users/$userId/investments"
                userId={userId}
                icon={PiggyBank}
                label="Active investments"
                value={`${activeInvestments.length}`}
              />
              <GlanceRow
                to="/users/$userId/sessions"
                userId={userId}
                icon={Smartphone}
                label="Active sessions"
                value={`${activeSessions.length}`}
                helper={activeSessions[0]?.location}
              />
              <GlanceRow
                to="/users/$userId/support"
                userId={userId}
                icon={LifeBuoy}
                label="Open tickets"
                value={`${openTickets.length}`}
                helper={openTickets[0]?.subject}
                alert={openTickets.length > 0}
              />
              <GlanceRow
                to="/users/$userId/audit"
                userId={userId}
                icon={History}
                label="Audit entries"
                value={`${audit.length}`}
                helper={audit[0]?.action}
              />
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function SignalCard({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  helper: string;
  tone: "emerald" | "rose" | "brand" | "gold";
}) {
  const toneClass = {
    emerald: "bg-emerald-500/12 text-emerald-700",
    rose: "bg-destructive/10 text-destructive",
    brand: "bg-brand/10 text-brand",
    gold: "bg-gold/20 text-gold-foreground",
  }[tone];

  return (
    <div className="group rounded-2xl border border-border/80 bg-card p-4 shadow-[0_1px_2px_rgba(11,29,58,0.04),0_12px_28px_-22px_rgba(11,29,58,0.4)] transition hover:border-brand/25">
      <div className="flex items-start gap-3">
        <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${toneClass}`}>
          <Icon className="size-4" strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 truncate font-display text-[20px] font-extrabold tracking-[-0.025em]">
            {value}
          </p>
          <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{helper}</p>
        </div>
      </div>
    </div>
  );
}

function GlanceRow({
  to,
  userId,
  icon: Icon,
  label,
  value,
  helper,
  alert,
}: {
  to: string;
  userId: string;
  icon: typeof Wallet;
  label: string;
  value: string;
  helper?: string | undefined;
  alert?: boolean | undefined;
}) {
  return (
    <li>
      <Link
        to={to}
        params={{ userId }}
        className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition hover:border-border/70 hover:bg-muted/50"
      >
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-lg ${
            alert ? "bg-gold/20 text-gold-foreground" : "bg-brand/8 text-brand"
          }`}
        >
          <Icon className="size-4" strokeWidth={2.1} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold">{label}</p>
          {helper ? (
            <p className="truncate text-[11.5px] text-muted-foreground">{helper}</p>
          ) : null}
        </div>
        <span className="font-display text-[15px] font-extrabold">{value}</span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  );
}
