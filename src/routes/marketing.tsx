import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BellRing,
  BookOpen,
  CalendarClock,
  Gift,
  LayoutList,
  Mail,
  Megaphone,
  MousePointerClick,
  Users,
} from "lucide-react";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import {
  CAMPAIGN_STATUS_LABEL,
  CAMPAIGN_STATUS_TONE,
  CHANNEL_LABEL,
  DIGEST_DEFAULTS,
  hydrateAdminCampaignsFromApi,
  hydrateAdminDigestFromApi,
  hydrateAdminFeedFromApi,
  type Campaign,
  type DigestDefaults,
  type FeedCard,
} from "@/lib/admin-marketing-data";

export const Route = createFileRoute("/marketing")({
  head: () => ({
    meta: [
      { title: "Marketing dashboard — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Campaigns, push and email messaging, home feed cards, education content, referral rules and the daily portfolio digest.",
      },
      { property: "og:title", content: "Marketing dashboard — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Growth and lifecycle messaging controls for Kipit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MarketingPage,
});

const MODULES = [
  {
    label: "Campaigns",
    helper: "Push and email sends, drafts and performance",
    icon: Megaphone,
    to: "/marketing/campaigns" as const,
  },
  {
    label: "Audience segmentation",
    helper: "Tier, investment status and custom audiences",
    icon: Users,
    to: "/marketing/audience" as const,
  },
  {
    label: "Home feed manager",
    helper: "Cards shown on the app home screen",
    icon: LayoutList,
    to: "/marketing/feed" as const,
  },
  {
    label: "Daily digest",
    helper: "Portfolio summary schedule and audience",
    icon: CalendarClock,
    to: "/marketing/digest" as const,
  },
  {
    label: "Educational content",
    helper: "Learn articles surfaced in the app",
    icon: BookOpen,
    to: "/marketing/feed" as const,
  },
  {
    label: "Referral rules",
    helper: "Reward amounts and qualification rules",
    icon: Gift,
    to: "/marketing/referrals" as const,
  },
];

function MarketingPage() {
  const [feedCards, setFeedCards] = useState<FeedCard[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [digest, setDigest] = useState<DigestDefaults>(DIGEST_DEFAULTS);
  const scheduled = campaigns.filter((c) => c.status === "scheduled" || c.status === "sending");
  const sent = campaigns.filter((c) => c.status === "sent");
  const openRate = Math.round(
    (sent.reduce((a, c) => a + (c.opened ?? 0), 0) /
      Math.max(
        1,
        sent.reduce((a, c) => a + (c.delivered ?? 0), 0),
      )) *
      100,
  );

  useEffect(() => {
    void hydrateAdminFeedFromApi().then(setFeedCards);
    void hydrateAdminCampaignsFromApi().then(setCampaigns);
    void hydrateAdminDigestFromApi().then(setDigest);
  }, []);

  return (
    <AdminShell
      title="Marketing"
      subtitle="ADM-100 · campaigns, feed, education, referrals and digest"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Live & scheduled"
          value={String(scheduled.length)}
          helper="Campaigns queued to send"
          tone="gold"
          icon={BellRing}
        />
        <Stat
          label="Reach this month"
          value={`${(sent.reduce((a, c) => a + c.reach, 0) / 1000).toFixed(1)}k`}
          helper="Customers messaged"
          tone="brand"
          icon={Mail}
        />
        <Stat label="Average open rate" value={`${openRate}%`} helper="Across sent campaigns" icon={MousePointerClick} />
        <Stat
          label="Published feed cards"
          value={String(feedCards.filter((c) => c.status === "published").length)}
          helper="Visible on app home"
          icon={LayoutList}
        />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.label}
              to={m.to}
              className="group rounded-2xl border border-border/80 bg-card p-5 transition hover:border-brand/40 hover:shadow-[0_16px_40px_-28px_rgba(11,29,58,0.55)]"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand transition group-hover:bg-brand group-hover:text-primary-foreground">
                <Icon className="size-5" />
              </span>
              <p className="mt-3 text-[14.5px] font-extrabold">{m.label}</p>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">{m.helper}</p>
            </Link>
          );
        })}
      </div>

      <Panel
        className="mt-5 overflow-hidden"
        title="Recent campaigns"
        eyebrow="Push and email"
        action={
          <Link
            to="/marketing/campaigns"
            className="rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-bold transition hover:border-brand/40 hover:text-brand"
          >
            View all
          </Link>
        }
      >
        <ul className="divide-y divide-border/70">
          {campaigns.slice(0, 4).map((c) => (
            <li key={c.id}>
              <Link
                to="/marketing/campaigns/$campaignId"
                params={{ campaignId: c.id }}
                className="flex items-center gap-4 py-3 transition hover:bg-muted/40"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                  {c.channel === "push" ? <BellRing className="size-4" /> : <Mail className="size-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-bold">{c.name}</span>
                  <span className="block truncate text-[12px] text-muted-foreground">
                    {CHANNEL_LABEL[c.channel]} · {c.audience}
                  </span>
                </span>
                <span className="hidden text-right sm:block">
                  <span className="block text-[13px] font-extrabold tabular-nums">
                    {c.reach.toLocaleString("en-NG")}
                  </span>
                  <span className="block text-[11.5px] text-muted-foreground">Reach</span>
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${CAMPAIGN_STATUS_TONE[c.status]}`}
                >
                  {CAMPAIGN_STATUS_LABEL[c.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="mt-5" title="Daily digest" eyebrow="ADM-105">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Status
            </p>
            <p className="mt-1 text-[14px] font-extrabold text-emerald-700">
              {digest.enabled ? "Enabled" : "Disabled"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Send time
            </p>
            <p className="mt-1 text-[14px] font-extrabold tabular-nums">{digest.sendTime}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Delivered yesterday
            </p>
            <p className="mt-1 text-[14px] font-extrabold tabular-nums">
              {digest.deliveredYesterday.toLocaleString("en-NG")}
            </p>
          </div>
          <Link
            to="/marketing/digest"
            className="ml-auto rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground"
          >
            Manage digest
          </Link>
        </div>
      </Panel>
    </AdminShell>
  );
}
