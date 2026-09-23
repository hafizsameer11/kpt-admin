import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BellRing, Mail, Pause, Send } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import {
  CAMPAIGN_STATUS_LABEL,
  CAMPAIGN_STATUS_TONE,
  CHANNEL_LABEL,
  findCampaign,
  hydrateAdminCampaignsFromApi,
  type Campaign,
} from "@/lib/admin-marketing-data";
import { updateAdminCampaign } from "@/lib/admin-api";

export const Route = createFileRoute("/marketing_/campaigns_/$campaignId")({
  head: () => ({
    meta: [
      { title: "Campaign detail — Kipit Admin Console" },
      {
        name: "description",
        content: "Campaign content, audience, delivery status and engagement performance.",
      },
      { property: "og:title", content: "Campaign detail — Kipit Admin Console" },
      { property: "og:description", content: "Single campaign view for Kipit marketing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CampaignDetailPage,
});

function CampaignDetailPage() {
  const { campaignId } = Route.useParams();
  const [campaign, setCampaign] = useState<Campaign | undefined>(() => findCampaign(campaignId));

  useEffect(() => {
    void hydrateAdminCampaignsFromApi().then(() => setCampaign(findCampaign(campaignId)));
  }, [campaignId]);

  if (!campaign) {
    return (
      <AdminShell title="Campaign not found" subtitle="ADM-101">
        <Panel>
          <p className="text-[13.5px] text-muted-foreground">This campaign no longer exists.</p>
          <Link
            to="/marketing/campaigns"
            className="mt-4 inline-flex rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground"
          >
            Back to campaigns
          </Link>
        </Panel>
      </AdminShell>
    );
  }

  const Icon = campaign.channel === "push" ? BellRing : Mail;
  const openRate =
    campaign.delivered && campaign.opened
      ? Math.round((campaign.opened / campaign.delivered) * 100)
      : null;
  const clickRate =
    campaign.delivered && campaign.clicked
      ? Math.round((campaign.clicked / campaign.delivered) * 100)
      : null;

  return (
    <AdminShell title={campaign.name} subtitle={`ADM-101 · ${campaign.id.toUpperCase()}`}>
      <Link
        to="/marketing/campaigns"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to campaigns
      </Link>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Reach" value={campaign.reach.toLocaleString("en-NG")} helper={campaign.audience} tone="brand" icon={Icon} />
        <Stat
          label="Delivered"
          value={campaign.delivered ? campaign.delivered.toLocaleString("en-NG") : "—"}
          helper="Successful deliveries"
        />
        <Stat label="Open rate" value={openRate !== null ? `${openRate}%` : "—"} helper="Opened the message" tone="gold" />
        <Stat label="Click rate" value={clickRate !== null ? `${clickRate}%` : "—"} helper="Tapped the CTA" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <Panel title="Message" eyebrow={CHANNEL_LABEL[campaign.channel]}>
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Kipit
              </p>
              <p className="mt-1 text-[15px] font-extrabold">{campaign.title}</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">
                {campaign.content}
              </p>
              <span className="mt-3 inline-flex rounded-lg bg-gold px-3 py-1.5 text-[12px] font-bold text-gold-foreground">
                {campaign.cta}
              </span>
            </div>
          </div>
        </Panel>

        <Panel title="Delivery">
          <dl className="divide-y divide-border/70 text-[13px]">
            <Row label="Status" value={CAMPAIGN_STATUS_LABEL[campaign.status]} />
            <Row label="Audience" value={campaign.audience} />
            <Row label="Deep link" value={campaign.deepLink} />
            <Row label="Created by" value={campaign.createdBy} />
            <Row label="Sent at" value={campaign.sentAt ?? campaign.scheduledFor ?? "Not scheduled"} />
          </dl>

          <span
            className={`mt-4 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${CAMPAIGN_STATUS_TONE[campaign.status]}`}
          >
            {CAMPAIGN_STATUS_LABEL[campaign.status]}
          </span>

          {campaign.status !== "sent" ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  void updateAdminCampaign(campaign.id, { status: "sending" })
                    .then(() => toast.success("Campaign queued to send now"))
                    .catch((err) =>
                      toast.error(err instanceof Error ? err.message : "Could not send"),
                    );
                }}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-[13px] font-bold text-primary-foreground"
              >
                <Send className="size-4" />
                Send now
              </button>
              <button
                type="button"
                onClick={() => {
                  void updateAdminCampaign(campaign.id, { status: "paused" })
                    .then(() => toast.success("Campaign paused"))
                    .catch((err) =>
                      toast.error(err instanceof Error ? err.message : "Could not pause"),
                    );
                }}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-[13px] font-bold"
              >
                <Pause className="size-4" />
                Pause
              </button>
            </div>
          ) : null}
        </Panel>
      </div>
    </AdminShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
