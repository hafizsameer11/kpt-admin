import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, LifeBuoy } from "lucide-react";
import { useState } from "react";
import {
  AdminAuthShell,
  AdminField,
  AdminPrimaryButton,
  adminInputClass,
} from "@/components/kipit/AdminAuthShell";
import { ADMIN_EMAIL } from "@/lib/admin-auth-flow";

export const Route = createFileRoute("/access-help")({
  head: () => ({
    meta: [
      { title: "Request access reset — Kipit console" },
      { name: "description", content: "Ask the Kipit security team to reset your admin password or authenticator device." },
      { property: "og:title", content: "Request access reset — Kipit console" },
      { property: "og:description", content: "Reset your admin password or authenticator device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminAccessHelp,
});

const REASONS = [
  { id: "password", label: "I forgot my password" },
  { id: "device", label: "I lost my authenticator device" },
  { id: "locked", label: "My account is locked out" },
] as const;

function AdminAccessHelp() {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [reason, setReason] = useState<string>("password");
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <AdminAuthShell
        title="Request sent"
        subtitle="The security team reviews access resets within one business hour. You'll receive an email once your account is ready."
        footer={
          <Link
            to="/login"
            className="mx-auto block text-center text-[12px] font-semibold text-gold"
          >
            Back to sign in
          </Link>
        }
      >
        <div className="flex items-start gap-3 rounded-xl border border-white/12 bg-white/5 p-4">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-gold" />
          <div className="text-[13px] text-brand-foreground/75">
            <p className="font-semibold text-brand-foreground">Reference ADM-RST-4821</p>
            <p className="mt-1">Sent for {email}. Keep this reference for the security desk.</p>
          </div>
        </div>
      </AdminAuthShell>
    );
  }

  return (
    <AdminAuthShell
      title="Request an access reset"
      subtitle="Admin credentials can only be reset by the security team. Tell us what happened."
      footer={
        <Link to="/login" className="mx-auto block text-center text-[12px] font-semibold text-gold">
          Back to sign in
        </Link>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
      >
        <AdminField label="Work email">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={adminInputClass}
            placeholder="you@kipit.com"
          />
        </AdminField>

        <div>
          <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-brand-foreground/55">
            What do you need?
          </span>
          <div className="space-y-2">
            {REASONS.map((r) => {
              const active = reason === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setReason(r.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[13px] font-semibold transition ${
                    active
                      ? "border-gold/70 bg-gold/10 text-brand-foreground"
                      : "border-white/20 bg-white/5 text-brand-foreground/70 hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`grid size-4 place-items-center rounded-full border ${
                      active ? "border-gold bg-gold" : "border-white/40"
                    }`}
                  >
                    {active ? <span className="size-1.5 rounded-full bg-gold-foreground" /> : null}
                  </span>
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>

        <AdminPrimaryButton type="submit" disabled={!email}>
          Send request
        </AdminPrimaryButton>
      </form>

      <p className="mt-5 flex items-center gap-1.5 text-[11px] text-brand-foreground/50">
        <LifeBuoy className="size-3.5" /> Urgent? Call the security desk on ext. 4400.
      </p>
    </AdminAuthShell>
  );
}
