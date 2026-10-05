import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Info, Search } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel } from "@/components/kipit/AdminBits";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ADJUSTMENT_TYPE_LABEL,
  findAdjustableInvestment,
  hydrateAdminAdjustmentsFromApi,
  type AdjustableInvestment,
  type AdjustmentType,
} from "@/lib/admin-adjustments-data";

export const Route = createFileRoute("/adjustments_/new")({
  head: () => ({
    meta: [
      { title: "New plan adjustment — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Select a customer investment, choose an adjustment type and submit the change with a mandatory reason for second approval.",
      },
      { property: "og:title", content: "New plan adjustment — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Maker step of the Kipit plan adjustment workflow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewAdjustmentPage,
});

const TYPES: AdjustmentType[] = [
  "rate",
  "tenor",
  "maturity-date",
  "principal",
  "payout-frequency",
  "status",
];

const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

function currentValue(inv: ReturnType<typeof findAdjustableInvestment>, type: AdjustmentType) {
  if (!inv) return "—";
  switch (type) {
    case "rate":
      return `${inv.rate.toFixed(2)}%`;
    case "tenor":
      return `${inv.tenorDays} days`;
    case "maturity-date":
      return toDateInputValue(inv.maturityDate);
    case "principal":
      return naira(inv.principal);
    case "payout-frequency":
      return inv.payoutFrequency;
    case "status":
      return inv.status;
  }
}

/** Normalize API dates to YYYY-MM-DD for display + date inputs. */
function toDateInputValue(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1]!;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
}

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Returns an error message when the new value does not match the selected adjustment type. */
function validateNewValue(
  type: AdjustmentType,
  raw: string,
  investment?: AdjustableInvestment,
): string | null {
  const value = raw.trim();
  if (!value) return "A new value is required.";

  switch (type) {
    case "rate": {
      const n = Number(value);
      if (!Number.isFinite(n) || n <= 0 || n > 100) {
        return "Enter a rate between 0.01 and 100 (e.g. 16.00).";
      }
      return null;
    }
    case "tenor": {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1 || n > 3650) {
        return "Enter tenor as whole days (e.g. 90).";
      }
      return null;
    }
    case "maturity-date": {
      const date = toDateInputValue(value);
      if (!isValidIsoDate(date)) {
        return "Pick a maturity date in YYYY-MM-DD format.";
      }
      if (investment) {
        const start = toDateInputValue(investment.startDate);
        if (start && date < start) {
          return "Maturity date must be on or after the plan start date.";
        }
      }
      return null;
    }
    case "principal": {
      const n = Number(value.replace(/\D/g, ""));
      if (!Number.isFinite(n) || n < 1000) {
        return "Enter a principal of at least ₦1,000.";
      }
      return null;
    }
    case "payout-frequency": {
      if (!["WALLET", "ROLLOVER", "PAYOUT", "At maturity"].includes(value)) {
        return "Select a payout option from the list.";
      }
      return null;
    }
    case "status": {
      if (!["ACTIVE", "MATURED", "CLOSED"].includes(value)) {
        return "Select a plan status from the list.";
      }
      return null;
    }
  }
}

function formatProposed(type: AdjustmentType, raw: string) {
  const value = raw.trim();
  if (!value) return "—";
  if (type === "principal") return naira(Number(value.replace(/\D/g, "")) || 0);
  if (type === "rate") return `${Number(value).toFixed(2)}%`;
  if (type === "tenor") return `${value} days`;
  if (type === "maturity-date") return toDateInputValue(value);
  if (type === "payout-frequency") {
    if (value === "WALLET") return "Wallet at maturity";
    if (value === "ROLLOVER") return "Roll over";
    if (value === "PAYOUT") return "Call Account";
  }
  return value;
}

function serializeToValue(type: AdjustmentType, raw: string) {
  const value = raw.trim();
  if (type === "maturity-date") return toDateInputValue(value);
  if (type === "rate") return String(Number(value));
  if (type === "tenor") return String(Number(value.replace(/[^\d]/g, "")));
  if (type === "principal") return String(Number(value.replace(/\D/g, "")) || 0);
  return value;
}

function newValuePlaceholder(type: AdjustmentType) {
  switch (type) {
    case "rate":
      return "e.g. 16.00";
    case "tenor":
      return "e.g. 90";
    case "maturity-date":
      return "YYYY-MM-DD";
    case "principal":
      return "0";
    case "payout-frequency":
      return "Select frequency";
    case "status":
      return "Select status";
  }
}

function newValueHint(type: AdjustmentType) {
  switch (type) {
    case "rate":
      return "Enter the new annual rate as a percentage (e.g. 18.50).";
    case "tenor":
      return "Enter tenor in whole days.";
    case "maturity-date":
      return "Use the same YYYY-MM-DD format as the current maturity date.";
    case "principal":
      return "Enter the new principal in naira (numbers only).";
    case "payout-frequency":
      return "Choose how maturity proceeds should be handled.";
    case "status":
      return "Choose the new plan status.";
  }
}

function NewValueField({
  type,
  value,
  onChange,
  invalid,
  investment,
}: {
  type: AdjustmentType;
  value: string;
  onChange: (next: string) => void;
  invalid: boolean;
  investment?: AdjustableInvestment;
}) {
  const fieldClass = `mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 text-[13.5px] font-bold outline-none transition ${
    invalid ? "border-destructive" : "border-border focus:border-brand/50"
  }`;

  if (type === "maturity-date") {
    return (
      <input
        type="date"
        value={toDateInputValue(value)}
        min={investment ? toDateInputValue(investment.startDate) || undefined : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
      />
    );
  }

  if (type === "rate") {
    return (
      <div className="relative mt-1.5">
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={newValuePlaceholder(type)}
          className={`${fieldClass} mt-0 pr-8`}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-muted-foreground">
          %
        </span>
      </div>
    );
  }

  if (type === "tenor") {
    return (
      <div className="relative mt-1.5">
        <input
          type="number"
          inputMode="numeric"
          step="1"
          min="1"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
          placeholder={newValuePlaceholder(type)}
          className={`${fieldClass} mt-0 pr-14`}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-muted-foreground">
          days
        </span>
      </div>
    );
  }

  if (type === "principal") {
    return (
      <div className="relative mt-1.5">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-muted-foreground">
          ₦
        </span>
        <input
          type="text"
          inputMode="numeric"
          value={value ? Number(value.replace(/\D/g, "") || 0).toLocaleString("en-NG") : ""}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          placeholder="0"
          className={`${fieldClass} mt-0 pl-7`}
        />
      </div>
    );
  }

  if (type === "payout-frequency") {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
      >
        <option value="">Select frequency</option>
        <option value="WALLET">Wallet at maturity</option>
        <option value="ROLLOVER">Roll over</option>
        <option value="PAYOUT">Call Account</option>
        <option value="At maturity">At maturity</option>
      </select>
    );
  }

  if (type === "status") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
        <option value="">Select status</option>
        <option value="ACTIVE">ACTIVE</option>
        <option value="MATURED">MATURED</option>
        <option value="CLOSED">CLOSED</option>
      </select>
    );
  }

  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={newValuePlaceholder(type)}
      className={fieldClass}
    />
  );
}

function NewAdjustmentPage() {
  const navigate = useNavigate();
  const [investments, setInvestments] = useState<AdjustableInvestment[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [type, setType] = useState<AdjustmentType>("rate");
  const [newValue, setNewValue] = useState("");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    void hydrateAdminAdjustmentsFromApi().then((data) => setInvestments(data.investments));
  }, []);

  const investment = selectedId ? findAdjustableInvestment(selectedId) ?? investments.find((i) => i.id === selectedId) : undefined;
  const q = query.trim().toLowerCase();
  const results = useMemo(
    () =>
      investments.filter(
        (i) =>
          q === "" ||
          [i.userName, i.userEmail, i.product, i.reference].join(" ").toLowerCase().includes(q),
      ),
    [investments, q],
  );

  const before = currentValue(investment, type);
  const proposedDisplay = formatProposed(type, newValue);
  const valueValidationError = validateNewValue(type, newValue, investment);
  const valueError = touched ? valueValidationError : null;
  const reasonError = touched && reason.trim().length < 10;
  const canSubmit =
    !!investment && !valueValidationError && reason.trim().length >= 10;

  return (
    <AdminShell
      title="New plan adjustment"
      subtitle="ADM-080 · maker step, a second approver must sign off"
    >
      <Link
        to="/adjustments"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to adjustments
      </Link>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <Panel title="1 · Select customer and investment">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by customer, email, product or reference"
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-[13px] outline-none transition focus:border-brand/50"
              />
            </label>

            <ul className="mt-3 space-y-2">
              {results.map((i) => {
                const active = i.id === selectedId;
                return (
                  <li key={i.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(i.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                        active
                          ? "border-brand bg-brand/5"
                          : "border-border hover:border-brand/40 hover:bg-muted/40"
                      }`}
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand/10 text-[12px] font-extrabold text-brand">
                        {i.userName
                          .split(" ")
                          .map((p) => p[0])
                          .join("")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-bold">{i.userName}</span>
                        <span className="block truncate text-[12px] text-muted-foreground">
                          {i.product} · {i.reference}
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block text-[13px] font-extrabold tabular-nums">
                          {naira(i.principal)}
                        </span>
                        <span className="block text-[11.5px] text-muted-foreground">
                          {i.rate.toFixed(2)}% · {i.status}
                        </span>
                      </span>
                      {active ? <Check className="size-4 shrink-0 text-brand" /> : null}
                    </button>
                  </li>
                );
              })}
              {results.length === 0 ? (
                <li className="py-8 text-center text-[13px] text-muted-foreground">
                  No matching investments.
                </li>
              ) : null}
            </ul>
          </Panel>

          <Panel title="2 · Adjustment details">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Adjustment type
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t);
                    setNewValue("");
                    setTouched(false);
                  }}
                  className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-bold transition ${
                    type === t
                      ? "border-brand bg-brand text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-brand/40 hover:text-foreground"
                  }`}
                >
                  {ADJUSTMENT_TYPE_LABEL[t]}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  Current value
                </p>
                <p className="mt-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-[13.5px] font-bold tabular-nums">
                  {investment ? before : "Select an investment"}
                </p>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  New value
                </label>
                <NewValueField
                  type={type}
                  value={newValue}
                  onChange={setNewValue}
                  invalid={Boolean(valueError)}
                  investment={investment}
                />
                <p className="mt-1 text-[11.5px] text-muted-foreground">{newValueHint(type)}</p>
                {valueError ? (
                  <p className="mt-1 text-[11.5px] font-semibold text-destructive">
                    {valueError}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-4">
              <label className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Reason (mandatory)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="Explain why this plan is being adjusted. This is stored permanently on the audit record."
                className={`mt-1.5 w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-[13.5px] outline-none transition ${
                  reasonError ? "border-destructive" : "border-border focus:border-brand/50"
                }`}
              />
              {reasonError ? (
                <p className="mt-1 text-[11.5px] font-semibold text-destructive">
                  Give at least 10 characters of context.
                </p>
              ) : null}
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Before and after" eyebrow="Immutable record">
            {investment ? (
              <>
                <div className="rounded-xl bg-brand-gradient p-4 text-primary-foreground">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-primary-foreground/60">
                    {investment.product}
                  </p>
                  <p className="mt-1 text-[16px] font-extrabold">{investment.userName}</p>
                  <p className="text-[12px] text-primary-foreground/70">{investment.reference}</p>
                </div>

                <dl className="mt-4 divide-y divide-border/70 text-[13px]">
                  <Row label="Field" value={ADJUSTMENT_TYPE_LABEL[type]} bold />
                  <Row label="Previous" value={before} muted />
                  <Row label="Proposed" value={proposedDisplay} accent />
                  <Row label="Principal" value={naira(investment.principal)} />
                  <Row label="Maturity" value={toDateInputValue(investment.maturityDate)} />
                  <Row label="Maker" value="Seyi Adeleke · Global Admin" />
                </dl>
              </>
            ) : (
              <p className="py-10 text-center text-[13px] text-muted-foreground">
                Select an investment to see the before and after comparison.
              </p>
            )}
          </Panel>

          <div className="flex items-start gap-2.5 rounded-xl border border-gold/40 bg-gold/10 p-3.5">
            <Info className="mt-0.5 size-4 shrink-0 text-gold-foreground" />
            <p className="text-[12.5px] font-medium text-gold-foreground">
              Adjustments never apply immediately. A second approver reviews the before and after
              values, and both the request and the decision are written to the audit log.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setTouched(true);
              if (!canSubmit) return;
              setConfirmOpen(true);
            }}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-3 text-[13.5px] font-bold text-primary-foreground transition hover:opacity-95"
          >
            Submit for approval
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit adjustment for approval?</DialogTitle>
            <DialogDescription>
              {investment
                ? `${ADJUSTMENT_TYPE_LABEL[type]} on ${investment.reference} changes from ${before} to ${proposedDisplay} once a second approver signs off.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] font-bold"
            >
              Keep editing
            </button>
            <button
              type="button"
              onClick={() => {
                if (!investment) return;
                const validation = validateNewValue(type, newValue, investment);
                if (validation) {
                  setTouched(true);
                  toast.error(validation);
                  return;
                }
                const apiType =
                  type === "maturity-date"
                    ? "maturity"
                    : type === "payout-frequency"
                      ? "payout"
                      : type === "status"
                        ? "status"
                        : type === "rate" || type === "tenor" || type === "principal"
                          ? type
                          : "rate";
                const toValue = serializeToValue(type, newValue);
                void (async () => {
                  try {
                    const { createAdminAdjustment } = await import("@/lib/admin-api");
                    await createAdminAdjustment({
                      placementId: investment.id,
                      type: apiType,
                      toValue,
                      reason: reason.trim(),
                    });
                    setConfirmOpen(false);
                    toast.success("Adjustment submitted for approval");
                    navigate({ to: "/adjustments" });
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not submit");
                  }
                })();
              }}
              className="rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground"
            >
              Submit request
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Row({
  label,
  value,
  muted,
  accent,
  bold,
}: {
  label: string;
  value: string;
  muted?: boolean;
  accent?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={`text-right tabular-nums ${
          accent
            ? "font-extrabold text-brand"
            : muted
              ? "text-muted-foreground line-through"
              : bold
                ? "font-bold"
                : "font-semibold"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
