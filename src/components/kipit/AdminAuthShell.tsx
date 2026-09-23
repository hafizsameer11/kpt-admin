import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/kipit/Logo";

/**
 * Desktop-first shell for the admin console authentication screens
 * (ADM-001 sign in, ADM-002 two-factor, ADM-003 session lock).
 * Deliberately distinct from the consumer AuthShell: darker, denser, operational.
 */
export function AdminAuthShell({
  children,
  title,
  subtitle,
  footer,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-brand-gradient px-4 py-10 text-brand-foreground">
      <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-gold/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-96 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-white/10" />

      <div className="relative w-full max-w-[26rem]">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Logo tone="light" className="text-2xl" />
          <span className="rounded-md bg-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gold">
            Admin
          </span>
        </div>

        <div className="rounded-2xl border border-white/12 bg-white/8 p-7 backdrop-blur">
          <h1 className="font-display text-[22px] font-extrabold tracking-[-0.02em]">{title}</h1>
          {subtitle ? (
            <p className="mt-1.5 text-[13px] leading-relaxed text-brand-foreground/70">{subtitle}</p>
          ) : null}
          <div className="mt-6">{children}</div>
        </div>

        {footer ? <div className="mt-5">{footer}</div> : null}

        <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-brand-foreground/50">
          <ShieldCheck className="size-3.5" />
          Restricted system. All activity is logged to the audit trail.
        </p>
      </div>
    </div>
  );
}

export const adminInputClass =
  "w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-brand-foreground outline-none transition placeholder:text-brand-foreground/40 focus:border-gold/70 focus:bg-white/10";

export function AdminField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-brand-foreground/55">
        {label}
      </span>
      {children}
      {error ? <span className="mt-1.5 block text-[12px] text-destructive">{error}</span> : null}
    </label>
  );
}

export function AdminPrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="w-full rounded-xl bg-gold px-5 py-3.5 text-sm font-bold text-gold-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}
