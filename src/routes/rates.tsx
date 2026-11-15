import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, ClipboardCheck, Percent, Search, TrendingUp, Wallet } from "lucide-react";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import { compactNaira, naira } from "@/lib/admin-data";
import {
  hydrateAdminRatesFromApi,
  getLiveRateBands,
  RATE_STATUS_LABEL,
  RATE_STATUS_TONE,
  type RateBand,
  type RateFamilyTab,
  type RateStatus,
} from "@/lib/admin-rates-data";
import { adminCanAccess, hydrateAdminPermissionsFromApi } from "@/lib/admin-permissions";

export const Route = createFileRoute("/rates")({
  head: () => ({
    meta: [
      { title: "Rate management — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Call, Kipit Lock and Kipit Flex rates with net/gross display and maker-checker changes.",
      },
      { property: "og:title", content: "Rate management — Kipit Admin Console" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RateTablePage,
});

const PRODUCT_TABS: { id: "all" | RateFamilyTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "CALL", label: "Call" },
  { id: "LOCK", label: "Kipit Lock" },
  { id: "FLEX", label: "Kipit Flex" },
];

const STATUS_TABS: ("all" | RateStatus)[] = ["all", "active", "pending", "scheduled", "retired"];

function fmtDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function RateTablePage() {
  const [bands, setBands] = useState<RateBand[]>([]);
  const [productTab, setProductTab] = useState<"all" | RateFamilyTab>("all");
  const [statusTab, setStatusTab] = useState<"all" | RateStatus>("all");
  const [query, setQuery] = useState("");
  const [canPropose, setCanPropose] = useState(false);
  const [canApprove, setCanApprove] = useState(false);

  useEffect(() => {
    void hydrateAdminRatesFromApi().then(setBands);
    void hydrateAdminPermissionsFromApi().then(() => {
      setCanPropose(adminCanAccess("rate.propose"));
      setCanApprove(adminCanAccess("rate.approve"));
    });
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bands.filter((b) => {
      if (productTab !== "all" && b.family !== productTab) return false;
      if (statusTab !== "all" && b.status !== statusTab) return false;
      if (!q) return true;
      return [b.band, b.product, b.code, b.rateLabel].some((f) => f.toLowerCase().includes(q));
    });
  }, [bands, productTab, statusTab, query]);

  const totals = useMemo(() => {
    const source = bands.length ? bands : getLiveRateBands();
    if (!source.length) {
      return { bands: 0, active: 0, awaiting: 0, scheduled: 0, principal: 0, weightedRate: 0 };
    }
    return {
      bands: source.length,
      active: source.filter((b) => b.status === "active").length,
      awaiting: source.filter((b) => b.status === "pending").length,
      scheduled: source.filter((b) => b.status === "scheduled").length,
      principal: source.reduce((s, b) => s + b.principal, 0),
      weightedRate:
        source.reduce((s, b) => s + b.currentRate * b.principal, 0) /
        Math.max(
          source.reduce((s, b) => s + b.principal, 0),
          1,
        ),
    };
  }, [bands]);

  return (
    <AdminShell
      title="Rate management"
      subtitle="C10 · Call, Kipit Lock & Kipit Flex — enter net, show gross (÷0.9)"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Active bands"
          value={String(totals.active)}
          helper={`${totals.bands} bands configured`}
          tone="brand"
          icon={Percent}
        />
        <Stat
          label="Weighted net rate"
          value={`${totals.weightedRate.toFixed(2)}%`}
          helper="Across placed principal"
          tone="gold"
          icon={TrendingUp}
        />
        <Stat
          label="Principal on book"
          value={compactNaira(totals.principal)}
          helper="Call + Lock + Flex"
          icon={Wallet}
        />
        <Stat
          label="Awaiting approval"
          value={String(totals.awaiting)}
          helper={`${totals.scheduled} scheduled change${totals.scheduled === 1 ? "" : "s"}`}
          icon={ClipboardCheck}
        />
      </div>

      <Panel className="mt-5 overflow-hidden">
        <div className="-m-5">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/70 px-5 py-4">
            <div className="flex flex-wrap rounded-lg border border-border bg-muted/40 p-0.5">
              {PRODUCT_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setProductTab(t.id)}
                  className={`rounded-md px-3 py-1.5 text-[12.5px] font-bold transition ${
                    productTab === t.id
                      ? "bg-brand text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap rounded-lg border border-border bg-muted/40 p-0.5">
              {STATUS_TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setStatusTab(t)}
                  className={`rounded-md px-3 py-1.5 text-[12.5px] font-bold transition ${
                    statusTab === t
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "all" ? "Any status" : RATE_STATUS_LABEL[t]}
                </button>
              ))}
            </div>

            <label className="ml-auto flex min-w-[15rem] items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search band or product"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
              />
            </label>

            {canApprove ? (
              <Link
                to="/rates/approvals"
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-[12.5px] font-bold transition hover:border-brand/40 hover:text-brand"
              >
                <ClipboardCheck className="size-4" />
                Approval queue
                {totals.awaiting > 0 ? (
                  <span className="rounded-full bg-gold/30 px-1.5 text-[11px] font-bold text-gold-foreground">
                    {totals.awaiting}
                  </span>
                ) : null}
              </Link>
            ) : null}

            {canPropose ? (
              <Link
                to="/rates/propose"
                search={{ band: "" }}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3 text-[12.5px] font-bold text-primary-foreground transition hover:opacity-90"
              >
                <TrendingUp className="size-4" />
                Propose rate change
              </Link>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[68rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="px-5 py-2.5">Product / tenor</th>
                  <th className="px-5 py-2.5 text-right">Net rate</th>
                  <th className="px-5 py-2.5 text-right">Gross</th>
                  <th className="px-5 py-2.5 text-right">Previous net</th>
                  <th className="px-5 py-2.5">Effective</th>
                  <th className="px-5 py-2.5 text-right">Principal</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => {
                  const delta = b.currentRate - b.previousRate;
                  return (
                    <tr key={b.id} className="border-b border-border/60 transition hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <span className="block text-[13.5px] font-bold">{b.band}</span>
                        <span className="block text-[12px] text-muted-foreground">
                          {b.product} · min {naira(b.minimum)} · {b.placements.toLocaleString("en-NG")}{" "}
                          placements
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-[14px] font-extrabold tabular-nums text-brand">
                        {b.currentRate.toFixed(2)}%
                      </td>
                      <td className="px-5 py-3 text-right text-[13px] tabular-nums text-muted-foreground">
                        {b.currentGrossRate.toFixed(2)}%
                      </td>
                      <td className="px-5 py-3 text-right text-[13px] tabular-nums text-muted-foreground">
                        {b.previousRate.toFixed(2)}%
                        {delta !== 0 ? (
                          <span
                            className={`ml-1.5 text-[11.5px] font-bold ${
                              delta > 0 ? "text-emerald-600" : "text-destructive"
                            }`}
                          >
                            {delta > 0 ? "+" : ""}
                            {(delta * 100).toFixed(0)}bps
                          </span>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 text-[13px]">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarClock className="size-3.5 text-muted-foreground" />
                          {fmtDate(b.effectiveDate)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-[13px] tabular-nums">
                        {compactNaira(b.principal)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${RATE_STATUS_TONE[b.status]}`}
                        >
                          {RATE_STATUS_LABEL[b.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {canPropose ? (
                          <Link
                            to="/rates/propose"
                            search={{ band: b.id }}
                            className="rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-bold transition hover:border-brand/40 hover:text-brand"
                          >
                            Propose change
                          </Link>
                        ) : (
                          <span className="text-[12px] text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 ? (
              <p className="px-5 py-14 text-center text-[13px] text-muted-foreground">
                No rate bands match this view. Lock / Flex / Call bands load from Appendix D on the API.
              </p>
            ) : null}
          </div>
        </div>
      </Panel>

      <p className="mt-4 text-[12.5px] text-muted-foreground">
        Enter <strong>net</strong> rates; gross = net ÷ 0.9 (10% WHT). Changes need a second approver and apply
        to <strong>new</strong> placements only. Custom Lock tenors use nearest standard ≤ days; Flex 31–59
        days use the 60-day rate. Lock upfront can be suggested from the at-maturity formula on the propose
        screen.
      </p>
    </AdminShell>
  );
}
