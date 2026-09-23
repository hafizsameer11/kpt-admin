import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, BarChart3, Download, PieChart as PieIcon, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { downloadCsv } from "@/lib/csv-export";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel } from "@/components/kipit/AdminBits";
import {
  hydrateAdminAnalyticsFromApi,
  type AnalyticsKpi,
  type ChannelMixRow,
  type GrowthPoint,
  type NetFlowPoint,
  type ProductMixSlice,
  type RetentionPoint,
} from "@/lib/admin-console-data";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Reports & analytics — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Kipit growth, retention, flow and product-mix analytics: signups, funded rate, net flow, rollover and cohort retention.",
      },
      { property: "og:title", content: "Reports & analytics — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Growth, retention and portfolio analytics for Kipit operators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AnalyticsPage,
});

const RANGES = ["30 days", "90 days", "6 months", "Year"] as const;

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid rgba(11,29,58,0.12)",
  fontSize: 12,
  fontWeight: 600,
} as const;

const PRODUCT_TONES: Record<string, string> = {
  Fixed: "var(--brand)",
  Explore: "var(--gold)",
  Call: "#4C7DF0",
  Wallet: "#9AB0D6",
};

function AnalyticsPage() {
  const [range, setRange] = useState<(typeof RANGES)[number]>("6 months");
  const [kpis, setKpis] = useState<AnalyticsKpi[]>([]);
  const [growth, setGrowth] = useState<GrowthPoint[]>([]);
  const [netFlow, setNetFlow] = useState<NetFlowPoint[]>([]);
  const [retention, setRetention] = useState<RetentionPoint[]>([]);
  const [productMix, setProductMix] = useState<ProductMixSlice[]>([]);
  const [channelMix, setChannelMix] = useState<ChannelMixRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void hydrateAdminAnalyticsFromApi(range).then((data) => {
      if (cancelled) return;
      if (!data) {
        setKpis([]);
        setGrowth([]);
        setNetFlow([]);
        setRetention([]);
        setProductMix([]);
        setChannelMix([]);
        setLoading(false);
        return;
      }
      setKpis(
        data.kpis.map((k) => ({
          ...k,
          helper: data.range,
        })),
      );
      setGrowth(
        data.growthSeries.map((g) => ({
          month: g.month,
          signups: g.signups,
          funded: g.funded,
          active: g.funded,
        })),
      );
      setNetFlow(
        data.netFlowSeries.map((n) => ({
          month: n.month,
          deposits: n.inflow,
          withdrawals: n.outflow,
        })),
      );
      setRetention(
        data.retentionSeries.map((r) => ({
          cohort: r.month,
          m1: r.retention,
          m2: r.retention,
          m3: r.retention,
        })),
      );
      setProductMix(
        data.productMix.map((p) => ({
          id: p.name.toLowerCase(),
          label: p.name,
          value: p.value,
          tone: PRODUCT_TONES[p.name] ?? "var(--brand)",
        })),
      );
      setChannelMix(data.channelMix.map((c) => ({ channel: c.name, value: c.value })));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [range]);

  function exportAnalytics() {
    const stamp = range.replace(/\s+/g, "-").toLowerCase();
    const sections: Array<unknown[]> = [];
    for (const k of kpis) {
      sections.push(["kpi", k.label, k.value, k.delta ?? "", k.helper ?? ""]);
    }
    for (const g of growth) {
      sections.push(["growth", g.month, g.signups, g.funded, g.active]);
    }
    for (const n of netFlow) {
      sections.push(["net_flow", n.month, n.deposits, n.withdrawals, ""]);
    }
    for (const r of retention) {
      sections.push(["retention", r.cohort, r.m1, r.m2, r.m3]);
    }
    for (const p of productMix) {
      sections.push(["product_mix", p.label, p.value, "", ""]);
    }
    for (const c of channelMix) {
      sections.push(["channel_mix", c.channel, c.value, "", ""]);
    }
    const n = downloadCsv(
      `kipit-analytics-${stamp}`,
      ["Series", "Label", "A", "B", "C"],
      sections,
    );
    toast.success(`Downloaded ${n} rows`, { description: `${range} · CSV` });
  }

  return (
    <AdminShell title="Reports & analytics" subtitle="Growth, flows, retention and product mix">
      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition ${
              range === r
                ? "bg-brand text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {r}
          </button>
        ))}

        <Link
          to="/reports"
          className="ml-auto rounded-lg border border-border bg-card px-3 py-2 text-[12.5px] font-bold transition hover:bg-muted"
        >
          Reports centre
        </Link>
        <button
          type="button"
          onClick={() => void exportAnalytics()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[12.5px] font-bold text-primary-foreground transition hover:opacity-90"
        >
          <Download className="size-4" /> Export
        </button>
      </div>

      {loading ? (
        <p className="mt-5 text-[13px] text-muted-foreground">Loading analytics…</p>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-border/80 bg-card p-4 shadow-[0_1px_2px_rgba(11,29,58,0.04),0_12px_28px_-22px_rgba(11,29,58,0.4)]"
          >
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {k.label}
            </p>
            <div className="mt-1.5 flex items-end gap-2">
              <p className="font-display text-[24px] font-extrabold tracking-[-0.025em]">{k.value}</p>
              <span
                className={`mb-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                  k.up ? "bg-emerald-500/12 text-emerald-700" : "bg-destructive/10 text-destructive"
                }`}
              >
                {k.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {k.delta}
              </span>
            </div>
            <p className="mt-0.5 text-[12px] text-muted-foreground">{k.helper}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <Panel title="Acquisition & activation" eyebrow="Customers" icon={TrendingUp}>
          <div className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth} margin={{ left: -18, right: 6, top: 8 }}>
                <defs>
                  <linearGradient id="gSign" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gFund" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--gold)" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(11,29,58,0.08)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                <Area
                  type="monotone"
                  name="Signups"
                  dataKey="signups"
                  stroke="var(--brand)"
                  strokeWidth={2.4}
                  fill="url(#gSign)"
                />
                <Area
                  type="monotone"
                  name="Funded"
                  dataKey="funded"
                  stroke="var(--gold)"
                  strokeWidth={2.4}
                  fill="url(#gFund)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Portfolio mix" eyebrow="FUM by product (₦m)" icon={PieIcon}>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productMix}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={58}
                  outerRadius={92}
                  paddingAngle={2}
                  stroke="none"
                >
                  {productMix.map((s) => (
                    <Cell key={s.id} fill={s.tone} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-2">
            {productMix.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-[12.5px]">
                <span className="size-2.5 rounded-full" style={{ background: s.tone }} />
                <span className="font-semibold">{s.label}</span>
                <span className="ml-auto font-bold">{s.value}%</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="Deposits vs withdrawals" eyebrow="₦ millions" icon={BarChart3}>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={netFlow} margin={{ left: -18, right: 6, top: 8 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(11,29,58,0.08)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(11,29,58,0.04)" }} />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                <Bar name="Deposits" dataKey="deposits" fill="var(--brand)" radius={[6, 6, 0, 0]} />
                <Bar name="Withdrawals" dataKey="withdrawals" fill="var(--gold)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Cohort retention" eyebrow="% still invested" icon={TrendingUp}>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={retention} margin={{ left: -18, right: 6, top: 8 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(11,29,58,0.08)" vertical={false} />
                <XAxis dataKey="cohort" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis domain={[50, 100]} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                <Line name="Month 1" dataKey="m1" stroke="var(--brand)" strokeWidth={2.4} dot={false} />
                <Line name="Month 2" dataKey="m2" stroke="var(--gold)" strokeWidth={2.4} dot={false} />
                <Line name="Month 3" dataKey="m3" stroke="#4C7DF0" strokeWidth={2.4} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="Funding channel mix" eyebrow="Share of deposits">
          <ul className="space-y-3.5">
            {channelMix.map((c) => (
              <li key={c.channel}>
                <div className="flex items-center justify-between text-[13px] font-semibold">
                  <span>{c.channel}</span>
                  <span className="font-bold">{c.value}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-brand"
                    style={{ width: `${c.value}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Active customers" eyebrow="Monthly active investors">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth} margin={{ left: -18, right: 6, top: 8 }}>
                <defs>
                  <linearGradient id="gActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="rgba(11,29,58,0.08)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="active"
                  name="Active"
                  stroke="var(--brand)"
                  strokeWidth={2.4}
                  fill="url(#gActive)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </AdminShell>
  );
}
