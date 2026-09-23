import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound, Mail, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  AdminAuthShell,
  AdminPrimaryButton,
} from "@/components/kipit/AdminAuthShell";
import {
  clearPendingAdminPassword,
  getPendingAdminEmail,
  getPendingAdminProfile,
  takePendingDebugOtp,
} from "@/lib/admin-auth-flow";
import { startAdminSession } from "@/lib/admin-auth";
import {
  AdminApiError,
  adminResendLoginOtp,
  adminVerifyLoginOtp,
  getAdminMfaToken,
} from "@/lib/admin-api";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "Two-factor verification — Kipit console" },
      { name: "description", content: "Confirm the 6-digit code emailed to you to open the Kipit admin console." },
      { property: "og:title", content: "Two-factor verification — Kipit console" },
      { property: "og:description", content: "Confirm your email verification code to continue." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminVerify,
});

function AdminVerify() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [seconds, setSeconds] = useState(45);
  const [debugHint, setDebugHint] = useState<string | null>(() => takePendingDebugOtp());
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const email = getPendingAdminEmail();
  const code = digits.join("");

  useEffect(() => {
    if (!getAdminMfaToken()) {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const setDigit = (index: number, value: string) => {
    const clean = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
    setError(null);
    if (clean && index < 5) inputs.current[index + 1]?.focus();
  };

  const submit = async () => {
    if (code.length < 6 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const data = await adminVerifyLoginOtp(code);
      startAdminSession(data.admin.email, {
        name: data.admin.name,
        role: data.admin.role,
        ...getPendingAdminProfile(),
      });
      clearPendingAdminPassword();
      navigate({ to: "/" });
    } catch (err) {
      const message =
        err instanceof AdminApiError
          ? err.message
          : "That code isn't valid. Check your email and try again.";
      setError(message);
      setDigits(Array(6).fill(""));
      inputs.current[0]?.focus();
      if (err instanceof AdminApiError && err.code === "MFA_EXPIRED") {
        navigate({ to: "/login" });
      }
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (seconds > 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const data = await adminResendLoginOtp();
      setSeconds(45);
      if (data.debugCode) setDebugHint(data.debugCode);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Could not resend code.");
      if (err instanceof AdminApiError && err.code === "MFA_EXPIRED") {
        navigate({ to: "/login" });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminAuthShell
      title="Two-factor verification"
      subtitle={`Enter the 6-digit code we emailed to ${email}.`}
      footer={
        <button
          type="button"
          onClick={() => navigate({ to: "/login" })}
          className="mx-auto block text-[12px] font-semibold text-brand-foreground/60 hover:text-brand-foreground"
        >
          Sign in with a different account
        </button>
      }
    >
      <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-white/12 bg-white/5 p-3 text-[12px] text-brand-foreground/70">
        <Mail className="size-4 shrink-0 text-gold" />
        <p>Check your inbox (and spam) for the Kipit admin sign-in code.</p>
      </div>

      <div className="flex justify-between gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            aria-label={`Digit ${i + 1}`}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
              if (e.key === "Enter") void submit();
            }}
            className={`h-14 w-full rounded-xl border bg-white/5 text-center font-display text-xl font-bold text-brand-foreground outline-none transition ${
              error ? "border-destructive/70" : "border-white/20 focus:border-gold/70 focus:bg-white/10"
            }`}
          />
        ))}
      </div>

      {error ? <p className="mt-3 text-[12px] text-destructive">{error}</p> : null}

      <div className="mt-5 space-y-3">
        <AdminPrimaryButton disabled={code.length < 6 || busy} onClick={() => void submit()}>
          {busy ? "Verifying…" : "Verify and open console"}
        </AdminPrimaryButton>
        <button
          type="button"
          disabled={seconds > 0 || busy}
          onClick={() => void resend()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-[13px] font-semibold transition hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw className="size-4" />
          {seconds > 0 ? `Resend code in ${seconds}s` : "Send a new code"}
        </button>
      </div>

      {debugHint ? (
        <p className="mt-5 flex items-center gap-1.5 text-[11px] text-brand-foreground/50">
          <KeyRound className="size-3.5" /> Dev OTP — {debugHint}
        </p>
      ) : null}
    </AdminAuthShell>
  );
}
