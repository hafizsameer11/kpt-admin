import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { STATUS_LABEL, TIER_LABEL, type Tier, type UserStatus } from "@/lib/admin-users-data";

/** Small shared building blocks for the admin console screens. */

const STATUS_TONE: Record<UserStatus, string> = {
  active: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20",
  frozen: "bg-destructive/10 text-destructive ring-destructive/20",
  dormant: "bg-muted text-muted-foreground ring-border",
  pending: "bg-gold/25 text-gold-foreground ring-gold/40",
};

export function StatusPill({ status, onDark = false }: { status: UserStatus; onDark?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${
        onDark
          ? "bg-white/12 text-primary-foreground ring-white/20"
          : STATUS_TONE[status]
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          onDark
            ? status === "active"
              ? "bg-emerald-400"
              : status === "frozen"
                ? "bg-red-400"
                : "bg-gold"
            : "bg-current"
        }`}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function TierPill({ tier, onDark = false }: { tier: Tier; onDark?: boolean }) {
  if (onDark) {
    return (
      <span className="inline-flex items-center rounded-md bg-white/12 px-2 py-0.5 text-[11px] font-bold text-primary-foreground ring-1 ring-white/20">
        {TIER_LABEL[tier]}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold ring-1 ${
        tier === 2
          ? "bg-brand/10 text-brand ring-brand/20"
          : tier === 1
            ? "bg-gold/20 text-gold-foreground ring-gold/40"
            : "bg-muted text-muted-foreground ring-border"
      }`}
    >
      {TIER_LABEL[tier]}
    </span>
  );
}

export function Panel({
  title,
  eyebrow,
  icon: Icon,
  action,
  children,
  className = "",
}: {
  title?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-border/80 bg-card shadow-[0_1px_2px_rgba(11,29,58,0.04),0_12px_28px_-20px_rgba(11,29,58,0.35)] ${className}`}
    >
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            {Icon ? (
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand/8 text-brand">
                <Icon className="size-4" strokeWidth={2.1} />
              </span>
            ) : null}
            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {eyebrow}
                </p>
              ) : null}
              <h2 className="truncate font-display text-[15px] font-extrabold tracking-[-0.01em]">
                {title}
              </h2>
            </div>
          </div>
          {action}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  helper,
  tone = "default",
  icon: Icon,
  progress,
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "brand" | "gold";
  icon?: LucideIcon;
  /** 0–1 share rendered as a thin meter under the value. */
  progress?: number;
}) {
  const dark = tone === "brand";
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 transition ${
        dark
          ? "border-transparent bg-brand-gradient text-primary-foreground"
          : tone === "gold"
            ? "border-gold/30 bg-gold/8"
            : "border-border/80 bg-card hover:border-brand/25"
      } shadow-[0_1px_2px_rgba(11,29,58,0.04),0_12px_28px_-22px_rgba(11,29,58,0.4)]`}
    >
      {dark ? (
        <span className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-gold/20 blur-2xl" />
      ) : null}

      <div className="relative flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={`text-[10.5px] font-bold uppercase tracking-[0.14em] ${
              dark ? "text-primary-foreground/60" : "text-muted-foreground"
            }`}
          >
            {label}
          </p>
          <p className="mt-1.5 font-display text-[23px] font-extrabold tracking-[-0.025em]">{value}</p>
          {helper ? (
            <p
              className={`mt-0.5 text-[12px] ${
                dark ? "text-primary-foreground/60" : "text-muted-foreground"
              }`}
            >
              {helper}
            </p>
          ) : null}
        </div>
        {Icon ? (
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-xl ${
              dark
                ? "bg-white/12 text-gold"
                : tone === "gold"
                  ? "bg-gold/25 text-gold-foreground"
                  : "bg-brand/8 text-brand"
            }`}
          >
            <Icon className="size-4" strokeWidth={2.1} />
          </span>
        ) : null}
      </div>

      {typeof progress === "number" ? (
        <div
          className={`relative mt-3 h-1.5 overflow-hidden rounded-full ${
            dark ? "bg-white/15" : "bg-muted"
          }`}
        >
          <span
            className={`block h-full rounded-full ${dark ? "bg-gold" : "bg-brand"}`}
            style={{ width: `${Math.max(3, Math.min(100, progress * 100))}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
