import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Coins, Gift, History, ShieldCheck, Trophy, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import {
  REFERRAL_CHANGE_LOG,
  REFERRAL_LEADERS,
  REFERRAL_PROGRAMME,
  REFERRAL_RULES,
  hydrateAdminReferralsFromApi,
} from "@/lib/admin-marketing-data";
import { putAdminReferralProgramme } from "@/lib/admin-api";

export const Route = createFileRoute("/marketing_/referrals")({
  head: () => ({
    meta: [
      { title: "Referral rules — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Configure Kipit referral rewards, qualifying funding, hold periods, invite expiry and monthly caps.",
      },
      { property: "og:title", content: "Referral rules — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Reward amounts and qualification rules for the Kipit referral programme.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReferralRulesPage,
});

const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

function ReferralRulesPage() {
  const [enabled, setEnabled] = useState(REFERRAL_PROGRAMME.enabled);
  const [requiresKyc, setRequiresKyc] = useState(REFERRAL_PROGRAMME.requiresKyc);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(REFERRAL_RULES.map((r) => [r.id, r.value])),
  );
  const [baseline, setBaseline] = useState({
    enabled: REFERRAL_PROGRAMME.enabled,
    requiresKyc: REFERRAL_PROGRAMME.requiresKyc,
    values: Object.fromEntries(REFERRAL_RULES.map((r) => [r.id, r.value])),
  });
  const [stats, setStats] = useState({ ...REFERRAL_PROGRAMME });
  const [leaders, setLeaders] = useState(REFERRAL_LEADERS);
  const [changeLog, setChangeLog] = useState(REFERRAL_CHANGE_LOG);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void hydrateAdminReferralsFromApi()
      .then((data) => {
        setEnabled(data.enabled);
        setRequiresKyc(data.requiresKyc);
        setValues(data.rules);
        setBaseline({
          enabled: data.enabled,
          requiresKyc: data.requiresKyc,
          values: { ...data.rules },
        });
        setStats({ ...data.stats });
        setLeaders([...data.leaders]);
        setChangeLog([...data.changeLog]);
      })
      .finally(() => setLoading(false));
  }, []);

  const dirty = useMemo(() => {
    if (enabled !== baseline.enabled || requiresKyc !== baseline.requiresKyc) return true;
    return REFERRAL_RULES.some((r) => (values[r.id] ?? "") !== (baseline.values[r.id] ?? ""));
  }, [enabled, requiresKyc, values, baseline]);

  const setValue = (id: string, raw: string) =>
    setValues((v) => ({ ...v, [id]: raw.replace(/[^0-9]/g, "") }));

  const display = (id: string, kind: string) => {
    const n = Number(values[id] || 0);
    if (kind === "amount") return n.toLocaleString("en-NG");
    return values[id] ?? "";
  };

  const conversion =
    stats.invitesSent > 0 ? Math.round((stats.invitesQualified / stats.invitesSent) * 100) : 0;

  async function saveRules() {
    setSaving(true);
    try {
      const rules = Object.fromEntries(
        REFERRAL_RULES.map((r) => [r.id, String(values[r.id] ?? "0").replace(/\D/g, "") || "0"]),
      );
      const saved = await putAdminReferralProgramme({
        enabled,
        requiresKyc,
        rules,
      });
      const nextValues = {
        ...Object.fromEntries(REFERRAL_RULES.map((r) => [r.id, r.value])),
        ...(saved.rules ?? rules),
      };
      for (const rule of REFERRAL_RULES) {
        if (nextValues[rule.id] != null) rule.value = String(nextValues[rule.id]);
      }
      setValues(nextValues);
      setEnabled(saved.enabled);
      setRequiresKyc(saved.requiresKyc);
      setBaseline({
        enabled: saved.enabled,
        requiresKyc: saved.requiresKyc,
        values: { ...nextValues },
      });
      setChangeLog(saved.changeLog ?? []);
      setStats((s) => ({
        ...s,
        enabled: saved.enabled,
        requiresKyc: saved.requiresKyc,
        updatedAt: saved.updatedAt ? new Date(saved.updatedAt).toLocaleString("en-NG") : s.updatedAt,
        updatedBy: saved.updatedBy ?? s.updatedBy,
      }));
      toast.success("Referral rules saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save referral rules");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell
      title="Referral rules"
      subtitle="ADM-100 · reward amounts, qualification rules and payout caps"
    >
      <Link
        to="/marketing"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to marketing
      </Link>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Invites sent"
          value={stats.invitesSent.toLocaleString("en-NG")}
          helper="Users who signed up with a code"
          icon={Users}
        />
        <Stat
          label="Qualified referrals"
          value={stats.invitesQualified.toLocaleString("en-NG")}
          helper={`${conversion}% conversion`}
          tone="gold"
          icon={Gift}
        />
        <Stat
          label="Rewards paid"
          value={naira(stats.rewardsPaid)}
          helper="Credited to wallets"
          tone="brand"
          icon={Coins}
        />
        <Stat
          label="Last updated"
          value={stats.updatedAt === "—" ? "—" : stats.updatedAt.split(",")[0] ?? stats.updatedAt}
          helper={stats.updatedBy === "—" ? "No saved changes yet" : `By ${stats.updatedBy}`}
          icon={ShieldCheck}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel
          title="Programme rules"
          action={
            <button
              type="button"
              disabled={!dirty || saving || loading}
              onClick={() => void saveRules()}
              className="inline-flex h-9 items-center rounded-lg bg-brand px-3 text-[12.5px] font-bold text-primary-foreground disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          }
        >
          <div className="flex flex-wrap gap-4 border-b border-border/70 px-5 py-4">
            <label className="flex items-center gap-2 text-[13px] font-semibold">
              <input
                type="checkbox"
                checked={enabled}
                disabled={loading}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Programme enabled
            </label>
            <label className="flex items-center gap-2 text-[13px] font-semibold">
              <input
                type="checkbox"
                checked={requiresKyc}
                disabled={loading}
                onChange={(e) => setRequiresKyc(e.target.checked)}
              />
              Require KYC before reward
            </label>
          </div>
          <div className="divide-y divide-border/60">
            {REFERRAL_RULES.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-[13.5px] font-bold">{r.label}</p>
                  <p className="text-[12px] text-muted-foreground">{r.helper}</p>
                </div>
                <input
                  value={display(r.id, r.kind)}
                  disabled={loading}
                  onChange={(e) => setValue(r.id, e.target.value)}
                  className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-right text-[13.5px] font-bold tabular-nums outline-none focus:border-brand disabled:opacity-50"
                />
              </div>
            ))}
          </div>
          <p className="border-t border-border/70 px-5 py-3 text-[12px] text-muted-foreground">
            {dirty ? "You have unsaved changes." : "No rule changes."}
          </p>
        </Panel>

        <div className="space-y-4">
          <Panel title="Top inviters" icon={Trophy}>
            {leaders.length === 0 ? (
              <p className="px-5 py-8 text-[13px] text-muted-foreground">No referral leaders yet.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {leaders.map((l) => (
                  <li key={l.name} className="flex items-center justify-between px-5 py-3">
                    <span className="text-[13px] font-semibold">{l.name}</span>
                    <span className="text-[12px] text-muted-foreground">
                      {l.qualified}/{l.invites} qualified
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Change log" icon={History}>
            {changeLog.length === 0 ? (
              <p className="px-5 py-8 text-[13px] text-muted-foreground">No rule changes recorded.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {changeLog.map((c) => (
                  <li key={`${c.at}-${c.change}`} className="px-5 py-3">
                    <p className="text-[13px] font-semibold">{c.change}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {new Date(c.at).toLocaleString("en-NG")} · {c.by} · {c.status}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </AdminShell>
  );
}
