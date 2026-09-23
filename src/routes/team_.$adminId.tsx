import { useEffect, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  Check,
  KeyRound,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import {
  ADMIN_STATUS_LABEL,
  ADMIN_STATUS_TONE,
  PERMISSION_GROUPS,
  hydrateAdminAuditFromApi,
  hydrateAdminTeamFromApi,
  memberById,
  roleById,
  type AdminMember,
  type AdminStatus,
  type AuditEntry,
  getLiveAuditLog,
} from "@/lib/admin-team-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/team_/$adminId")({
  head: () => ({
    meta: [
      { title: "Admin profile — Kipit Admin Console" },
      {
        name: "description",
        content: "Review a Kipit console operator: role, permissions, security posture and activity.",
      },
      { property: "og:title", content: "Admin profile — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Manage a Kipit console operator's role, security and access.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminMemberPage,
});

function AdminMemberPage() {
  const { adminId } = useParams({ from: "/team_/$adminId" });
  const [member, setMember] = useState<AdminMember | null | undefined>(undefined);
  const [activity, setActivity] = useState<AuditEntry[]>([]);
  const [status, setStatus] = useState<AdminStatus>("active");
  const [confirm, setConfirm] = useState<null | "suspend" | "restore" | "remove">(null);

  useEffect(() => {
    void Promise.all([hydrateAdminTeamFromApi(), hydrateAdminAuditFromApi()]).then(([members]) => {
      const found = members.find((m) => m.id === adminId) ?? memberById(adminId) ?? null;
      setMember(found);
      if (found) {
        setStatus(found.status);
        setActivity(getLiveAuditLog().filter((e) => e.actor === found.name).slice(0, 6));
      }
    });
  }, [adminId]);

  if (member === undefined) {
    return (
      <AdminShell title="Admin profile" subtitle="ADM-120">
        <Panel>
          <p className="text-[13px] text-muted-foreground">Loading…</p>
        </Panel>
      </AdminShell>
    );
  }

  if (!member) {
    return (
      <AdminShell title="Admin profile" subtitle="ADM-120">
        <Panel className="text-center">
          <p className="text-[14px] font-bold">This admin user no longer exists.</p>
          <Link
            to="/team"
            className="mt-4 inline-block rounded-lg bg-brand px-4 py-2.5 text-[13px] font-bold text-primary-foreground"
          >
            Back to admin users
          </Link>
        </Panel>
      </AdminShell>
    );
  }

  const role = roleById(member.role);

  return (
    <AdminShell title={member.name} subtitle={`ADM-120 · ${role?.name ?? member.role}`}>
      <Link
        to="/team"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Admin users
      </Link>

      <div className="overflow-hidden rounded-2xl bg-brand-gradient p-6 text-primary-foreground">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-14 place-items-center rounded-full bg-gold text-[16px] font-extrabold text-gold-foreground">
            {member.name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[22px] font-extrabold tracking-[-0.02em]">
              {member.name}
            </h2>
            <p className="text-[13px] text-primary-foreground/70">
              {member.email} · {member.department}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[11.5px] font-bold ring-1 ${ADMIN_STATUS_TONE[status]}`}
          >
            {ADMIN_STATUS_LABEL[status]}
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          <HeroCell label="Role" value={role?.name ?? member.role} />
          <HeroCell label="Two-factor" value={member.twoFactor ? "Enrolled" : "Not enrolled"} />
          <HeroCell label="Maker-checker" value={member.makerChecker ? "Approver" : "Maker only"} />
          <HeroCell label="Last active" value={member.lastActive} />
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Actions (30 days)"
          value={String(member.actions30d)}
          helper="Recorded in the audit log"
          icon={Activity}
        />
        <Stat
          label="Permissions"
          value={String(role?.grants.length ?? 0)}
          helper={`Inherited from ${role?.name}`}
          tone="gold"
          icon={ShieldCheck}
        />
        <Stat
          label="Account created"
          value={member.createdAt}
          helper={`By ${member.createdBy}`}
          icon={KeyRound}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <Panel title="Effective permissions" eyebrow={role?.summary ?? "Role grants"} icon={ShieldCheck}>
            <div className="grid gap-4 sm:grid-cols-2">
              {PERMISSION_GROUPS.map((group) => {
                const granted = group.permissions.filter((p) => role?.grants.includes(p.id));
                return (
                  <div key={group.id}>
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      {group.label}
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {group.permissions.map((p) => {
                        const on = granted.includes(p);
                        return (
                          <li
                            key={p.id}
                            className={`flex items-start gap-1.5 text-[12.5px] ${
                              on ? "" : "text-muted-foreground/60 line-through"
                            }`}
                          >
                            <Check
                              className={`mt-0.5 size-3.5 shrink-0 ${
                                on ? "text-emerald-600" : "text-muted-foreground/40"
                              }`}
                            />
                            <span>{p.label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
            <Link
              to="/team/roles"
              className="mt-4 inline-block text-[12.5px] font-bold text-brand hover:underline"
            >
              Edit the {role?.name} role →
            </Link>
          </Panel>

          <Panel title="Recent activity" eyebrow="From the global audit log" icon={Activity}>
            {activity.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                No console activity recorded for this operator yet.
              </p>
            ) : (
              <ul>
                {activity.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-start justify-between gap-4 border-b border-border/60 py-3 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold">{e.action}</p>
                      <p className="truncate text-[12px] text-muted-foreground">{e.target}</p>
                    </div>
                    <span className="shrink-0 text-[12px] text-muted-foreground">
                      {e.date} · {e.at}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              to="/audit"
              className="mt-3 inline-block text-[12.5px] font-bold text-brand hover:underline"
            >
              View full audit log →
            </Link>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Security" icon={KeyRound}>
            <Line label="Work email" value={member.email} />
            <Line label="Phone" value={member.phone} />
            <Line label="Two-factor" value={member.twoFactor ? "Authenticator app" : "Not set up"} />
            <Line label="Created" value={`${member.createdAt} by ${member.createdBy}`} />
          </Panel>

          <Panel title="Actions">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => toast.success(`Password reset link sent to ${member.email}`)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-[13px] font-bold transition hover:bg-muted"
              >
                <Mail className="size-4" /> Send password reset
              </button>
              <button
                type="button"
                onClick={() => toast.success("Two-factor enrolment reset — required at next sign-in")}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-[13px] font-bold transition hover:bg-muted"
              >
                <KeyRound className="size-4" /> Reset two-factor
              </button>
              {status === "suspended" ? (
                <button
                  type="button"
                  onClick={() => setConfirm("restore")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-[13px] font-bold text-primary-foreground transition hover:opacity-95"
                >
                  <ShieldCheck className="size-4" /> Restore access
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirm("suspend")}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 px-4 py-2.5 text-[13px] font-bold text-destructive transition hover:bg-destructive/5"
                >
                  <ShieldAlert className="size-4" /> Suspend access
                </button>
              )}
              <button
                type="button"
                onClick={() => setConfirm("remove")}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-bold text-muted-foreground transition hover:bg-muted"
              >
                <Trash2 className="size-4" /> Remove admin user
              </button>
            </div>
          </Panel>
        </div>
      </div>

      <Dialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirm === "remove"
                ? "Remove admin user?"
                : confirm === "restore"
                  ? "Restore console access?"
                  : "Suspend console access?"}
            </DialogTitle>
            <DialogDescription>
              {confirm === "remove"
                ? `${member.name} will lose console access immediately. Their audit history is retained.`
                : confirm === "restore"
                  ? `${member.name} will be able to sign in again with their existing role.`
                  : `${member.name} will be signed out of all sessions and blocked from signing in.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setConfirm(null)}
              className="rounded-lg border border-border px-4 py-2.5 text-[13px] font-bold transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  try {
                    const { updateAdminTeamMember } = await import("@/lib/admin-api");
                    if (confirm === "restore") {
                      await updateAdminTeamMember(member.id, { active: true });
                      setStatus("active");
                      toast.success(`${member.name} restored`);
                    } else if (confirm === "suspend") {
                      await updateAdminTeamMember(member.id, { active: false });
                      setStatus("suspended");
                      toast.success(`${member.name} suspended`);
                    } else {
                      await updateAdminTeamMember(member.id, { active: false });
                      toast.success(`${member.name} removed from the console`);
                    }
                    setConfirm(null);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not update admin");
                  }
                })();
              }}
              className={`rounded-lg px-4 py-2.5 text-[13px] font-bold text-primary-foreground transition hover:opacity-95 ${
                confirm === "restore" ? "bg-brand" : "bg-destructive"
              }`}
            >
              {confirm === "remove" ? "Remove" : confirm === "restore" ? "Restore" : "Suspend"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function HeroCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 p-3">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-primary-foreground/55">
        {label}
      </p>
      <p className="mt-1 text-[14px] font-extrabold">{value}</p>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2.5 text-[13px] last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-bold">{value}</span>
    </div>
  );
}
