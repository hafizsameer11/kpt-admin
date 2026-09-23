import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CalendarClock, Info, Percent } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel } from "@/components/kipit/AdminBits";
import { compactNaira } from "@/lib/admin-data";
import { proposeAdminRate } from "@/lib/admin-api";
import { findBand, hydrateAdminRatesFromApi, type RateBand } from "@/lib/admin-rates-data";

export const Route = createFileRoute("/rates_/propose")({
  validateSearch: (search: Record<string, unknown>) => ({
    band: typeof search["band"] === "string" ? (search["band"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Propose rate change — Kipit Admin Console" },
      {
        name: "description",
        content: "Submit a tenor band rate change with effective date and reason for maker-checker approval.",
      },
      { property: "og:title", content: "Propose rate change — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Maker step of the Kipit rate change workflow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProposeRatePage,
});

function ProposeRatePage() {
  const { band } = Route.useSearch();
  const navigate = useNavigate();

  const [bands, setBands] = useState<RateBand[]>([]);
  const [bandId, setBandId] = useState(band);
  const [rate, setRate] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void hydrateAdminRatesFromApi().then((loaded) => {
      setBands(loaded);
      if (!bandId && loaded[0]) setBandId(loaded[0].id);
    });
  }, [bandId]);

  const selected = useMemo(() => findBand(bandId) ?? bands[0], [bandId, bands]);
  const proposed = Number(rate);
  const validRate = rate !== "" && !Number.isNaN(proposed) && proposed > 0 && proposed <= 40;
  const delta = validRate && selected ? proposed - selected.currentRate : 0;
  const canSubmit = validRate && effectiveDate !== "" && reason.trim().length >= 10 && selected;

  function submit() {
    setTouched(true);
    if (!canSubmit || !selected) return;
    setBusy(true);
    void proposeAdminRate({
      bandId: selected.id,
      proposedBps: Math.round(proposed * 100),
      effectiveFrom: `${effectiveDate}T00:00:00.000Z`,
      reason: reason.trim(),
    })
      .then(() => {
        toast.success("Rate change submitted for approval", {
          description: `${selected.band} · ${selected.currentRate.toFixed(2)}% → ${proposed.toFixed(2)}%`,
        });
        navigate({ to: "/rates/approvals" });
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Submit failed"))
      .finally(() => setBusy(false));
  }

  return (
    <AdminShell title="Propose rate change" subtitle="ADM-071 · maker step, requires a second approver">
      <Link
        to="/rates"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to rate table
      </Link>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel title="Rate change" eyebrow="Proposal" icon={Percent}>
          <div className="mt-4 space-y-4">
            <Field label="Tenor band">
              <select
                value={bandId}
                onChange={(e) => setBandId(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-[13.5px] font-semibold outline-none focus:border-brand/50"
              >
                {bands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.band} — {b.product}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Current rate">
                <div className="flex h-10 items-center rounded-lg border border-border bg-muted/40 px-3 text-[13.5px] font-extrabold tabular-nums text-muted-foreground">
                  {(selected?.currentRate ?? 0).toFixed(2)}%
                </div>
              </Field>
              <Field label="Proposed rate" error={touched && !validRate ? "Enter a rate between 0 and 40%" : undefined}>
                <div className="flex h-10 items-center gap-1 rounded-lg border border-border bg-card px-3 focus-within:border-brand/50">
                  <input
                    value={rate}
                    onChange={(e) => setRate(e.target.value.replace(/[^0-9.]/g, ""))}
                    inputMode="decimal"
                    placeholder="0.00"
                    className="w-full bg-transparent text-[13.5px] font-extrabold tabular-nums outline-none"
                  />
                  <span className="text-[13px] font-bold text-muted-foreground">%</span>
                </div>
              </Field>
            </div>

            <Field
              label="Effective date"
              hint="Applies to new placements from this date"
              error={touched && !effectiveDate ? "Choose an effective date" : undefined}
            >
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-card px-3 text-[13.5px] font-semibold outline-none focus:border-brand/50"
              />
            </Field>

            <Field
              label="Reason / note"
              hint="Recorded on the immutable rate history"
              error={touched && reason.trim().length < 10 ? "Add a reason (min 10 characters)" : undefined}
            >
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="e.g. Primary market auction cleared 55bps higher; repricing keeps the band competitive."
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[13.5px] outline-none focus:border-brand/50"
              />
            </Field>

            <div className="flex items-center justify-end gap-3 border-t border-border/70 pt-4">
              <Link
                to="/rates"
                className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] font-bold transition hover:text-brand"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={submit}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-[12.5px] font-bold text-primary-foreground transition hover:opacity-90"
              >
                Submit for approval
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Impact preview" eyebrow="Before / after" icon={CalendarClock}>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/70 bg-muted/40 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Current</p>
                <p className="mt-1 text-[20px] font-extrabold tabular-nums">
                  {(selected?.currentRate ?? 0).toFixed(2)}%
                </p>
              </div>
              <div className="rounded-xl border border-brand/25 bg-brand/5 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand">Proposed</p>
                <p className="mt-1 text-[20px] font-extrabold tabular-nums text-brand">
                  {validRate ? `${proposed.toFixed(2)}%` : "—"}
                </p>
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-[12.5px]">
              <Row label="Change" value={validRate ? `${delta > 0 ? "+" : ""}${(delta * 100).toFixed(0)}bps` : "—"} />
              <Row label="Principal in band" value={compactNaira(selected?.principal ?? 0)} />
              <Row label="Active placements" value={(selected?.placements ?? 0).toLocaleString("en-NG")} />
              <Row label="Minimum" value={compactNaira(selected?.minimum ?? 0)} />
            </dl>
          </Panel>

          <div className="flex gap-2.5 rounded-2xl border border-gold/40 bg-gold/10 p-4">
            <Info className="mt-0.5 size-4 shrink-0 text-gold-foreground" />
            <p className="text-[12.5px] leading-relaxed text-gold-foreground">
              Maker-checker applies: you cannot approve your own proposal. Approved changes affect new
              placements only — existing contracts keep the rate locked at placement.
            </p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">{label}</label>
        {hint ? <span className="text-[11.5px] text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
      {error ? <p className="mt-1.5 text-[12px] font-semibold text-destructive">{error}</p> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-bold tabular-nums">{value}</dd>
    </div>
  );
}
