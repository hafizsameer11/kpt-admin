import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { useRef, useState } from "react";
import {
  AdminAuthShell,
  AdminField,
  AdminPrimaryButton,
} from "@/components/kipit/AdminAuthShell";
import {
  ADMIN_IDLE_MINUTES,
  endAdminSession,
  getAdminSession,
  unlockAdminSession,
} from "@/lib/admin-auth";
import { AdminApiError, adminUnlockSession } from "@/lib/admin-api";

export const Route = createFileRoute("/locked")({
  head: () => ({
    meta: [
      { title: "Session locked — Kipit console" },
      { name: "description", content: "Your Kipit admin session locked after inactivity. Enter your quick PIN to continue." },
      { property: "og:title", content: "Session locked — Kipit console" },
      { property: "og:description", content: "Enter your quick PIN to resume the admin session." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLocked,
});

const LENGTH = 4;

function AdminLocked() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const session = typeof window === "undefined" ? null : getAdminSession();
  const pin = digits.join("");

  const setDigit = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, "").slice(-1);
    setError(null);
    setDigits((d) => {
      const next = [...d];
      next[i] = v;
      return next;
    });
    if (v && i < LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const unlock = async () => {
    if (busy || pin.length < LENGTH) return;
    setBusy(true);
    setError(null);
    try {
      await adminUnlockSession(pin);
      unlockAdminSession();
      navigate({ to: "/" });
    } catch (err) {
      setDigits(Array(LENGTH).fill(""));
      refs.current[0]?.focus();
      setError(
        err instanceof AdminApiError
          ? err.message
          : "Incorrect PIN. Try again or sign out completely.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminAuthShell
      title="Session locked"
      subtitle={`The console locks automatically after ${ADMIN_IDLE_MINUTES} minutes of inactivity.`}
      footer={
        <button
          type="button"
          onClick={() => {
            void endAdminSession().then(() => {
              navigate({ to: "/login" });
            });
          }}
          className="mx-auto block text-[12px] font-semibold text-brand-foreground/60 hover:text-brand-foreground"
        >
          Sign out completely
        </button>
      }
    >
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-white/12 bg-white/5 p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold text-[12px] font-extrabold text-gold-foreground">
          {(session?.name ?? "SA")
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold">{session?.name ?? "Seyi Adeleke"}</p>
          <p className="truncate text-[11px] text-brand-foreground/60">
            {session?.email ?? "seyi.adeleke@kipit.com"}
          </p>
        </div>
        <LockKeyhole className="ml-auto size-4 text-gold" />
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void unlock();
        }}
      >
        <AdminField label="Quick PIN" error={error}>
          <div className="flex gap-3">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                value={d}
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label={`PIN digit ${i + 1}`}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                type="password"
                className="h-14 w-full rounded-xl border border-white/15 bg-white/5 text-center font-display text-[20px] font-extrabold text-brand-foreground outline-none focus:border-gold/70"
              />
            ))}
          </div>
        </AdminField>
        <p className="text-[11.5px] text-brand-foreground/55">
          Use the short PIN for this trusted device. Signing out requires your full password and
          two-factor code.
        </p>
        <AdminPrimaryButton type="submit" disabled={pin.length < LENGTH || busy}>
          {busy ? "Unlocking…" : "Unlock console"}
        </AdminPrimaryButton>
      </form>
    </AdminAuthShell>
  );
}
