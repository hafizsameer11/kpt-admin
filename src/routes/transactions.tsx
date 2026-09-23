import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Coins,
  Download,
  Search,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { downloadCsv } from "@/lib/csv-export";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import { compactNaira, naira } from "@/lib/admin-data";
import type { AdminTxnStatus, AdminTxnType } from "@/lib/admin-users-data";
import {
  hydrateAdminLedgerFromApi,
  TXN_STATUS_TONE,
  TXN_TYPE_LABEL,
  type LedgerChannel,
  type LedgerProduct,
  type LedgerTxn,
} from "@/lib/admin-transactions-data";

export const Route = createFileRoute("/transactions")({
  head: () => ({
    meta: [
      { title: "Global transactions — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Review every Kipit deposit, placement, interest credit, maturity and withdrawal with filters and export.",
      },
      { property: "og:title", content: "Global transactions — Kipit Admin Console" },
      {
        property: "og:description",
        content: "One operational ledger for Kipit money movement across products and channels.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TransactionsPage,
});

type Period = "day" | "month" | "custom";

const TYPES: ("all" | AdminTxnType)[] = [
  "all",
  "deposit",
  "placement",
  "interest",
  "maturity",
  "withdrawal",
];
const STATUSES: ("all" | AdminTxnStatus)[] = [
  "all",
  "successful",
  "processing",
  "failed",
  "declined",
];
const PRODUCTS: ("all" | LedgerProduct)[] = ["all", "Wallet", "Call Account", "Fixed plan", "Explore"];
const CHANNELS: ("all" | LedgerChannel)[] = ["all", "Bank transfer", "Card", "Wallet", "System", "Payout"];

const TYPE_ICON: Record<AdminTxnType, typeof ArrowDownLeft> = {
  deposit: ArrowDownLeft,
  placement: TrendingUp,
  interest: Coins,
  maturity: ArrowLeftRight,
  withdrawal: ArrowUpRight,
};

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function dayLabel(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

/** Build chart series from live ledger (not fixtures). */
function buildDailyFlow(ledger: LedgerTxn[]) {
  const byDay = new Map<string, { day: string; inflow: number; outflow: number; placements: number }>();
  for (const t of ledger) {
    const key = t.date;
    if (!key) continue;
    let bucket = byDay.get(key);
    if (!bucket) {
      bucket = { day: dayLabel(key), inflow: 0, outflow: 0, placements: 0 };
      byDay.set(key, bucket);
    }
    if (t.type === "deposit" || t.type === "maturity" || t.type === "interest") {
      bucket.inflow += t.amount;
    } else if (t.type === "withdrawal") {
      bucket.outflow += t.amount;
    } else if (t.type === "placement") {
      bucket.placements += t.amount;
    }
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
    .slice(-14);
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-border bg-card px-2.5 text-[13px] font-semibold outline-none transition focus:border-brand/40"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === "all" ? "All" : o.charAt(0).toUpperCase() + o.slice(1)}
          </option>
        ))}
      </select>
    </label>
  );
}

function TransactionsPage() {
  const [ledger, setLedger] = useState<LedgerTxn[]>([]);
  const [period, setPeriod] = useState<Period>("month");
  const [from, setFrom] = useState(() => isoDaysAgo(30));
  const [to, setTo] = useState(() => isoToday());
  const [type, setType] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [product, setProduct] = useState<string>("all");
  const [channel, setChannel] = useState<string>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void hydrateAdminLedgerFromApi().then(setLedger);
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const today = isoToday();
    const monthStart = isoDaysAgo(30);
    return ledger.filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (status !== "all" && t.status !== status) return false;
      if (product !== "all" && t.product !== product) return false;
      if (channel !== "all" && t.channel !== channel) return false;
      if (period === "day" && t.date !== today) return false;
      if (period === "month" && (t.date < monthStart || t.date > today)) return false;
      if (period === "custom" && (t.date < from || t.date > to)) return false;
      if (!q) return true;
      return [t.userName, t.userEmail, t.ref, t.label, t.channel].some((f) =>
        f.toLowerCase().includes(q),
      );
    });
  }, [ledger, period, from, to, type, status, product, channel, query]);

  const dailyFlow = useMemo(() => buildDailyFlow(rows.length ? rows : ledger), [rows, ledger]);
  const filteredVolume = rows.reduce((s, t) => s + t.amount, 0);
  const totalInvested = rows.filter((t) => t.type === "placement" && t.status === "successful").reduce((s, t) => s + t.amount, 0);
  const totalInterest = rows.filter((t) => t.type === "interest").reduce((s, t) => s + t.amount, 0);
  const txnVolume = ledger.reduce((s, t) => s + t.amount, 0);

  return (
    <AdminShell
      title="Global transactions"
      subtitle="ADM-040 · every deposit, placement, interest credit, maturity and payout"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Transaction volume"
          value={compactNaira(txnVolume)}
          helper={`${ledger.length} entries`}
          tone="brand"
          icon={ArrowLeftRight}
        />
        <Stat
          label="Total invested"
          value={compactNaira(totalInvested)}
          helper="Successful placements"
          icon={TrendingUp}
        />
        <Stat
          label="Total interest paid"
          value={compactNaira(totalInterest)}
          helper="Accruals credited to customers"
          tone="gold"
          icon={Coins}
        />
        <Stat
          label="In filter"
          value={compactNaira(filteredVolume)}
          helper={`${rows.length} matching transactions`}
          icon={Search}
        />
      </div>

      <Panel title="Daily money movement" eyebrow="Inflow vs payout" icon={ArrowLeftRight} className="mt-5">
        <div className="h-[220px] w-full">
          {dailyFlow.length === 0 ? (
            <p className="flex h-full items-center justify-center text-[13px] text-muted-foreground">
              No money movement in this range yet.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyFlow} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  tickFormatter={(v: number) => compactNaira(v)}
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={60}
                />
                <Tooltip formatter={(v: number) => naira(v)} />
                <Bar dataKey="inflow" name="Inflow" fill="var(--brand)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="placements" name="Placements" fill="var(--gold)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outflow" name="Payouts" fill="var(--muted-foreground)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Panel>

      <Panel className="mt-5 overflow-hidden">
        <div className="-m-5">
          <div className="flex flex-wrap items-end gap-3 border-b border-border/70 px-5 py-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Period
              </span>
              <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
                {(["day", "month", "custom"] as Period[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={`rounded-md px-3 py-1.5 text-[12.5px] font-bold capitalize transition ${
                      period === p ? "bg-brand text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p === "custom" ? "Custom range" : p}
                  </button>
                ))}
              </div>
            </div>

            {period === "custom" ? (
              <div className="flex items-end gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    From
                  </span>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="h-9 rounded-lg border border-border bg-card px-2.5 text-[13px] font-semibold outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    To
                  </span>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="h-9 rounded-lg border border-border bg-card px-2.5 text-[13px] font-semibold outline-none"
                  />
                </label>
              </div>
            ) : null}

            <Select label="Type" value={type} options={TYPES} onChange={setType} />
            <Select label="Product" value={product} options={PRODUCTS} onChange={setProduct} />
            <Select label="Status" value={status} options={STATUSES} onChange={setStatus} />
            <Select label="Channel" value={channel} options={CHANNELS} onChange={setChannel} />

            <label className="ml-auto flex min-w-[15rem] items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search user, reference or channel"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                const n = downloadCsv(
                  "kipit-transactions",
                  ["Label", "Type", "Reference", "User", "Email", "Product", "Channel", "Amount", "Status", "Timestamp"],
                  rows.map((t) => [
                    t.label,
                    TXN_TYPE_LABEL[t.type],
                    t.ref,
                    t.userName,
                    t.userEmail,
                    t.product,
                    t.channel,
                    t.amount,
                    t.status,
                    t.at,
                  ]),
                );
                toast.success(`Downloaded ${n} rows`);
              }}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3 text-[12.5px] font-bold text-primary-foreground transition hover:opacity-90"
            >
              <Download className="size-4" />
              Export
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[64rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="px-5 py-2.5">Transaction</th>
                  <th className="px-5 py-2.5">User</th>
                  <th className="px-5 py-2.5">Product</th>
                  <th className="px-5 py-2.5">Channel</th>
                  <th className="px-5 py-2.5 text-right">Amount</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const Icon = TYPE_ICON[t.type];
                  return (
                    <tr key={t.id} className="group border-b border-border/60 transition hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <Link
                          to="/transactions/$txnId"
                          params={{ txnId: t.id }}
                          className="flex items-center gap-3"
                        >
                          <span
                            className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                              t.type === "withdrawal"
                                ? "bg-destructive/10 text-destructive"
                                : t.type === "interest" || t.type === "maturity"
                                  ? "bg-gold/25 text-gold-foreground"
                                  : "bg-brand/8 text-brand"
                            }`}
                          >
                            <Icon className="size-4" strokeWidth={2.1} />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[13.5px] font-bold group-hover:text-brand">
                              {t.label}
                            </span>
                            <span className="block text-[12px] text-muted-foreground">
                              {TXN_TYPE_LABEL[t.type]} · {t.ref}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          to="/users/$userId"
                          params={{ userId: t.userId }}
                          className="block text-[13px] font-bold hover:text-brand"
                        >
                          {t.userName}
                        </Link>
                        <span className="text-[12px] text-muted-foreground">{t.userEmail}</span>
                      </td>
                      <td className="px-5 py-3 text-[13px]">{t.product}</td>
                      <td className="px-5 py-3 text-[13px] text-muted-foreground">{t.channel}</td>
                      <td className="px-5 py-3 text-right text-[13.5px] font-extrabold tabular-nums">
                        {naira(t.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ${TXN_STATUS_TONE[t.status]}`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[12.5px] text-muted-foreground">{t.at}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 ? (
              <p className="px-5 py-14 text-center text-[13px] text-muted-foreground">
                No transactions match these filters.
              </p>
            ) : null}
          </div>
        </div>
      </Panel>
    </AdminShell>
  );
}
