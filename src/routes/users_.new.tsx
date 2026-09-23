import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel } from "@/components/kipit/AdminBits";
import { AdminApiError, createAdminUser } from "@/lib/admin-api";

export const Route = createFileRoute("/users_/new")({
  head: () => ({
    meta: [
      { title: "Onboard customer — Kipit Admin Console" },
      { name: "description", content: "Operations can create personal or business customer accounts." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardUserPage,
});

function OnboardUserPage() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<"PERSONAL" | "BUSINESS">("PERSONAL");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessRcNumber, setBusinessRcNumber] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const created = await createAdminUser({
        accountType,
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        firstName: firstName.trim(),
        surname: surname.trim(),
        businessName: accountType === "BUSINESS" ? businessName.trim() : undefined,
        businessRcNumber: accountType === "BUSINESS" ? businessRcNumber.trim() || undefined : undefined,
      });
      toast.success(`Account created · temp password emailed`);
      navigate({ to: "/users/$userId", params: { userId: created.id } });
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Could not create account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell title="Onboard customer" subtitle="Operations · personal or business">
      <Link
        to="/users"
        className="inline-flex items-center gap-2 text-[13px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to users
      </Link>

      <Panel title="Customer details" eyebrow="Manual onboard" className="mt-5 max-w-3xl">
        <div className="mb-4 flex gap-2">
          {(["PERSONAL", "BUSINESS"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setAccountType(t)}
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold ${
                accountType === t ? "bg-brand text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {t === "PERSONAL" ? "Personal" : "Business"}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="First name">
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Surname">
            <input value={surname} onChange={(e) => setSurname(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Email">
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={inputClass} />
          </Field>
          <Field label="Phone (optional)">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </Field>
          {accountType === "BUSINESS" ? (
            <>
              <Field label="Business name">
                <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} />
              </Field>
              <Field label="RC number (optional)">
                <input
                  value={businessRcNumber}
                  onChange={(e) => setBusinessRcNumber(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </>
          ) : null}
        </div>

        <p className="mt-4 text-[12.5px] text-muted-foreground">
          A founder welcome email is sent with a temporary password. Funds are managed by Kipit Asset
          Management Limited.
        </p>

        <button
          type="button"
          disabled={busy || !firstName.trim() || !surname.trim() || !email.trim()}
          onClick={() => void submit()}
          className="mt-5 inline-flex h-11 items-center rounded-xl bg-brand px-5 text-[13px] font-bold text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create account"}
        </button>
      </Panel>
    </AdminShell>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
