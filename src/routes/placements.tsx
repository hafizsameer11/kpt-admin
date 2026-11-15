import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PiggyBank, Search } from "lucide-react";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import { compactNaira, naira } from "@/lib/admin-data";
import { adminCanAccess, hydrateAdminPermissionsFromApi } from "@/lib/admin-permissions";
import { fetchAdminPlacements, type AdminPlacementRow } from "@/lib/admin-api";

export const Route = createFileRoute("/placements")({
  head: () => ({
    meta: [
      { title: "Placements — Kipit Admin Console" },
      { name: "description", content: "All customer placements across Lock, Flex, Call and Explore." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PlacementsPage,
});

function fmtDay(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB");
}

function fmtMoney(value?: number | null) {
  return value == null ? "—" : naira(value);
}

function payoutLabel(v?: string | null) {
  if (v === "UPFRONT") return "Upfront";
  if (v === "AT_MATURITY") return "At maturity";
  return "—";
}

function typeLabel(r: AdminPlacementRow) {
  return r.kind === "EXPLORE" ? "Explore" : r.planType ? "Lock/Flex" : "Fixed";
}

const selectClass =
  "rounded-lg border border-border bg-background px-3 py-2.5 text-[13px] outline-none focus:border-brand";
const dateClass =
  "rounded-lg border border-border bg-background px-2 py-2 text-[12.5px] outline-none focus:border-brand";

type Filters = {
  planType: "" | "LOCK" | "FLEX";
  interestPayout: "" | "AT_MATURITY" | "UPFRONT";
  status: "" | "active" | "matured" | "broken" | "break pending";
  amountMin: string;
  amountMax: string;
  placedFrom: string;
  placedTo: string;
  maturityFrom: string;
  maturityTo: string;
};

const EMPTY_FILTERS: Filters = {
  planType: "",
  interestPayout: "",
  status: "",
  amountMin: "",
  amountMax: "",
  placedFrom: "",
  placedTo: "",
  maturityFrom: "",
  maturityTo: "",
};

function PlacementsPage() {
  const [rows, setRows] = useState<AdminPlacementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [allowed, setAllowed] = useState(true);
  const [permReady, setPermReady] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    void hydrateAdminPermissionsFromApi().then(() => {
      const ok = adminCanAccess("placement.view");
      setAllowed(ok);
      setPermReady(true);
      if (!ok) setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!permReady || !allowed) return;
    let cancelled = false;
    setLoading(true);
    const amountMin = filters.amountMin.trim() ? Number(filters.amountMin) : undefined;
    const amountMax = filters.amountMax.trim() ? Number(filters.amountMax) : undefined;
    void fetchAdminPlacements({
      planType: filters.planType || undefined,
      interestPayout: filters.interestPayout || undefined,
      status: filters.status || undefined,
      amountMin: Number.isFinite(amountMin) ? amountMin : undefined,
      amountMax: Number.isFinite(amountMax) ? amountMax : undefined,
      placedFrom: filters.placedFrom || undefined,
      placedTo: filters.placedTo || undefined,
      maturityFrom: filters.maturityFrom || undefined,
      maturityTo: filters.maturityTo || undefined,
      pageSize: 200,
    })
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [permReady, allowed, filters]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (r) =>
        r.clientName.toLowerCase().includes(needle) ||
        r.clientEmail.toLowerCase().includes(needle) ||
        r.name.toLowerCase().includes(needle) ||
        r.id.toLowerCase().includes(needle),
    );
  }, [rows, q]);

  const active = rows.filter((r) => r.status === "active").length;
  const principal = rows.reduce((s, r) => s + r.principal, 0);
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  if (!allowed) {
    return (
      <AdminShell title="Placements" subtitle="Insufficient permissions">
        <Panel title="Access restricted">
          <p className="text-[13px] text-muted-foreground">
            Your role does not include the <strong>placement.view</strong> permission. Contact a Global
            Admin to update Operations grants.
          </p>
        </Panel>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Placements" subtitle="ADM-041 · global book across products">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Rows loaded" value={String(rows.length)} helper="Latest 200" icon={PiggyBank} />
        <Stat label="Active" value={String(active)} helper="Live holdings" tone="brand" />
        <Stat
          label="Principal (loaded)"
          value={compactNaira(principal)}
          helper="Sum of listed placements"
          tone="gold"
        />
      </div>

      <Panel className="mt-5" title="All placements" eyebrow={loading ? "Loading…" : `${filtered.length} shown`}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search client, email or plan name…"
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-[13px] outline-none focus:border-brand"
            />
          </div>
          <select
            value={filters.planType}
            onChange={(e) => setFilter("planType", e.target.value as Filters["planType"])}
            className={selectClass}
            aria-label="Plan"
          >
            <option value="">All plans</option>
            <option value="LOCK">Lock</option>
            <option value="FLEX">Flex</option>
          </select>
          <select
            value={filters.interestPayout}
            onChange={(e) =>
              setFilter("interestPayout", e.target.value as Filters["interestPayout"])
            }
            className={selectClass}
            aria-label="Interest payout"
          >
            <option value="">All payouts</option>
            <option value="UPFRONT">Upfront</option>
            <option value="AT_MATURITY">At maturity</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilter("status", e.target.value as Filters["status"])}
            className={selectClass}
            aria-label="Status"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="matured">Matured</option>
            <option value="broken">Broken</option>
            <option value="break pending">Break pending</option>
          </select>
        </div>
        <div className="mb-4 flex flex-wrap items-end gap-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <label className="flex flex-col gap-1">
            Amount (₦)
            <span className="flex items-center gap-1">
              <input
                inputMode="decimal"
                value={filters.amountMin}
                onChange={(e) => setFilter("amountMin", e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="Min"
                className={`${dateClass} w-28`}
              />
              <input
                inputMode="decimal"
                value={filters.amountMax}
                onChange={(e) => setFilter("amountMax", e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="Max"
                className={`${dateClass} w-28`}
              />
            </span>
          </label>
          <label className="flex flex-col gap-1">
            Placed
            <span className="flex items-center gap-1">
              <input
                type="date"
                value={filters.placedFrom}
                onChange={(e) => setFilter("placedFrom", e.target.value)}
                className={dateClass}
              />
              <input
                type="date"
                value={filters.placedTo}
                onChange={(e) => setFilter("placedTo", e.target.value)}
                className={dateClass}
              />
            </span>
          </label>
          <label className="flex flex-col gap-1">
            Maturity
            <span className="flex items-center gap-1">
              <input
                type="date"
                value={filters.maturityFrom}
                onChange={(e) => setFilter("maturityFrom", e.target.value)}
                className={dateClass}
              />
              <input
                type="date"
                value={filters.maturityTo}
                onChange={(e) => setFilter("maturityTo", e.target.value)}
                className={dateClass}
              />
            </span>
          </label>
          {hasFilters ? (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="h-9 rounded-lg border border-border px-3 text-[12px] font-bold normal-case tracking-normal text-foreground"
            >
              Clear filters
            </button>
          ) : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[96rem] border-collapse text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-border text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                <th className="px-2 py-2">Client</th>
                <th className="px-2 py-2">Type</th>
                <th className="px-2 py-2">Plan</th>
                <th className="px-2 py-2">Payout</th>
                <th className="px-2 py-2 text-right">Principal</th>
                <th className="px-2 py-2">Rate (net / gross)</th>
                <th className="px-2 py-2">Tenor</th>
                <th className="px-2 py-2">Placed</th>
                <th className="px-2 py-2">Maturity</th>
                <th className="px-2 py-2 text-right">Accrued gross</th>
                <th className="px-2 py-2 text-right">Accrued WHT</th>
                <th className="px-2 py-2 text-right">Accrued net</th>
                <th className="px-2 py-2 text-right">Expected gross</th>
                <th className="px-2 py-2 text-right">Expected WHT</th>
                <th className="px-2 py-2 text-right">Expected net</th>
                <th className="px-2 py-2 text-right">Value at maturity</th>
                <th className="px-2 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-border/60 hover:bg-muted/30">
                  <td className="px-2 py-2.5">
                    <Link
                      to="/users/$userId/investments"
                      params={{ userId: r.userId }}
                      className="font-bold text-brand hover:underline"
                    >
                      {r.clientName}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">{r.clientEmail}</p>
                  </td>
                  <td className="px-2 py-2.5">{typeLabel(r)}</td>
                  <td className="px-2 py-2.5 font-semibold">
                    {r.kind === "EXPLORE" ? r.name : r.planType === "FLEX" ? "Flex" : r.planType === "LOCK" ? "Lock" : r.name}
                    {r.kind !== "EXPLORE" ? (
                      <p className="text-[11px] font-normal text-muted-foreground">{r.name}</p>
                    ) : null}
                  </td>
                  <td className="px-2 py-2.5">{payoutLabel(r.interestPayout)}</td>
                  <td className="px-2 py-2.5 text-right">{naira(r.principal)}</td>
                  <td className="px-2 py-2.5 whitespace-nowrap">
                    <span className="font-bold">{r.ratePct.toFixed(2)}%</span>
                    <span className="text-muted-foreground"> / {r.grossRatePct.toFixed(2)}%</span>
                  </td>
                  <td className="px-2 py-2.5">{r.tenorDays != null ? `${r.tenorDays}d` : "—"}</td>
                  <td className="px-2 py-2.5">{fmtDay(r.startDate)}</td>
                  <td className="px-2 py-2.5">{fmtDay(r.maturityDate)}</td>
                  <td className="px-2 py-2.5 text-right">{fmtMoney(r.accruedGross)}</td>
                  <td className="px-2 py-2.5 text-right">{fmtMoney(r.accruedWht)}</td>
                  <td className="px-2 py-2.5 text-right">{fmtMoney(r.accruedNet)}</td>
                  <td className="px-2 py-2.5 text-right">{fmtMoney(r.expectedGross)}</td>
                  <td className="px-2 py-2.5 text-right">{fmtMoney(r.expectedWht)}</td>
                  <td className="px-2 py-2.5 text-right">{fmtMoney(r.expectedNet)}</td>
                  <td className="px-2 py-2.5 text-right font-bold">{fmtMoney(r.valueAtMaturity)}</td>
                  <td className="px-2 py-2.5">
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] font-bold uppercase">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={17} className="px-2 py-8 text-center text-muted-foreground">
                    No placements match your filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </AdminShell>
  );
}
