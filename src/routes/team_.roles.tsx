import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Lock, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import {
  ADMIN_ROLES,
  ALL_PERMISSION_IDS,
  PERMISSION_GROUPS,
  hydrateAdminTeamFromApi,
  type AdminRoleId,
} from "@/lib/admin-team-data";

export const Route = createFileRoute("/team_/roles")({
  head: () => ({
    meta: [
      { title: "Roles & permissions — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Define what each Kipit console role can see and do across users, compliance, money movement and products.",
      },
      { property: "og:title", content: "Roles & permissions — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Manage Kipit admin roles and their permission grants.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RolesPage,
});

function RolesPage() {
  const [selectedId, setSelectedId] = useState<AdminRoleId>("operations");
  const [grants, setGrants] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(ADMIN_ROLES.map((r) => [r.id, [...r.grants]])),
  );
  const [dirty, setDirty] = useState(false);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    void hydrateAdminTeamFromApi().then((members) => {
      const counts: Record<string, number> = {};
      for (const m of members) {
        counts[m.role] = (counts[m.role] ?? 0) + 1;
      }
      setMemberCounts(counts);
    });
  }, []);

  const role = ADMIN_ROLES.find((r) => r.id === selectedId)!;
  const current = grants[selectedId] ?? [];
  const locked = role.system;
  const operatorsAssigned = useMemo(
    () => Object.values(memberCounts).reduce((s, n) => s + n, 0),
    [memberCounts],
  );

  const coverage = useMemo(
    () => Math.round((current.length / ALL_PERMISSION_IDS.length) * 100),
    [current.length],
  );

  const toggle = (id: string) => {
    if (locked) {
      toast.error(`${role.name} is a system role and cannot be edited`);
      return;
    }
    setGrants((prev) => {
      const list = prev[selectedId] ?? [];
      return {
        ...prev,
        [selectedId]: list.includes(id) ? list.filter((p) => p !== id) : [...list, id],
      };
    });
    setDirty(true);
  };

  return (
    <AdminShell title="Roles & permissions" subtitle="ADM-122 · what each role can do">
      <Link
        to="/team"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Admin users
      </Link>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Roles defined"
          value={String(ADMIN_ROLES.length)}
          helper="2 system roles, 4 editable"
          tone="brand"
          icon={ShieldCheck}
        />
        <Stat
          label="Permissions available"
          value={String(ALL_PERMISSION_IDS.length)}
          helper="Across 6 console areas"
          icon={Lock}
        />
        <Stat
          label="Operators assigned"
          value={String(operatorsAssigned)}
          helper="From live admin directory"
          tone="gold"
          icon={Users}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <Panel title="Roles" eyebrow="Select to edit" className="h-fit">
          <ul className="space-y-2">
            {ADMIN_ROLES.map((r) => {
              const active = r.id === selectedId;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      active
                        ? "border-brand bg-brand/5 ring-1 ring-brand/25"
                        : "border-border/80 hover:border-brand/30 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13.5px] font-extrabold">{r.name}</p>
                      {r.system ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          <Lock className="size-3" /> System
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
                      {r.summary}
                    </p>
                    <p className="mt-2 text-[11.5px] font-bold text-brand">
                      {memberCounts[r.id] ?? 0} operators · {(grants[r.id] ?? []).length} permissions
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel
          title={`${role.name} permissions`}
          eyebrow={locked ? "System role · read only" : "Tick to grant, untick to revoke"}
          icon={ShieldCheck}
          action={
            <button
              type="button"
              disabled={!dirty || locked}
              onClick={() => {
                setDirty(false);
                toast.success(`${role.name} permissions updated`);
              }}
              className={`rounded-lg px-3.5 py-2 text-[12.5px] font-bold transition ${
                dirty && !locked
                  ? "bg-brand text-primary-foreground hover:opacity-95"
                  : "cursor-not-allowed bg-muted text-muted-foreground"
              }`}
            >
              Save changes
            </button>
          }
        >
          <div className="mb-4 rounded-xl border border-border/70 bg-muted/30 p-3">
            <div className="flex items-center justify-between text-[12.5px] font-bold">
              <span>Access coverage</span>
              <span className="text-brand">{coverage}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-brand" style={{ width: `${coverage}%` }} />
            </div>
            <p className="mt-2 text-[12px] text-muted-foreground">
              {current.length} of {ALL_PERMISSION_IDS.length} permissions granted.
            </p>
          </div>

          <div className="space-y-5">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.id}>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {group.label}
                </p>
                <div className="mt-2 grid gap-2 lg:grid-cols-2">
                  {group.permissions.map((p) => {
                    const on = current.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggle(p.id)}
                        className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                          on
                            ? "border-brand/40 bg-brand/5"
                            : "border-border/70 hover:border-brand/25 hover:bg-muted/40"
                        } ${locked ? "opacity-80" : ""}`}
                      >
                        <span
                          className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border ${
                            on
                              ? "border-brand bg-brand text-primary-foreground"
                              : "border-border bg-card"
                          }`}
                        >
                          {on ? <Check className="size-3.5" strokeWidth={3} /> : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-bold">{p.label}</span>
                          <span className="mt-0.5 block text-[12px] text-muted-foreground">
                            {p.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AdminShell>
  );
}
