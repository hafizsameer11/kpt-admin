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
      return inv.maturityDate;
    case "principal":
      return naira(inv.principal);
    case "payout-frequency":
      return inv.payoutFrequency;
    case "status":
      return inv.status;
  }
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
  const valueError = touched && newValue.trim() === "";
  const reasonError = touched && reason.trim().length < 10;
  const canSubmit =
    !!investment && newValue.trim() !== "" && reason.trim().length >= 10;

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
                <input
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={type === "principal" ? "₦0" : "Enter new value"}
                  className={`mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5 text-[13.5px] font-bold outline-none transition ${
                    valueError ? "border-destructive" : "border-border focus:border-brand/50"
                  }`}
                />
                {valueError ? (
                  <p className="mt-1 text-[11.5px] font-semibold text-destructive">
                    A new value is required.
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
                  <Row label="Proposed" value={newValue.trim() || "—"} accent />
                  <Row label="Principal" value={naira(investment.principal)} />
                  <Row label="Maturity" value={investment.maturityDate} />
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
                ? `${ADJUSTMENT_TYPE_LABEL[type]} on ${investment.reference} changes from ${before} to ${newValue.trim()} once a second approver signs off.`
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
                const apiType =
                  type === "maturity-date"
                    ? "maturity"
                    : type === "rate" || type === "tenor" || type === "principal"
                      ? type
                      : "rate";
                void (async () => {
                  try {
                    const { createAdminAdjustment } = await import("@/lib/admin-api");
                    await createAdminAdjustment({
                      placementId: investment.id,
                      type: apiType,
                      toValue: newValue.trim(),
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
