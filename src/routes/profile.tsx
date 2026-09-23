import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  KeyRound,
  LogOut,
  Mail,
  MonitorSmartphone,
  Phone,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import { endAdminSession, getAdminSession } from "@/lib/admin-auth";
import { hydrateAdminAuditFromApi, getLiveAuditLog } from "@/lib/admin-team-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My profile & preferences — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Manage your Kipit operator profile: password, two-factor device, notification preferences and signed-in sessions.",
      },
      { property: "og:title", content: "My profile & preferences — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Operator security and preference settings for the Kipit console.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminProfilePage,
});

const PREFERENCES = [
  { id: "pf-wd", label: "Withdrawal approvals", helper: "Every request above your limit", on: true },
  { id: "pf-aml", label: "AML escalations", helper: "Alerts assigned to you", on: true },
  { id: "pf-recon", label: "Reconciliation variances", helper: "Daily unmatched summary", on: true },
  { id: "pf-rates", label: "Rate approvals", helper: "Proposals awaiting a checker", on: false },
  { id: "pf-digest", label: "Daily operations digest", helper: "07:00 email summary", on: true },
];

function AdminProfilePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [prefs, setPrefs] = useState(PREFERENCES);
  const [revoked, setRevoked] = useState<string[]>([]);
  const [activity, setActivity] = useState<{ id: string; action: string; when: string }[]>([]);
  const [pwOpen, setPwOpen] = useState(false);
  const [twoFaOpen, setTwoFaOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getAdminSession();
    if (session) {
      setName(session.name);
      setRole(session.role);
      setEmail(session.email);
    }
    void hydrateAdminAuditFromApi().then(() => {
      const emailLower = (getAdminSession()?.email || "").toLowerCase();
      const nameLower = (getAdminSession()?.name || "").toLowerCase();
      setActivity(
        getLiveAuditLog()
          .filter(
            (e) =>
              e.actor.toLowerCase() === emailLower ||
              e.actor.toLowerCase() === nameLower ||
              e.actor.toLowerCase().includes(emailLower),
          )
          .slice(0, 6)
          .map((e) => ({ id: e.id, action: e.action, when: e.at })),
      );
    });
  }, []);

  const activeSessions = [
    {
      id: "current",
      device: "This browser",
      location: "—",
      ip: "—",
      lastSeen: "Active now",
      current: true,
    },
  ].filter((s) => !revoked.includes(s.id));

  return (
    <AdminShell title="My profile & preferences" subtitle="Operator security, alerts and sessions">
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <section className="relative overflow-hidden rounded-3xl bg-brand-gradient p-6 text-primary-foreground shadow-[0_24px_60px_-38px_rgba(11,29,58,0.9)]">
            <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-gold/18 blur-3xl" />
            <div className="relative flex flex-wrap items-center gap-4">
              <span className="grid size-16 place-items-center rounded-full bg-gold text-[18px] font-extrabold text-gold-foreground">
                {name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-[24px] font-extrabold tracking-[-0.02em]">{name}</h2>
                <p className="text-[13px] text-primary-foreground/70">{role} · Kipit console</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-primary-foreground/70">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="size-3.5" /> {email}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="size-3.5" /> {phone}
                  </span>
                </div>
              </div>
              <div className="ml-auto rounded-2xl bg-white/10 px-4 py-3 text-right ring-1 ring-white/15">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/55">
                  Two-factor
                </p>
                <p className="mt-1 font-display text-[18px] font-extrabold">Authenticator app</p>
              </div>
            </div>
          </section>

          <Panel title="Profile details" eyebrow="Account" icon={UserRound}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={name} onChange={setName} />
              <Field label="Work email" value={email} onChange={setEmail} />
              <Field label="Phone" value={phone} onChange={setPhone} />
              <Field label="Role" value={role} onChange={setRole} disabled />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => toast.success("Profile updated")}
                className="rounded-lg bg-brand px-4 py-2 text-[13px] font-bold text-primary-foreground transition hover:opacity-90"
              >
                Save changes
              </button>
            </div>
          </Panel>

          <Panel title="Security" eyebrow="Protect your access" icon={ShieldCheck}>
            <ul className="space-y-3">
              <SecurityRow
                icon={KeyRound}
                title="Console password"
                helper="Change your sign-in password"
                action="Change password"
                onClick={() => setPwOpen(true)}
              />
              <SecurityRow
                icon={Smartphone}
                title="Two-factor device"
                helper="Email OTP temporarily disabled"
                action="Replace device"
                onClick={() => setTwoFaOpen(true)}
              />
              <SecurityRow
                icon={LogOut}
                title="Sign out everywhere"
                helper="Ends every session including this one"
                action="Sign out all"
                tone="danger"
                onClick={() => {
                  void endAdminSession().then(() => {
                    toast.success("Signed out of all devices");
                    navigate({ to: "/login", replace: true });
                  });
                }}
              />
            </ul>
          </Panel>

          <Panel title="Signed-in sessions" eyebrow="Devices" icon={MonitorSmartphone}>
            <ul className="divide-y divide-border/60">
              {activeSessions.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-bold">
                      {s.device}
                      {s.current ? (
                        <span className="ml-2 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
                          This device
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[12.5px] text-muted-foreground">
                      {s.location} · {s.ip} · {s.lastSeen}
                    </p>
                  </div>
                  {s.current ? null : (
                    <button
                      type="button"
                      onClick={() => {
                        setRevoked((r) => [...r, s.id]);
                        toast.success("Session revoked");
                      }}
                      className="rounded-lg border border-border px-3 py-1.5 text-[12px] font-bold transition hover:bg-muted"
                    >
                      Revoke
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <Stat label="Actions logged" value={String(activity.length)} helper="Recent audit events for you" tone="brand" />
            <Stat label="Active sessions" value={String(activeSessions.length)} helper="This browser" tone="gold" />
          </div>

          <Panel title="Alert preferences" eyebrow="Notifications">
            <ul className="space-y-3">
              {prefs.map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold">{p.label}</p>
                    <p className="text-[12px] text-muted-foreground">{p.helper}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={p.on}
                    onClick={() =>
                      setPrefs((list) =>
                        list.map((x) => (x.id === p.id ? { ...x, on: !x.on } : x)),
                      )
                    }
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                      p.on ? "bg-brand" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${
                        p.on ? "left-[1.4rem]" : "left-0.5"
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Your recent actions" eyebrow="Audit">
            <ul className="space-y-3">
              {activity.length === 0 ? (
                <li className="text-[13px] text-muted-foreground">No recent audit actions for this account.</li>
              ) : (
                activity.map((a) => (
                  <li key={a.id} className="flex items-start gap-2.5">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" />
                    <div>
                      <p className="text-[13px] font-semibold">{a.action}</p>
                      <p className="text-[12px] text-muted-foreground">{a.when}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </Panel>
        </div>
      </div>

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="sm:max-w-[26rem]">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Use at least 12 characters with a number and a symbol. You stay signed in on this
              device.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Current password" value={current} onChange={setCurrent} type="password" />
            <Field label="New password" value={next} onChange={setNext} type="password" />
            <Field label="Confirm new password" value={confirm} onChange={setConfirm} type="password" />
            {error ? <p className="text-[12.5px] font-semibold text-destructive">{error}</p> : null}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPwOpen(false)}
              className="rounded-lg border border-border px-3.5 py-2 text-[13px] font-bold transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!current || next.length < 12) {
                  setError("Enter your current password and a new one of at least 12 characters.");
                  return;
                }
                if (next !== confirm) {
                  setError("The new passwords do not match.");
                  return;
                }
                setError("");
                setPwOpen(false);
                setCurrent("");
                setNext("");
                setConfirm("");
                toast.success("Password changed", {
                  description: "Other sessions were signed out.",
                });
              }}
              className="rounded-lg bg-brand px-3.5 py-2 text-[13px] font-bold text-primary-foreground transition hover:opacity-90"
            >
              Update password
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={twoFaOpen} onOpenChange={setTwoFaOpen}>
        <DialogContent className="sm:max-w-[26rem]">
          <DialogHeader>
            <DialogTitle>Replace two-factor device</DialogTitle>
            <DialogDescription>
              Scan the setup key in your authenticator app, then enter the 6-digit code it shows.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Setup key
            </p>
            <p className="mt-1 font-mono text-[15px] font-bold tracking-[0.16em]">
              KPIT 4RQ2 8LMD 91XZ
            </p>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setTwoFaOpen(false)}
              className="rounded-lg border border-border px-3.5 py-2 text-[13px] font-bold transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setTwoFaOpen(false);
                toast.success("Two-factor device replaced");
              }}
              className="rounded-lg bg-brand px-3.5 py-2 text-[13px] font-bold text-primary-foreground transition hover:opacity-90"
            >
              Confirm device
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-[13.5px] font-semibold outline-none transition focus:border-brand disabled:bg-muted/60 disabled:text-muted-foreground"
      />
    </label>
  );
}

function SecurityRow({
  icon: Icon,
  title,
  helper,
  action,
  onClick,
  tone = "default",
}: {
  icon: typeof KeyRound;
  title: string;
  helper: string;
  action: string;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border/70 p-3.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand/8 text-brand">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold">{title}</p>
        <p className="text-[12.5px] text-muted-foreground">{helper}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className={`rounded-lg px-3 py-2 text-[12.5px] font-bold transition ${
          tone === "danger"
            ? "border border-destructive/30 text-destructive hover:bg-destructive/10"
            : "border border-border hover:bg-muted"
        }`}
      >
        {action}
      </button>
    </li>
  );
}
