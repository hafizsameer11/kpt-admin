import type { DualControlPayload } from "@/lib/admin-dual-control";

type Props = {
  value: DualControlPayload;
  onChange: (next: DualControlPayload) => void;
  className?: string;
};

const labelClass =
  "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground";
const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand";

/** Operator PIN + second approver — required for Operations profile/product changes. */
export function AdminDualConfirmFields({ value, onChange, className }: Props) {
  return (
    <div className={className ?? "mt-4 space-y-3 rounded-xl border border-gold/30 bg-gold/5 p-4"}>
      <p className="text-[12.5px] font-bold text-foreground">
        Second-person approval
      </p>
      <p className="text-[12px] leading-snug text-muted-foreground">
        Enter your console PIN and a different approver&apos;s email and PIN (Finance, Global Admin, or
        an operator with maker-checker enabled).
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block sm:col-span-1">
          <span className={labelClass}>Your PIN</span>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            value={value.operatorPin ?? ""}
            onChange={(e) =>
              onChange({ ...value, operatorPin: e.target.value.replace(/\D/g, "").slice(0, 4) })
            }
            className={fieldClass}
          />
        </label>
        <label className="block sm:col-span-1">
          <span className={labelClass}>Approver email</span>
          <input
            type="email"
            value={value.approverEmail ?? ""}
            onChange={(e) => onChange({ ...value, approverEmail: e.target.value })}
            className={fieldClass}
            placeholder="checker@kipit.com"
          />
        </label>
        <label className="block sm:col-span-1">
          <span className={labelClass}>Approver PIN</span>
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            value={value.approverPin ?? ""}
            onChange={(e) =>
              onChange({ ...value, approverPin: e.target.value.replace(/\D/g, "").slice(0, 4) })
            }
            className={fieldClass}
          />
        </label>
      </div>
    </div>
  );
}