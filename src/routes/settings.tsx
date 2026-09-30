import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Clock, Coins, Flag, Gauge, MessageCircle, Wrench } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import {
  hydrateAdminSettingsFromApi,
  type FeeSetting,
  type FeatureFlag,
  type MaintenanceSettings,
} from "@/lib/admin-console-data";
import { AdminApiError, putAdminSettings } from "@/lib/admin-api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "System settings — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Control Kipit fees, transaction limits, processing cut-off times, maintenance mode and feature flags from one settings workspace.",
      },
      { property: "og:title", content: "System settings — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Fees, limits, cut-offs, maintenance mode and feature flags.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SystemSettingsPage,
});

const TABS = ["Fees", "Limits", "Cut-off times", "Support", "Maintenance", "Feature flags"] as const;
type Tab = (typeof TABS)[number];

function validateNumericRows(rows: FeeSetting[], label: string) {
  for (const row of rows) {
    const n = Number(String(row.value).replace(/,/g, ""));
    if (!Number.isFinite(n) || n < 0) {
      toast.error(`${label}: ${row.label} must be a number ≥ 0`);
      return false;
    }
  }
  return true;
}

function validateCutoffRows(rows: FeeSetting[]) {
  for (const row of rows) {
    const v = String(row.value).trim();
    if (!/^\d{1,2}:\d{2}$/.test(v)) {
      toast.error(`Cut-offs: ${row.label} must be a time (HH:MM)`);
      return false;
    }
    const [h, m] = v.split(":").map(Number);
    if (h! > 23 || m! > 59) {
      toast.error(`Cut-offs: ${row.label} must be a valid time`);
      return false;
    }
  }
  return true;
}

function SystemSettingsPage() {
  const [tab, setTab] = useState<Tab>("Fees");
  const [fees, setFees] = useState<FeeSetting[]>([]);
  const [limits, setLimits] = useState<FeeSetting[]>([]);
  const [cutoffs, setCutoffs] = useState<FeeSetting[]>([]);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceSettings>({
    enabled: false,
    message: "",
    window: "",
  });
  const [support, setSupport] = useState({
    phone: "+2347000547480",
    whatsapp: "",
    email: "support@kipit.ng",
  });
  const [confirmMaintenance, setConfirmMaintenance] = useState(false);
  const [confirmMaintenanceOff, setConfirmMaintenanceOff] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void hydrateAdminSettingsFromApi().then((data) => {
      if (!data) return;
      setFees(data.fees.map((r) => ({ ...r })));
      setLimits(data.limits.map((r) => ({ ...r })));
      setCutoffs(data.cutoffs.map((r) => ({ ...r })));
      setFlags(data.flags.map((f) => ({ ...f })));
      setMaintenance((m) => ({
        enabled: data.maintenance.enabled,
        message: data.maintenance.message,
        window: m.window,
      }));
      if (data.support) {
        setSupport({
          phone: data.support.phone || "+2347000547480",
          whatsapp: data.support.whatsapp || "",
          email: data.support.email || "support@kipit.ng",
        });
      }
    });
  }, []);

  async function save(
    partial: Partial<{
      fees: FeeSetting[];
      limits: FeeSetting[];
      cutoffs: FeeSetting[];
      flags: FeatureFlag[];
      maintenance: { enabled: boolean; message: string };
      support: { phone: string; whatsapp: string; email: string };
    }>,
    successMessage: string,
  ) {
    setSaving(true);
    try {
      const next = await putAdminSettings(partial);
      setFees(next.fees.map((r) => ({ ...r })));
      setLimits(next.limits.map((r) => ({ ...r })));
      setCutoffs(next.cutoffs.map((r) => ({ ...r })));
      setFlags(next.flags.map((f) => ({ ...f })));
      setMaintenance((m) => ({
        enabled: next.maintenance.enabled,
        message: next.maintenance.message,
        window: m.window,
      }));
      if (next.support) {
        setSupport({
          phone: next.support.phone || "",
          whatsapp: next.support.whatsapp || "",
          email: next.support.email || "",
        });
      }
      toast.success(successMessage);
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  const enabledFlags = flags.filter((f) => f.enabled).length;
  const tier2Cap = limits.find((l) => l.id === "l-t2-day")?.value;
  const tier2Display = tier2Cap
    ? `₦${Number(tier2Cap).toLocaleString("en-NG")}`
    : "—";

  return (
    <AdminShell title="System settings" subtitle="Fees, limits, cut-offs, maintenance and flags">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Withdrawal fee" value={`₦${fees[0]?.value ?? "0"}`} helper="Flat, per payout" tone="brand" icon={Coins} />
        <Stat label="Tier 2 daily cap" value={tier2Display} helper="Per customer per day" icon={Gauge} />
        <Stat label="Payout cut-off" value={cutoffs[0]?.value ?? "—"} helper="Later requests settle next day" icon={Clock} />
        <Stat
          label="Live features"
          value={`${enabledFlags}/${flags.length || 0}`}
          helper={maintenance.enabled ? "Maintenance mode ON" : "Platform normal"}
          tone={maintenance.enabled ? "gold" : "default"}
          icon={Flag}
        />
      </div>

      <div className="no-scrollbar mt-5 overflow-x-auto rounded-2xl border border-border/80 bg-card p-1.5">
        <ul className="flex min-w-max gap-1">
          {TABS.map((t) => (
            <li key={t}>
              <button
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-xl px-3.5 py-2 text-[13px] font-bold transition ${
                  tab === t
                    ? "bg-brand text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {t}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 space-y-5">
        {tab === "Fees" ? (
          <SettingList
            title="Fees"
            eyebrow="Charges applied to customers"
            icon={Coins}
            rows={fees}
            onChange={setFees}
            saving={saving}
            onSave={() => {
              if (!validateNumericRows(fees, "Fees")) return;
              void save({ fees }, "Fees saved");
            }}
          />
        ) : null}

        {tab === "Limits" ? (
          <SettingList
            title="Transaction limits"
            eyebrow="Per tier and per payout"
            icon={Gauge}
            rows={limits}
            onChange={setLimits}
            saving={saving}
            onSave={() => {
              if (!validateNumericRows(limits, "Limits")) return;
              void save({ limits }, "Limits saved");
            }}
          />
        ) : null}

        {tab === "Cut-off times" ? (
          <SettingList
            title="Processing cut-off times"
            eyebrow="Daily operational schedule"
            icon={Clock}
            rows={cutoffs}
            onChange={setCutoffs}
            saving={saving}
            onSave={() => {
              if (!validateCutoffRows(cutoffs)) return;
              void save({ cutoffs }, "Cut-off times saved");
            }}
          />
        ) : null}

        {tab === "Support" ? (
          <Panel title="Customer support contacts" eyebrow="Shown in the Kipit mobile app" icon={MessageCircle}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Call / phone
                </span>
                <input
                  value={support.phone}
                  onChange={(e) => setSupport((s) => ({ ...s, phone: e.target.value }))}
                  placeholder="+2347000547480"
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-[13.5px] font-semibold outline-none transition focus:border-brand"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  WhatsApp number
                </span>
                <input
                  value={support.whatsapp}
                  onChange={(e) => setSupport((s) => ({ ...s, whatsapp: e.target.value }))}
                  placeholder="2348012345678"
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-[13.5px] font-semibold outline-none transition focus:border-brand"
                />
                <p className="mt-1.5 text-[11.5px] leading-4 text-muted-foreground">
                  Digits with country code (e.g. 234…). The app builds{" "}
                  <span className="font-semibold text-foreground">
                    wa.me/{support.whatsapp.replace(/\D/g, "") || "…"}
                  </span>{" "}
                  automatically.
                </p>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Support email
                </span>
                <input
                  value={support.email}
                  onChange={(e) => setSupport((s) => ({ ...s, email: e.target.value }))}
                  placeholder="support@kipit.ng"
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-[13.5px] font-semibold outline-none transition focus:border-brand"
                />
              </label>
            </div>
            {support.whatsapp.replace(/\D/g, "").length >= 10 ? (
              <a
                href={`https://wa.me/${support.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent("Hi Kipit, I'd like some help with my account.")}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12.5px] font-bold text-emerald-700 hover:bg-emerald-500/15"
              >
                <MessageCircle className="size-4" />
                Preview WhatsApp link
              </a>
            ) : null}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void save(
                    {
                      support: {
                        phone: support.phone.trim(),
                        whatsapp: support.whatsapp.replace(/\D/g, ""),
                        email: support.email.trim(),
                      },
                    },
                    "Support contacts saved",
                  )
                }
                className="rounded-lg bg-brand px-4 py-2 text-[13px] font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save support contacts"}
              </button>
            </div>
          </Panel>
        ) : null}

        {tab === "Maintenance" ? (
          <Panel title="Maintenance mode" eyebrow="Platform availability" icon={Wrench}>
            <div
              className={`flex flex-wrap items-center gap-4 rounded-2xl border p-4 ${
                maintenance.enabled
                  ? "border-destructive/30 bg-destructive/8"
                  : "border-border/70 bg-muted/30"
              }`}
            >
              <span
                className={`grid size-11 place-items-center rounded-xl ${
                  maintenance.enabled ? "bg-destructive/15 text-destructive" : "bg-brand/8 text-brand"
                }`}
              >
                <AlertTriangle className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-[16px] font-extrabold">
                  {maintenance.enabled ? "Maintenance mode is ON" : "Platform is live"}
                </p>
                <p className="text-[12.5px] text-muted-foreground">
                  {maintenance.enabled
                    ? "Customers see the maintenance notice. Funding, investing and withdrawals are paused."
                    : "All customer journeys are available."}
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  if (!maintenance.enabled) setConfirmMaintenance(true);
                  else setConfirmMaintenanceOff(true);
                }}
                className={`rounded-lg px-4 py-2 text-[13px] font-bold transition ${
                  maintenance.enabled
                    ? "bg-brand text-primary-foreground hover:opacity-90"
                    : "bg-destructive text-destructive-foreground hover:opacity-90"
                }`}
              >
                {maintenance.enabled ? "Turn off" : "Turn on"}
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Customer message
                </span>
                <textarea
                  rows={3}
                  value={maintenance.message}
                  onChange={(e) => setMaintenance((m) => ({ ...m, message: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-[13.5px] outline-none transition focus:border-brand"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Scheduled window
                </span>
                <input
                  value={maintenance.window}
                  onChange={(e) => setMaintenance((m) => ({ ...m, window: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-[13.5px] font-semibold outline-none transition focus:border-brand"
                />
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  void save(
                    { maintenance: { enabled: maintenance.enabled, message: maintenance.message } },
                    "Maintenance settings saved",
                  )
                }
                className="rounded-lg bg-brand px-4 py-2 text-[13px] font-bold text-primary-foreground transition hover:opacity-90"
              >
                Save
              </button>
            </div>
          </Panel>
        ) : null}

        {tab === "Feature flags" ? (
          <Panel title="Feature flags" eyebrow="Roll features in and out" icon={Flag}>
            <ul className="divide-y divide-border/60">
              {flags.map((f) => (
                <li key={f.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-bold">{f.label}</p>
                    <p className="text-[12.5px] text-muted-foreground">{f.description}</p>
                    <span className="mt-1 inline-block rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {f.audience}
                    </span>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={f.enabled}
                    disabled={saving}
                    onClick={() => {
                      const nextFlags = flags.map((x) =>
                        x.id === f.id ? { ...x, enabled: !x.enabled } : x,
                      );
                      setFlags(nextFlags);
                      void save(
                        { flags: nextFlags },
                        `${f.label} ${f.enabled ? "turned off" : "turned on"}`,
                      );
                    }}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                      f.enabled ? "bg-brand" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${
                        f.enabled ? "left-[1.4rem]" : "left-0.5"
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}
      </div>

      <Dialog open={confirmMaintenanceOff} onOpenChange={setConfirmMaintenanceOff}>
        <DialogContent className="sm:max-w-[26rem]">
          <DialogHeader>
            <DialogTitle>Turn off maintenance mode?</DialogTitle>
            <DialogDescription>
              Customers will regain access to funding, investing and withdrawals. This is recorded
              in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmMaintenanceOff(false)}
              className="rounded-lg border border-border px-3.5 py-2 text-[13px] font-bold transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setConfirmMaintenanceOff(false);
                void save(
                  { maintenance: { enabled: false, message: maintenance.message } },
                  "Maintenance mode turned off",
                );
              }}
              className="rounded-lg bg-brand px-3.5 py-2 text-[13px] font-bold text-primary-foreground transition hover:opacity-90"
            >
              Turn off
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmMaintenance} onOpenChange={setConfirmMaintenance}>
        <DialogContent className="sm:max-w-[26rem]">
          <DialogHeader>
            <DialogTitle>Turn on maintenance mode?</DialogTitle>
            <DialogDescription>
              Every customer will be blocked from funding, investing and withdrawing until you turn
              it off. This is recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmMaintenance(false)}
              className="rounded-lg border border-border px-3.5 py-2 text-[13px] font-bold transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setConfirmMaintenance(false);
                void save(
                  { maintenance: { enabled: true, message: maintenance.message } },
                  "Maintenance mode is now on",
                );
              }}
              className="rounded-lg bg-destructive px-3.5 py-2 text-[13px] font-bold text-destructive-foreground transition hover:opacity-90"
            >
              Turn on
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function SettingList({
  title,
  eyebrow,
  icon,
  rows,
  onChange,
  onSave,
  saving,
}: {
  title: string;
  eyebrow: string;
  icon: typeof Coins;
  rows: FeeSetting[];
  onChange: (rows: FeeSetting[]) => void;
  onSave: () => void;
  saving?: boolean;
}) {
  return (
    <Panel
      title={title}
      eyebrow={eyebrow}
      icon={icon}
      action={
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground transition hover:opacity-90"
        >
          Save changes
        </button>
      }
    >
      <ul className="divide-y divide-border/60">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0 last:pb-0">
            <div className="min-w-[14rem] flex-1">
              <p className="text-[13.5px] font-bold">{row.label}</p>
              <p className="text-[12.5px] text-muted-foreground">{row.note}</p>
            </div>
            <input
              value={row.value}
              onChange={(e) =>
                onChange(rows.map((r) => (r.id === row.id ? { ...r, value: e.target.value } : r)))
              }
              className="w-40 rounded-lg border border-border bg-card px-3 py-2 text-right text-[13.5px] font-bold outline-none transition focus:border-brand"
            />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
