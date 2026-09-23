import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarClock, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import {
  hydrateAdminDigestFromApi,
  SEGMENTS,
  type DigestDefaults,
} from "@/lib/admin-marketing-data";
import { AdminApiError, putAdminDigest } from "@/lib/admin-api";

export const Route = createFileRoute("/marketing_/digest")({
  head: () => ({
    meta: [
      { title: "Daily digest settings — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Enable or disable the Kipit daily portfolio digest, set the send time and choose the audience.",
      },
      { property: "og:title", content: "Daily digest settings — Kipit Admin Console" },
      { property: "og:description", content: "Schedule the Kipit daily portfolio digest." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DigestPage,
});

function DigestPage() {
  const [digest, setDigest] = useState<DigestDefaults>({
    enabled: false,
    sendTime: "07:30",
    audience: "seg-active",
    lastRun: "—",
    deliveredYesterday: 0,
    openRate: 0,
  });
  const [enabled, setEnabled] = useState(false);
  const [sendTime, setSendTime] = useState("07:30");
  const [audience, setAudience] = useState("seg-active");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void hydrateAdminDigestFromApi().then((d) => {
      setDigest(d);
      setEnabled(d.enabled);
      setSendTime(d.sendTime);
      setAudience(d.audience);
    });
  }, []);

  const segment = SEGMENTS.find((s) => s.id === audience) ?? SEGMENTS[0]!;
  const lastRunParts = digest.lastRun.split(" ");

  async function saveSettings(nextEnabled = enabled) {
    setSaving(true);
    try {
      const saved = await putAdminDigest({
        enabled: nextEnabled,
        sendTime,
        audience,
      });
      setDigest({
        enabled: saved.enabled,
        sendTime: saved.sendTime,
        audience: saved.audience,
        lastRun: saved.lastRun ?? "—",
        deliveredYesterday: saved.deliveredYesterday,
        openRate: saved.openRate,
      });
      setEnabled(saved.enabled);
      setSendTime(saved.sendTime);
      setAudience(saved.audience);
      toast.success("Digest settings saved");
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Could not save digest settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell title="Daily digest" subtitle="ADM-105 · portfolio summary assembled from live data">
      <Link
        to="/marketing"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to marketing
      </Link>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat
          label="Last run"
          value={lastRunParts[1] ?? lastRunParts[0] ?? "—"}
          helper={digest.lastRun}
          tone="brand"
          icon={CalendarClock}
        />
        <Stat
          label="Delivered yesterday"
          value={digest.deliveredYesterday.toLocaleString("en-NG")}
          helper="Digest emails sent"
          icon={MailCheck}
        />
        <Stat label="Open rate" value={`${digest.openRate}%`} helper="30-day average" tone="gold" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <Panel title="Schedule">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
            <div>
              <p className="text-[13.5px] font-bold">Daily portfolio digest</p>
              <p className="text-[12.5px] text-muted-foreground">
                Sends each customer their balance, interest earned and upcoming maturities.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              disabled={saving}
              onClick={() => {
                const next = !enabled;
                setEnabled(next);
                toast.success(next ? "Daily digest enabled" : "Daily digest disabled");
              }}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                enabled ? "bg-brand" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${
                  enabled ? "left-[1.375rem]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Send time
              </p>
              <input
                type="time"
                value={sendTime}
                onChange={(e) => setSendTime(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand/50"
              />
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Audience
              </p>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand/50"
              >
                {SEGMENTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.size.toLocaleString("en-NG")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => void saveSettings()}
            className="mt-5 w-full rounded-xl bg-brand px-4 py-3 text-[13.5px] font-bold text-primary-foreground"
          >
            Save settings
          </button>
        </Panel>

        <Panel title="Preview" eyebrow="What customers receive">
          <div className="rounded-2xl border border-border p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Kipit · {sendTime}
            </p>
            <p className="mt-1 text-[15px] font-extrabold">Your Kipit summary</p>
            <ul className="mt-3 space-y-2 text-[13px] text-muted-foreground">
              <li>Portfolio value and change since yesterday</li>
              <li>Interest accrued in the last 24 hours</li>
              <li>Wallet and Call Account balances</li>
              <li>Maturities due in the next 7 days</li>
            </ul>
            <span className="mt-4 inline-flex rounded-lg bg-gold px-3.5 py-2 text-[12.5px] font-bold text-gold-foreground">
              View portfolio
            </span>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            Going to {segment.name} · {segment.size.toLocaleString("en-NG")} customers
            {enabled ? "" : " · currently paused"}
          </p>
        </Panel>
      </div>
    </AdminShell>
  );
}
