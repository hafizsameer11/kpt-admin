import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Download, Plus, Search, SlidersHorizontal, Users2, X } from "lucide-react";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, StatusPill, TierPill } from "@/components/kipit/AdminBits";
import {
  hydrateAdminUsersFromApi,
  portfolioValue,
  type AdminUser,
  type Tier,
  type UserStatus,
} from "@/lib/admin-users-data";
import { naira, compactNaira } from "@/lib/admin-data";
import { canViewAum, getAdminSession } from "@/lib/admin-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { downloadCsv } from "@/lib/csv-export";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "User Management — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Search, filter and open Kipit customer records: KYC tier, account status, portfolio value and date joined.",
      },
      { property: "og:title", content: "User Management — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Customer directory with tier, status and portfolio value for Kipit administrators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminUserList,
});

type TierFilter = "all" | Tier;
type StatusFilter = "all" | UserStatus;

const TIER_OPTIONS: { value: TierFilter; label: string }[] = [
  { value: "all", label: "All tiers" },
  { value: 0, label: "Tier 0" },
  { value: 1, label: "Tier 1" },
  { value: 2, label: "Tier 2" },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending KYC" },
  { value: "frozen", label: "Frozen" },
  { value: "dormant", label: "Dormant" },
];

function AdminUserList() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<TierFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const showAum = canViewAum(getAdminSession()?.role);

  useEffect(() => {
    void hydrateAdminUsersFromApi().then(setUsers);
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (tier !== "all" && u.tier !== tier) return false;
      if (status !== "all" && u.status !== status) return false;
      if (!q) return true;
      return [u.name, u.email, u.phone, u.id].some((f) => f.toLowerCase().includes(q));
    });
  }, [users, query, tier, status]);

  const totals = useMemo(
    () => ({
      users: users.length,
      verified: users.filter((u) => u.tier === 2).length,
      pending: users.filter((u) => u.status === "pending").length,
      aum: users.reduce((s, u) => s + portfolioValue(u), 0),
    }),
    [users],
  );

  const filtered = tier !== "all" || status !== "all" || query.trim().length > 0;

  const maxValue = Math.max(...users.map((u) => portfolioValue(u)), 1);
  const tierSplit = [0, 1, 2].map(
    (t) => (users.length ? users.filter((u) => u.tier === t).length / users.length : 0),
  );

  return (
    <AdminShell title="Users" subtitle="ADM-020 · Customer directory">
      <div className="space-y-5">
        {/* Directory overview band */}
        <section className="relative overflow-hidden rounded-3xl bg-brand-gradient p-6 text-primary-foreground shadow-[0_24px_60px_-38px_rgba(11,29,58,0.9)]">
          <span className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-gold/18 blur-3xl" />
          <span className="pointer-events-none absolute -bottom-28 left-1/3 size-72 rounded-full bg-white/8 blur-3xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-primary-foreground/55">
                Customer directory
              </p>
              <p className="mt-1.5 font-display text-[30px] font-extrabold tracking-[-0.03em]">
                {totals.users.toLocaleString("en-NG")} accounts
              </p>
              <p className="text-[13px] text-primary-foreground/65">
                {showAum ? `${compactNaira(totals.aum)} under management · ` : ""}
                {totals.pending} awaiting verification
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/users/new"
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-gold px-4 text-[12.5px] font-extrabold text-gold-foreground"
                >
                  <Plus className="size-4" />
                  Onboard customer
                </Link>
                <Link
                  to="/users/dropoffs"
                  className="inline-flex h-10 items-center rounded-xl border border-white/20 bg-white/10 px-4 text-[12.5px] font-bold text-primary-foreground"
                >
                  Signup drop-offs
                </Link>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-4 sm:max-w-[34rem] sm:grid-cols-3">
              {[
                { label: "Tier 2 verified", value: `${totals.verified}`, helper: "Full withdrawal access" },
                { label: "Awaiting KYC", value: `${totals.pending}`, helper: "Tier 0 · no funding yet" },
                ...(showAum
                  ? [{ label: "Customer AUM", value: compactNaira(totals.aum), helper: "Wallet + call + invested" }]
                  : [{ label: "Customer AUM", value: "Restricted", helper: "Super / Global / Ops only" }]),
              ].map((s) => (
                <div key={s.label} className="border-l border-white/12 pl-4 first:border-l-0 first:pl-0 sm:border-l sm:pl-4 sm:first:pl-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary-foreground/50">
                    {s.label}
                  </p>
                  <p className="mt-1 font-display text-[20px] font-extrabold tracking-[-0.02em]">
                    {s.value}
                  </p>
                  <p className="text-[11.5px] text-primary-foreground/55">{s.helper}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tier distribution meter */}
          <div className="relative mt-6">
            <div className="flex h-2 overflow-hidden rounded-full bg-white/12">
              {["bg-white/30", "bg-gold/70", "bg-gold"].map((tone, i) => (
                <span key={tone} className={tone} style={{ width: `${tierSplit[i]! * 100}%` }} />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11.5px] text-primary-foreground/60">
              {["Tier 0", "Tier 1", "Tier 2"].map((label, i) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <span
                    className={`size-2 rounded-full ${
                      i === 0 ? "bg-white/30" : i === 1 ? "bg-gold/70" : "bg-gold"
                    }`}
                  />
                  {label} · {Math.round(tierSplit[i]! * 100)}%
                </span>
              ))}
            </div>
          </div>
        </section>

        <Panel className="overflow-hidden">
          <div className="-m-5">
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3 border-b border-border/60 bg-muted/25 px-5 py-4">
              <label className="flex min-w-[16rem] flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm transition focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/10">
                <Search className="size-4 shrink-0 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, email, phone or user ID"
                  className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
                />
                {query ? (
                  <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                    <X className="size-4 text-muted-foreground" />
                  </button>
                ) : null}
              </label>

              <div className="flex rounded-xl border border-border bg-card p-1 shadow-sm">
                {TIER_OPTIONS.map((o) => (
                  <button
                    key={String(o.value)}
                    type="button"
                    onClick={() => setTier(o.value)}
                    className={`rounded-lg px-3 py-1.5 text-[12.5px] font-bold transition ${
                      tier === o.value
                        ? "bg-brand text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {o.value === "all" ? "All" : `T${o.value}`}
                  </button>
                ))}
              </div>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className="rounded-xl border border-border bg-card px-3 py-2.5 text-[13px] font-semibold shadow-sm outline-none"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="grid size-10 place-items-center rounded-xl bg-brand text-primary-foreground shadow-sm transition hover:opacity-90"
                aria-label="More filters"
              >
                <SlidersHorizontal className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const n = downloadCsv(
                    "kipit-users",
                    ["Customer", "Email", "Phone", "Tier", "Status", ...(showAum ? ["Portfolio"] : []), "Joined", "ID"],
                    rows.map((u) => [
                      u.name,
                      u.email,
                      u.phone,
                      u.tier,
                      u.status,
                      ...(showAum ? [portfolioValue(u)] : []),
                      u.joined,
                      u.id,
                    ]),
                  );
                  toast.success(`Downloaded ${n} rows`);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-[13px] font-semibold shadow-sm transition hover:bg-muted"
              >
                <Download className="size-4" />
                Export
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[64rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-border/60 text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Tier</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Portfolio value</th>
                    <th className="px-5 py-3">Joined</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => {
                    const value = portfolioValue(u);
                    return (
                      <tr
                        key={u.id}
                        className="group border-b border-border/50 transition last:border-0 hover:bg-brand/[0.035]"
                      >
                        <td className="relative px-5 py-4">
                          <span className="absolute inset-y-0 left-0 w-[3px] scale-y-0 rounded-r-full bg-gold transition group-hover:scale-y-100" />
                          <Link
                            to="/users/$userId"
                            params={{ userId: u.id }}
                            className="flex items-center gap-3"
                          >
                            <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-brand-gradient text-[12px] font-extrabold text-primary-foreground ring-2 ring-brand/10">
                              {u.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-2 ring-card ${
                                  u.status === "active"
                                    ? "bg-emerald-500"
                                    : u.status === "frozen"
                                      ? "bg-destructive"
                                      : u.status === "pending"
                                        ? "bg-gold"
                                        : "bg-muted-foreground/50"
                                }`}
                              />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-[14px] font-bold tracking-[-0.01em]">
                                {u.name}
                              </span>
                              <span className="block font-mono text-[11px] text-muted-foreground">
                                {u.id}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-5 py-4">
                          <span className="block truncate text-[13px]">{u.email}</span>
                          <span className="block text-[11.5px] text-muted-foreground">{u.phone}</span>
                        </td>
                        <td className="px-5 py-4">
                          <TierPill tier={u.tier} />
                        </td>
                        <td className="px-5 py-4">
                          <StatusPill status={u.status} />
                        </td>
                        <td className="px-5 py-4">
                          <span className="block text-[13.5px] font-bold tabular-nums">
                            {naira(value)}
                          </span>
                          <span className="mt-1.5 block h-1 w-28 overflow-hidden rounded-full bg-muted">
                            <span
                              className="block h-full rounded-full bg-brand/70"
                              style={{ width: `${Math.max(2, (value / maxValue) * 100)}%` }}
                            />
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[13px] text-muted-foreground">{u.joined}</td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            to="/users/$userId"
                            params={{ userId: u.id }}
                            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-bold transition group-hover:border-brand group-hover:bg-brand group-hover:text-primary-foreground"
                          >
                            Open
                            <ChevronRight className="size-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {rows.length === 0 ? (
                <div className="grid place-items-center gap-2 px-5 py-16 text-center">
                  <Users2 className="size-8 text-muted-foreground" />
                  <p className="text-[14px] font-bold">No users match these filters</p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setTier("all");
                      setStatus("all");
                    }}
                    className="text-[13px] font-bold text-brand underline-offset-4 hover:underline"
                  >
                    Reset filters
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-5 py-3.5 text-[12px] text-muted-foreground">
              <span>
                Showing {rows.length} of {users.length} users
                {filtered ? " (filtered)" : ""}
              </span>
              <span>Live directory</span>
            </div>
          </div>
        </Panel>
      </div>


      {/* Full filter dialog */}
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="sm:max-w-[26rem]">
          <DialogHeader>
            <DialogTitle>Filter users</DialogTitle>
            <DialogDescription>Narrow the directory by verification tier and account status.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                KYC tier
              </p>
              <div className="flex flex-wrap gap-2">
                {TIER_OPTIONS.map((o) => (
                  <button
                    key={String(o.value)}
                    type="button"
                    onClick={() => setTier(o.value)}
                    className={`rounded-lg px-3 py-1.5 text-[12.5px] font-bold transition ${
                      tier === o.value
                        ? "bg-brand text-primary-foreground"
                        : "border border-border bg-card hover:bg-muted"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Account status
              </p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setStatus(o.value)}
                    className={`rounded-lg px-3 py-1.5 text-[12.5px] font-bold transition ${
                      status === o.value
                        ? "bg-brand text-primary-foreground"
                        : "border border-border bg-card hover:bg-muted"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => {
                  setTier("all");
                  setStatus("all");
                  setQuery("");
                }}
                className="text-[13px] font-bold text-muted-foreground underline-offset-4 hover:underline"
              >
                Reset all
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-lg bg-brand px-4 py-2 text-[13px] font-bold text-primary-foreground"
              >
                Show {rows.length} users
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
