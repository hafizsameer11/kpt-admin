import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, KeyRound, ShieldAlert, Search, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { downloadCsv } from "@/lib/csv-export";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import {
  ADMIN_ROLES,
  ADMIN_STATUS_LABEL,
  ADMIN_STATUS_TONE,
  hydrateAdminTeamFromApi,
  roleById,
  type AdminMember,
  type AdminRoleId,
  type AdminStatus,
} from "@/lib/admin-team-data";

export const Route = createFileRoute("/team")({
  head: () => ({
    meta: [
      { title: "Admin users — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Manage Kipit console operators: roles, two-factor status, invitations and suspensions.",
      },
      { property: "og:title", content: "Admin users — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Directory of Kipit console operators and their access levels.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminTeamPage,
});

const TABS: ("all" | AdminStatus)[] = ["all", "active", "invited", "suspended"];

function AdminTeamPage() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [tab, setTab] = useState<"all" | AdminStatus>("all");
  const [role, setRole] = useState<"all" | AdminRoleId>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void hydrateAdminTeamFromApi().then(setMembers);
  }, []);

  const teamTotals = useMemo(
    () => ({
      total: members.length,
      active: members.filter((m) => m.status === "active").length,
      invited: members.filter((m) => m.status === "invited").length,
      suspended: members.filter((m) => m.status === "suspended").length,
    }),
    [members],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (tab !== "all" && m.status !== tab) return false;
      if (role !== "all" && m.role !== role) return false;
      if (!q) return true;
      return [m.name, m.email, m.department].some((f) => f.toLowerCase().includes(q));
    });
  }, [members, tab, role, query]);

  return (
    <AdminShell title="Admin users" subtitle="ADM-120 · console operators & access">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Console operators"
          value={String(teamTotals.total)}
          helper={`${teamTotals.active} active right now`}
          tone="brand"
          icon={Users}
        />
        <Stat
          label="Pending invites"
          value={String(teamTotals.invited)}
          helper="Awaiting first sign-in"
          tone="gold"
          icon={UserPlus}
        />
        <Stat
          label="Suspended"
          value={String(teamTotals.suspended)}
          helper="Access revoked, records kept"
          icon={ShieldAlert}
        />
        <Stat
          label="Without 2FA"
          value={String(members.filter((m) => !m.twoFactor).length)}
          helper="Policy requires two-factor"
          icon={KeyRound}
        />
      </div>

      <Panel className="mt-5 overflow-hidden">
        <div className="-m-5">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/70 px-5 py-4">
            <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-md px-3 py-1.5 text-[12.5px] font-bold transition ${
                    tab === t
                      ? "bg-brand text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "all" ? "All" : ADMIN_STATUS_LABEL[t]}
                </button>
              ))}
            </div>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "all" | AdminRoleId)}
              className="h-9 rounded-lg border border-border bg-muted/40 px-2.5 text-[12.5px] font-bold outline-none"
            >
              <option value="all">All roles</option>
              {ADMIN_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <label className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email or team…"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                const n = downloadCsv(
                  "kipit-admin-team",
                  ["Name", "Email", "Role", "Team", "2FA", "Last active", "Status"],
                  rows.map((m) => [
                    m.name,
                    m.email,
                    roleById(m.role)?.name ?? m.role,
                    m.department,
                    m.twoFactor ? "on" : "off",
                    m.lastActive,
                    ADMIN_STATUS_LABEL[m.status],
                  ]),
                );
                toast.success(`Downloaded ${n} rows`);
              }}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[12.5px] font-bold transition hover:bg-muted"
            >
              <Download className="size-4" /> Export
            </button>

            <Link
              to="/team/roles"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-[12.5px] font-bold transition hover:bg-muted"
            >
              Roles & permissions
            </Link>

            <Link
              to="/team/new"
              className="flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-[12.5px] font-bold text-primary-foreground transition hover:opacity-95"
            >
              <UserPlus className="size-4" /> Add admin
            </Link>
          </div>

          <table className="w-full text-left">
            <thead className="bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-2.5">Operator</th>
                <th className="px-5 py-2.5">Role</th>
                <th className="px-5 py-2.5">Team</th>
                <th className="px-5 py-2.5">Security</th>
                <th className="px-5 py-2.5">Last active</th>
                <th className="px-5 py-2.5">Status</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/10 text-[12px] font-extrabold text-brand">
                        {m.name
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-bold">{m.name}</p>
                        <p className="truncate text-[12px] text-muted-foreground">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[13px] font-semibold">
                    {roleById(m.role)?.name ?? m.role}
                  </td>
                  <td className="px-5 py-3 text-[13px] text-muted-foreground">{m.department}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ring-1 ${
                        m.twoFactor
                          ? "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20"
                          : "bg-destructive/10 text-destructive ring-destructive/20"
                      }`}
                    >
                      {m.twoFactor ? "2FA on" : "2FA off"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-muted-foreground">{m.lastActive}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${ADMIN_STATUS_TONE[m.status]}`}
                    >
                      {ADMIN_STATUS_LABEL[m.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to="/team/$adminId"
                      params={{ adminId: m.id }}
                      className="text-[12.5px] font-bold text-brand hover:underline"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-[13px] text-muted-foreground">
                    No admin users match these filters.
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
