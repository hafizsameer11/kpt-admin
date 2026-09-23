import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Coins, Gift, History, ShieldCheck, Trophy, Users } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [stats, setStats] = useState({ ...REFERRAL_PROGRAMME });
  const [leaders, setLeaders] = useState(REFERRAL_LEADERS);
  const dirty = REFERRAL_RULES.some((r) => values[r.id] !== r.value);

  useEffect(() => {
    void hydrateAdminReferralsFromApi().then((s) => {
      setStats({ ...s });
      setLeaders([...REFERRAL_LEADERS]);
    });
  }, []);

  const setValue = (id: string, raw: string) =>
    setValues((v) => ({ ...v, [id]: raw.replace(/[^0-9]/g, "") }));

  const display = (id: string, kind: string) => {
    const n = Number(values[id] || 0);
    if (kind === "amount") return n.toLocaleString("en-NG");
    return values[id];
  };

  const conversion =
    stats.invitesSent > 0 ? Math.round((stats.invitesQualified / stats.invitesSent) * 100) : 0;

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
          label="Awaiting approval"
          value={String(stats.pendingApproval)}
          helper="Rule changes in maker-checker"
          icon={ShieldCheck}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel
          title="Programme rules"
          action={
            <button
              type="button"
              disabled={!dirty}
              onClick={() => toast.success("Rule change submitted for approval")}
              className="inline-flex h-9 items-center rounded-lg bg-brand px-3 text-[12.5px] font-bold text-primary-foreground disabled:opacity-40"
            >
              Submit for approval
            </button>
          }
        >
          <div className="flex flex-wrap gap-4 border-b border-border/70 px-5 py-4">
            <label className="flex items-center gap-2 text-[13px] font-semibold">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              Programme enabled
            </label>
            <label className="flex items-center gap-2 text-[13px] font-semibold">
              <input
                type="checkbox"
                checked={requiresKyc}
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
                  onChange={(e) => setValue(r.id, e.target.value)}
                  className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-right text-[13.5px] font-bold tabular-nums outline-none focus:border-brand"
                />
              </div>
            ))}
          </div>
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
            {REFERRAL_CHANGE_LOG.length === 0 ? (
              <p className="px-5 py-8 text-[13px] text-muted-foreground">No rule changes recorded.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {REFERRAL_CHANGE_LOG.map((c) => (
                  <li key={`${c.at}-${c.change}`} className="px-5 py-3">
                    <p className="text-[13px] font-semibold">{c.change}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {c.at} · {c.by} · {c.status}
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
