import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download, Lock, LockOpen, Search, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { downloadCsv } from "@/lib/csv-export";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat, TierPill } from "@/components/kipit/AdminBits";
import {
  hydrateAdminUsersFromApi,
  portfolioValue,
  type AdminUser,
} from "@/lib/admin-users-data";
import { naira } from "@/lib/admin-data";

export const Route = createFileRoute("/compliance_/frozen")({
  head: () => ({
    meta: [
      { title: "Frozen accounts — Kipit Admin Console" },
      {
        name: "description",
        content:
          "ADM-034 restricted access register: every frozen Kipit account, the reason, balances held and who applied the restriction.",
      },
      { property: "og:title", content: "Frozen accounts — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Register of restricted Kipit customer accounts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FrozenAccounts,
});

function FrozenAccounts() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    void hydrateAdminUsersFromApi().then(setUsers);
  }, []);

  const frozen = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => u.status === "frozen")
      .filter((u) => (q ? [u.name, u.email, u.id].some((f) => f.toLowerCase().includes(q)) : true));
  }, [query, users]);

  const held = frozen.reduce((sum, u) => sum + portfolioValue(u), 0);

  return (
    <AdminShell title="Frozen accounts" subtitle="ADM-034 · restricted access register">
      <Link
        to="/compliance"
        className="inline-flex items-center gap-1.5 text-[13px] font-bold text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Compliance & KYC
      </Link>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Frozen accounts"
          value={String(frozen.length)}
          helper="Funding, investing and payouts blocked"
          tone="brand"
          icon={Lock}
        />
        <Stat label="Balances held" value={naira(held)} helper="Across restricted accounts" tone="gold" />
        <Stat label="Oldest restriction" value="—" helper="Review target is 5 working days" icon={ShieldAlert} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search frozen accounts"
            className="w-60 bg-transparent text-[13px] outline-none"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            const n = downloadCsv(
              "kipit-frozen-accounts",
              ["Name", "Email", "ID", "Tier", "Reason", "Held", "Frozen at", "By"],
              frozen.map((u) => [
                u.name,
                u.email,
                u.id,
                u.tier,
                u.freeze?.reason ?? "Compliance review",
                portfolioValue(u),
                u.freeze?.date ?? "",
                u.freeze?.by ?? "",
              ]),
            );
            toast.success(`Downloaded ${n} rows`);
          }}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-[12.5px] font-bold transition hover:bg-muted"
        >
          <Download className="size-4" /> Export
        </button>
      </div>

      <Panel className="mt-4" title="Restricted customers" eyebrow="Live register" icon={Lock}>
        {frozen.length === 0 ? (
          <div className="grid place-items-center py-12 text-center">
            <LockOpen className="size-8 text-muted-foreground" />
            <p className="mt-3 font-display text-[16px] font-extrabold">No frozen accounts</p>
            <p className="text-[13px] text-muted-foreground">Every customer currently has full access.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {frozen.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-destructive/10 text-[12px] font-extrabold text-destructive">
                  {u.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                <div className="min-w-[12rem] flex-1">
                  <p className="text-[13.5px] font-bold">{u.name}</p>
                  <p className="text-[12.5px] text-muted-foreground">
                    {u.email} · {u.id}
                  </p>
                </div>
                <div className="min-w-[13rem]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Reason
                  </p>
                  <p className="text-[13px] font-semibold">
                    {u.freeze?.reason ?? "Compliance review"}
                  </p>
                </div>
                <TierPill tier={u.tier} />
                <div className="text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Held
                  </p>
                  <p className="text-[13.5px] font-extrabold">{naira(portfolioValue(u))}</p>
                </div>
                <Link
                  to="/users/$userId/frozen"
                  params={{ userId: u.id }}
                  className="rounded-lg bg-brand px-3 py-2 text-[12.5px] font-bold text-primary-foreground transition hover:opacity-90"
                >
                  Review restriction
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AdminShell>
  );
}
