import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  Clock,
  Info,
  Megaphone,
  Percent,
  Send,
  ShieldCheck,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminShell } from "@/components/kipit/AdminShell";
import {
  ALERTS,
  FLOW_TREND,
  FUM,
  FUM_BREAKDOWN,
  FUM_CHANGE_PCT,
  FUM_SERIES,
  FUM_TREND,
  CAN_VIEW_AUM,
  hydrateAdminDashboardFromApi,
  INTEREST_ACCRUED,
  INTEREST_PAYABLE,
  INTEREST_TREND,
  MATURITIES,
  MATURITY_SCHEDULE,
  METRIC_SPARKS,
  PRIMARY_METRICS,
  PRINCIPAL_BY_PRODUCT,
  PRINCIPAL_BY_TENOR,
  RECENT_ACTIVITY,
  TODAY_FLOWS,
  compactNaira,
  naira,
} from "@/lib/admin-data";
import { loadAdminDashboard } from "@/lib/admin-mappers";

const ACTIVITY_TONE = {
  kyc: { icon: ShieldCheck, wrap: "bg-brand/10 text-brand", chip: "bg-brand/10 text-brand" },
  payout: { icon: Send, wrap: "bg-gold/20 text-gold-foreground", chip: "bg-gold/20 text-gold-foreground" },
  rate: { icon: Percent, wrap: "bg-brand/10 text-brand", chip: "bg-brand/10 text-brand" },
  content: { icon: Megaphone, wrap: "bg-muted text-foreground/70", chip: "bg-muted text-foreground/70" },
  decline: {
    icon: XCircle,
    wrap: "bg-destructive/10 text-destructive",
    chip: "bg-destructive/10 text-destructive",
  },
} as const;

const SLICE_FILLS = ["var(--brand)", "var(--gold)", "var(--chart-4)", "var(--chart-5)"];

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  background: "var(--card)",
  color: "var(--foreground)",
  fontSize: 12,
  fontWeight: 600,
  boxShadow: "0 12px 30px rgba(15,23,42,0.14)",
} as const;

const axisTick = { fill: "var(--muted-foreground)", fontSize: 10, fontWeight: 600 } as const;

const LABELS: Record<string, string> = {
  fixed: "Fixed plans",
  explore: "Explore products",
  call: "Call money",
  wallet: "Wallet balances",
  deposits: "Deposits",
  withdrawals: "Withdrawals",
  accrued: "Accrued",
  paid: "Paid out",
};

const labelOf = (key: string) => LABELS[key] ?? key;


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Executive Dashboard — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Operational cockpit for Kipit: funds under management, interest accrued and payable, maturity tracker and operational alerts.",
      },
      { property: "og:title", content: "Executive Dashboard — Kipit Admin Console" },
      {
        property: "og:description",
        content:
          "Funds under management, interest position, maturity tracker and operational alerts for Kipit administrators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

type Window = "week" | "month" | "custom";

function AdminDashboard() {
  const [window, setWindow] = useState<Window>("week");
  const [, setTick] = useState(0);
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [showAum, setShowAum] = useState(true);
  useEffect(() => {
    void hydrateAdminDashboardFromApi().then((ok) => {
      if (ok) {
        setShowAum(CAN_VIEW_AUM);
        setTick((t) => t + 1);
      }
    });
    void loadAdminDashboard().then((d) => {
      if (d) setCustomerCount(d.users);
    });
  }, []);
  const rows = MATURITIES.filter((m) =>
    window === "week" ? m.window === "week" : window === "month" ? true : true,
  );
  const maturingTotal = rows.reduce((sum, r) => sum + r.principal, 0);

  return (
    <AdminShell
      title="Executive dashboard"
      subtitle="Business cockpit · Operations, Global and Super Admin"
    >
      <div className="space-y-5">
        {/* ADM-010 — headline position */}
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-6 text-primary-foreground shadow-float md:p-7">
            <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-gold/15 blur-3xl" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-foreground/55">
                  Total funds under management
                </p>
                <p className="mt-2 font-display text-[38px] font-extrabold leading-none tracking-[-0.03em] md:text-[46px]">
                  {showAum ? naira(FUM) : "Restricted"}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {showAum ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2.5 py-1 text-[12px] font-bold text-gold">
                      <ArrowUpRight className="size-3.5" />
                      {FUM_CHANGE_PCT}% MoM
                    </span>
                  ) : (
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-bold text-primary-foreground/70">
                      Super / Global / Operations only
                    </span>
                  )}
                  <span className="text-[12px] text-primary-foreground/60">
                    {showAum
                      ? "Across wallet, call, fixed and Explore balances"
                      : "AUM is hidden for your role"}
                    {customerCount != null ? ` · ${customerCount.toLocaleString("en-NG")} customers` : ""}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/55">
                  Interest position
                </p>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-baseline justify-between gap-6">
                    <span className="text-[12px] text-primary-foreground/70">Accrued</span>
                    <span className="text-[15px] font-bold">{naira(INTEREST_ACCRUED)}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-6">
                    <span className="text-[12px] text-primary-foreground/70">Payable</span>
                    <span className="text-[15px] font-bold text-gold">
                      {naira(INTEREST_PAYABLE)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* FUM trend — stacked area */}
            <div className="relative mt-6 h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={FUM_TREND} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                  <defs>
                    <linearGradient id="fumFixed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.85} />
                      <stop offset="100%" stopColor="var(--gold)" stopOpacity={0.25} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 600 }}
                  />
                  <YAxis hide domain={[0, "dataMax + 300"]} />
                  <Tooltip
                    cursor={{ stroke: "rgba(255,255,255,0.3)" }}
                    contentStyle={tooltipStyle}
                    formatter={(v: number, n: string) => [`₦${v}m`, labelOf(n)]}
                  />
                  <Area
                    type="monotone"
                    dataKey="wallet"
                    stackId="1"
                    stroke="rgba(255,255,255,0.35)"
                    fill="rgba(255,255,255,0.12)"
                  />
                  <Area
                    type="monotone"
                    dataKey="call"
                    stackId="1"
                    stroke="rgba(255,255,255,0.5)"
                    fill="rgba(255,255,255,0.18)"
                  />
                  <Area
                    type="monotone"
                    dataKey="explore"
                    stackId="1"
                    stroke="rgba(255,255,255,0.7)"
                    fill="rgba(255,255,255,0.26)"
                  />
                  <Area
                    type="monotone"
                    dataKey="fixed"
                    stackId="1"
                    stroke="var(--gold)"
                    strokeWidth={2}
                    fill="url(#fumFixed)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* Today's flows */}
          <div className="card-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[15px] font-extrabold tracking-[-0.01em]">
                Today&apos;s flows
              </h2>
              <span className="text-[11px] font-semibold text-muted-foreground">Live</span>
            </div>
            <ul className="mt-4 space-y-3">
              {[
                { label: "Deposits", value: TODAY_FLOWS.deposits, up: true },
                { label: "Placements", value: TODAY_FLOWS.placements, up: true },
                { label: "Interest credits", value: TODAY_FLOWS.interestCredits, up: true },
                { label: "Withdrawals", value: TODAY_FLOWS.withdrawals, up: false },
              ].map((f) => (
                <li
                  key={f.label}
                  className="flex items-center justify-between border-b border-border/60 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`grid size-8 place-items-center rounded-lg ${
                        f.up ? "bg-brand/10 text-brand" : "bg-gold/20 text-gold-foreground"
                      }`}
                    >
                      {f.up ? (
                        <ArrowDownRight className="size-4" />
                      ) : (
                        <ArrowUpRight className="size-4" />
                      )}
                    </span>
                    <span className="text-[13px] font-semibold">{f.label}</span>
                  </div>
                  <span className="text-[14px] font-bold tabular-nums">{naira(f.value)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ADM-010 — primary metrics */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PRIMARY_METRICS.map((m) => (
            <div key={m.id} className="card-surface p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {m.label}
              </p>
              <p className="mt-2 font-display text-[24px] font-extrabold tracking-[-0.02em]">
                {naira(m.value)}
              </p>
              <div className="mt-2 flex items-center gap-2">
                {m.changePct != null ? (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-bold text-brand">
                    <TrendingUp className="size-3" />
                    {m.changePct}%
                  </span>
                ) : null}
                <span className="truncate text-[11.5px] text-muted-foreground">{m.helper}</span>
              </div>
              <div className="mt-3 h-[46px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={(METRIC_SPARKS[m.id] ?? []).map((v, i) => ({ i, v }))}
                    margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient id={`spark-${m.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <YAxis hide domain={["dataMin - 20", "dataMax + 10"]} />
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="var(--brand)"
                      strokeWidth={2}
                      fill={`url(#spark-${m.id})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

            </div>
          ))}
        </section>

        {/* Charts row — flows, interest position, maturity schedule */}
        <section className="grid gap-4 xl:grid-cols-3">
          <div className="card-surface p-5">
            <h2 className="font-display text-[15px] font-extrabold tracking-[-0.01em]">
              Deposits vs withdrawals
            </h2>
            <p className="mt-1 text-[12px] text-muted-foreground">Last 7 days, ₦ millions.</p>
            <div className="mt-4 h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={FLOW_TREND} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={axisTick} />
                  <YAxis tickLine={false} axisLine={false} tick={axisTick} width={46} />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={tooltipStyle}
                    formatter={(v: number, n: string) => [`₦${v}m`, labelOf(n)]}
                  />
                  <Bar dataKey="deposits" fill="var(--brand)" radius={[4, 4, 0, 0]} maxBarSize={16} />
                  <Bar dataKey="withdrawals" fill="var(--gold)" radius={[4, 4, 0, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-surface p-5">
            <h2 className="font-display text-[15px] font-extrabold tracking-[-0.01em]">
              Interest accrued vs paid
            </h2>
            <p className="mt-1 text-[12px] text-muted-foreground">Monthly, ₦ millions.</p>
            <div className="mt-4 h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={INTEREST_TREND} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={axisTick} />
                  <YAxis tickLine={false} axisLine={false} tick={axisTick} width={46} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number, n: string) => [`₦${v}m`, labelOf(n)]}
                  />
                  <Line
                    type="monotone"
                    dataKey="accrued"
                    stroke="var(--brand)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="paid"
                    stroke="var(--gold)"
                    strokeWidth={2.5}
                    strokeDasharray="5 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-surface p-5">
            <h2 className="font-display text-[15px] font-extrabold tracking-[-0.01em]">
              Maturities due
            </h2>
            <p className="mt-1 text-[12px] text-muted-foreground">Next six weeks, ₦ millions.</p>
            <div className="mt-4 h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MATURITY_SCHEDULE} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="week" tickLine={false} axisLine={false} tick={axisTick} />
                  <YAxis tickLine={false} axisLine={false} tick={axisTick} width={46} />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => [`₦${v}m`, "Maturing"]}
                  />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={26}>
                    {MATURITY_SCHEDULE.map((row, i) => (
                      <Cell
                        key={row.week}
                        fill={i === 2 ? "var(--gold)" : "var(--brand)"}
                        fillOpacity={i === 2 ? 1 : 0.85}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>



        {/* ADM-013 — operational alerts */}
        <section className="card-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-[15px] font-extrabold tracking-[-0.01em]">
              Operational alerts
            </h2>
            <span className="text-[11.5px] text-muted-foreground">Requires operator action</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {ALERTS.map((a) => {
              const tone =
                a.severity === "critical"
                  ? "border-gold/50 bg-gold/10"
                  : a.severity === "warning"
                    ? "border-border bg-muted/50"
                    : "border-border bg-card";
              const Icon =
                a.severity === "critical" ? AlertTriangle : a.severity === "warning" ? Clock : Info;
              return (
                <div key={a.id} className={`rounded-xl border p-4 ${tone}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12px] font-bold leading-tight">{a.label}</p>
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                  </div>
                  <p className="mt-2 font-display text-[26px] font-extrabold leading-none tracking-[-0.02em]">
                    {a.count}
                  </p>
                  <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                    {a.helper}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* ADM-011 — FUM breakdown */}
          <section className="card-surface p-5">
            <h2 className="font-display text-[15px] font-extrabold tracking-[-0.01em]">
              FUM breakdown
            </h2>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Where customer money currently sits.
            </p>

            <div className="mt-4 grid items-center gap-4 sm:grid-cols-[minmax(0,170px)_minmax(0,1fr)]">
              <div className="relative h-[170px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={FUM_BREAKDOWN}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {FUM_BREAKDOWN.map((s, i) => (
                        <Cell key={s.id} fill={SLICE_FILLS[i % SLICE_FILLS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number, n: string) => [compactNaira(v), n]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      FUM
                    </p>
                    <p className="font-display text-[16px] font-extrabold">{compactNaira(FUM)}</p>
                  </div>
                </div>
              </div>
              <div className="min-w-0">
                <ul className="space-y-2.5">
                  {FUM_BREAKDOWN.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className={`size-2.5 shrink-0 rounded-full ${s.tone}`} />
                        <span className="truncate text-[13px] font-semibold">{s.label}</span>
                      </span>
                      <span className="shrink-0 text-[13px] font-bold tabular-nums">
                        {naira(s.value)}
                        <span className="ml-2 text-[11.5px] font-semibold text-muted-foreground">
                          {((s.value / FUM) * 100).toFixed(1)}%
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>



            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Principal by tenor
                </p>
                <ul className="mt-2.5 space-y-2">
                  {PRINCIPAL_BY_TENOR.map((t) => (
                    <li key={t.band} className="flex items-center justify-between text-[12.5px]">
                      <span className="font-semibold">
                        {t.band}
                        <span className="ml-1.5 text-[11px] font-bold text-brand">{t.rate}</span>
                      </span>
                      <span className="font-bold tabular-nums">{compactNaira(t.value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Principal by Explore product
                </p>
                <ul className="mt-2.5 space-y-2">
                  {PRINCIPAL_BY_PRODUCT.map((p) => (
                    <li key={p.product} className="flex items-center justify-between gap-3 text-[12.5px]">
                      <span className="truncate font-semibold">{p.product}</span>
                      <span className="shrink-0 font-bold tabular-nums">
                        {compactNaira(p.value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ADM-012 — maturity tracker */}
          <section className="card-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 text-brand" />
                <h2 className="font-display text-[15px] font-extrabold tracking-[-0.01em]">
                  Maturity tracker
                </h2>
              </div>
              <div className="flex rounded-lg border border-border bg-muted/60 p-0.5">
                {(
                  [
                    ["week", "This week"],
                    ["month", "This month"],
                    ["custom", "Custom"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setWindow(id)}
                    className={`rounded-[7px] px-3 py-1.5 text-[12px] font-bold transition ${
                      window === id
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
              <span className="text-[12px] text-muted-foreground">
                {rows.length} maturities in view
              </span>
              <span className="text-[13px] font-bold tabular-nums">{naira(maturingTotal)}</span>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead>
                  <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-3">User</th>
                    <th className="pb-2 pr-3">Product</th>
                    <th className="pb-2 pr-3 text-right">Principal</th>
                    <th className="pb-2 pr-3 text-right">Expected</th>
                    <th className="pb-2 text-right">Maturity</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-3 text-[13px] font-semibold">{r.user}</td>
                      <td className="py-2.5 pr-3 text-[12.5px] text-muted-foreground">
                        {r.product}
                      </td>
                      <td className="py-2.5 pr-3 text-right text-[13px] font-bold tabular-nums">
                        {naira(r.principal)}
                      </td>
                      <td className="py-2.5 pr-3 text-right text-[13px] font-bold tabular-nums text-brand">
                        {naira(r.expected)}
                      </td>
                      <td className="py-2.5 text-right text-[12.5px] font-semibold">{r.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Admin audit trail — timeline */}
        <section className="card-surface p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-[15px] font-extrabold tracking-[-0.01em]">
                Recent admin activity
              </h2>
              <p className="mt-1 text-[12px] text-muted-foreground">
                Every action is stamped with operator, role and session.
              </p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-bold text-muted-foreground">
              Live audit trail
            </span>
          </div>

          <ol className="relative mt-5 space-y-1 pl-2">
            <span
              aria-hidden
              className="absolute left-[22px] top-3 bottom-6 w-px bg-gradient-to-b from-border via-border to-transparent"
            />
            {RECENT_ACTIVITY.map((a) => {
              const tone = ACTIVITY_TONE[a.kind];
              const Icon = tone.icon;
              return (
                <li
                  key={a.id}
                  className="group relative flex gap-4 rounded-2xl p-3 transition-colors hover:bg-muted/60"
                >
                  <span
                    className={`relative z-10 grid size-9 shrink-0 place-items-center rounded-xl ring-4 ring-card ${tone.wrap}`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <p className="text-[13.5px] font-bold tracking-[-0.01em]">{a.action}</p>
                      {a.amount != null ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${tone.chip}`}
                        >
                          {naira(a.amount)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{a.detail}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="grid size-5 place-items-center rounded-full bg-brand/10 text-[9px] font-extrabold text-brand">
                        {a.who.slice(0, 1)}
                      </span>
                      <span className="font-semibold text-foreground/80">{a.who}</span>
                      <span aria-hidden>·</span>
                      <span>{a.team}</span>
                    </div>
                  </div>
                  <span className="shrink-0 self-start text-[11.5px] font-semibold text-muted-foreground">
                    {a.at}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>


        <p className="pb-2 text-[11px] leading-relaxed text-muted-foreground">
          Live console. Administrative actions are recorded against the operator, role and session
          in the audit log.
        </p>
      </div>
    </AdminShell>
  );
}
