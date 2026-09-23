import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Mail, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel } from "@/components/kipit/AdminBits";
import {
  ADMIN_ROLES,
  PERMISSION_GROUPS,
  roleById,
  type AdminRoleId,
} from "@/lib/admin-team-data";

export const Route = createFileRoute("/team_/new")({
  head: () => ({
    meta: [
      { title: "Add admin user — Kipit Admin Console" },
      {
        name: "description",
        content: "Invite a new Kipit console operator, choose their role and confirm access rights.",
      },
      { property: "og:title", content: "Add admin user — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Invite a new Kipit console operator and set their permissions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewAdminPage,
});

const field =
  "h-10 w-full rounded-lg border border-border bg-card px-3 text-[13.5px] outline-none transition focus:border-brand";

function NewAdminPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Operations");
  const [role, setRole] = useState<AdminRoleId>("support");
  const [twoFactor, setTwoFactor] = useState(true);
  const [makerChecker, setMakerChecker] = useState(false);
  const [sent, setSent] = useState(false);
  const [touched, setTouched] = useState(false);

  const selected = roleById(role);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const valid = name.trim().length > 2 && emailValid;

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    const roleMap: Record<string, string> = {
      "global-admin": "GLOBAL",
      operations: "OPERATIONS",
      compliance: "COMPLIANCE",
      finance: "OPERATIONS",
      support: "OPERATIONS",
      "read-only": "MARKETING",
    };
    void (async () => {
      try {
        const { createAdminTeamMember } = await import("@/lib/admin-api");
        const created = await createAdminTeamMember({
          email: email.trim().toLowerCase(),
          name: name.trim(),
          role: roleMap[role] ?? "OPERATIONS",
        });
        setSent(true);
        const creds = [
          created.tempPassword ? `Temp password: ${created.tempPassword}` : null,
          created.tempPin ? `Unlock PIN: ${created.tempPin}` : null,
        ]
          .filter(Boolean)
          .join(" · ");
        toast.success(`Invitation sent to ${email.trim()}`, {
          description: creds || undefined,
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not invite admin");
      }
    })();
  };

  if (sent) {
    return (
      <AdminShell title="Add admin user" subtitle="ADM-121 · invitation sent">
        <Panel className="mx-auto max-w-xl text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-500/12 text-emerald-600">
            <Check className="size-7" strokeWidth={2.4} />
          </span>
          <h2 className="mt-4 font-display text-[20px] font-extrabold tracking-[-0.02em]">
            Invitation sent
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] text-muted-foreground">
            {name.trim()} will receive a secure link at {email.trim()} to set a password and enrol
            two-factor authentication before first sign-in.
          </p>

          <div className="mt-5 rounded-xl border border-border/70 bg-muted/30 p-4 text-left text-[13px]">
            <Row label="Role" value={selected?.name ?? role} />
            <Row label="Team" value={department} />
            <Row label="Two-factor" value={twoFactor ? "Required" : "Optional"} />
            <Row label="Maker-checker" value={makerChecker ? "Can approve" : "Maker only"} />
          </div>

          <div className="mt-5 flex justify-center gap-2">
            <Link
              to="/team"
              className="rounded-lg bg-brand px-4 py-2.5 text-[13px] font-bold text-primary-foreground"
            >
              Back to admin users
            </Link>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setName("");
                setEmail("");
                setPhone("");
                setTouched(false);
              }}
              className="rounded-lg border border-border px-4 py-2.5 text-[13px] font-bold transition hover:bg-muted"
            >
              Invite another
            </button>
          </div>
        </Panel>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Add admin user" subtitle="ADM-121 · invite a console operator">
      <button
        type="button"
        onClick={() => navigate({ to: "/team" })}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Admin users
      </button>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <Panel title="Operator details" eyebrow="Step 1" icon={UserPlus}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold">Full name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Chioma Eze"
                  className={field}
                />
                {touched && name.trim().length <= 2 ? (
                  <span className="mt-1 block text-[11.5px] font-semibold text-destructive">
                    Enter the operator's full name.
                  </span>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold">Work email</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@kipit.com"
                  className={field}
                />
                {touched && !emailValid ? (
                  <span className="mt-1 block text-[11.5px] font-semibold text-destructive">
                    Enter a valid work email address.
                  </span>
                ) : null}
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold">Phone (optional)</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className={field}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold">Team</span>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className={field}
                >
                  {["Executive", "Operations", "Risk & Compliance", "Finance", "Customer care", "Internal audit"].map(
                    (d) => (
                      <option key={d}>{d}</option>
                    ),
                  )}
                </select>
              </label>
            </div>
          </Panel>

          <Panel title="Role" eyebrow="Step 2" icon={ShieldCheck}>
            <div className="grid gap-3 sm:grid-cols-2">
              {ADMIN_ROLES.map((r) => {
                const active = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`rounded-xl border p-3.5 text-left transition ${
                      active
                        ? "border-brand bg-brand/5 ring-1 ring-brand/25"
                        : "border-border/80 hover:border-brand/30 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13.5px] font-extrabold">{r.name}</p>
                      {active ? <Check className="size-4 text-brand" /> : null}
                    </div>
                    <p className="mt-1 text-[12px] leading-snug text-muted-foreground">{r.summary}</p>
                    <p className="mt-2 text-[11.5px] font-bold text-brand">
                      {r.grants.length} permissions
                    </p>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel title="Security policy" eyebrow="Step 3" icon={ShieldCheck}>
            <Toggle
              label="Require two-factor authentication"
              helper="Operator must enrol an authenticator app at first sign-in."
              value={twoFactor}
              onChange={setTwoFactor}
            />
            <Toggle
              label="Allow maker-checker approvals"
              helper="Can act as the second pair of eyes on rate and adjustment requests."
              value={makerChecker}
              onChange={setMakerChecker}
            />
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Access preview" eyebrow="What they'll be able to do" icon={ShieldCheck}>
            <p className="text-[13px] font-bold">{selected?.name}</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">{selected?.summary}</p>
            <div className="mt-3 space-y-3">
              {PERMISSION_GROUPS.map((group) => {
                const granted = group.permissions.filter((p) => selected?.grants.includes(p.id));
                if (granted.length === 0) return null;
                return (
                  <div key={group.id}>
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      {group.label}
                    </p>
                    <ul className="mt-1 space-y-1">
                      {granted.map((p) => (
                        <li key={p.id} className="flex items-start gap-1.5 text-[12.5px]">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                          <span>{p.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Panel>

          <div className="rounded-2xl border border-border/80 bg-card p-4">
            <button
              type="button"
              onClick={submit}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-[13.5px] font-bold text-primary-foreground transition hover:opacity-95"
            >
              <Mail className="size-4" /> Send invitation
            </button>
            <p className="mt-2 text-center text-[11.5px] text-muted-foreground">
              Creating an admin user is written to the global audit log.
            </p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function Toggle({
  label,
  helper,
  value,
  onChange,
}: {
  label: string;
  helper: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-start justify-between gap-4 border-b border-border/60 py-3 text-left last:border-0"
    >
      <span className="min-w-0">
        <span className="block text-[13px] font-bold">{label}</span>
        <span className="mt-0.5 block text-[12px] text-muted-foreground">{helper}</span>
      </span>
      <span
        className={`mt-0.5 grid h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition ${
          value ? "bg-brand" : "bg-muted-foreground/25"
        }`}
      >
        <span
          className={`size-5 rounded-full bg-white shadow transition ${value ? "translate-x-5" : ""}`}
        />
      </span>
    </button>
  );
}
