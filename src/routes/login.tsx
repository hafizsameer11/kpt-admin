import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import {
  AdminAuthShell,
  AdminField,
  AdminPrimaryButton,
  adminInputClass,
} from "@/components/kipit/AdminAuthShell";
import { clearPendingAdminPassword, getPendingAdminProfile } from "@/lib/admin-auth-flow";
import { startAdminSession } from "@/lib/admin-auth";
import { AdminApiError, adminLogin } from "@/lib/admin-api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Admin sign in — Kipit console" },
      { name: "description", content: "Secure sign in for Kipit operators and administrators." },
      { property: "og:title", content: "Admin sign in — Kipit console" },
      { property: "og:description", content: "Secure sign in for Kipit operators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const locked = attempts >= 3;

  const submit = async () => {
    if (locked || busy) return;
    setBusy(true);
    setError(null);
    try {
      const data = await adminLogin(email.trim().toLowerCase(), password);
      if (data.mfaRequired) {
        const {
          setPendingAdminEmail,
          setPendingAdminPassword,
          setPendingAdminProfile,
          setPendingDebugOtp,
        } = await import("@/lib/admin-auth-flow");
        setPendingAdminEmail(email.trim().toLowerCase());
        setPendingAdminPassword(password);
        setPendingAdminProfile({ name: data.admin.name, role: data.admin.role });
        setPendingDebugOtp(data.debugCode ?? null);
        navigate({ to: "/verify" });
        return;
      }
      startAdminSession(data.admin.email, {
        name: data.admin.name,
        role: data.admin.role,
        ...getPendingAdminProfile(),
      });
      clearPendingAdminPassword();
      navigate({ to: "/" });
    } catch (err) {
      const next = attempts + 1;
      setAttempts(next);
      setError(
        next >= 3
          ? "Account locked after 3 failed attempts. Contact the security team to reset access."
          : err instanceof AdminApiError
            ? err.message
            : `Incorrect credentials. ${3 - next} attempt${3 - next === 1 ? "" : "s"} remaining.`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminAuthShell
      title="Operator sign in"
      subtitle="Use your Kipit staff account."
      footer={
        <p className="text-center text-[12px] text-brand-foreground/60">
          Lost access?{" "}
          <Link to="/access-help" className="font-semibold text-gold">
            Request an access reset
          </Link>
        </p>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <AdminField label="Work email">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={adminInputClass}
            placeholder="you@kipit.com"
            autoComplete="username"
          />
        </AdminField>

        <AdminField label="Password" error={error}>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${adminInputClass} pr-12`}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-3 flex items-center text-brand-foreground/60"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </AdminField>

        <div className="pt-1">
          <AdminPrimaryButton type="submit" disabled={!email || password.length < 4 || busy || locked}>
            {busy ? "Signing in…" : "Sign in"}
          </AdminPrimaryButton>
        </div>
      </form>
    </AdminAuthShell>
  );
}
