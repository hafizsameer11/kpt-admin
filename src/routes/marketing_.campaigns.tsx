import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BellRing, Mail, Plus, Search } from "lucide-react";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel } from "@/components/kipit/AdminBits";
import {
  CAMPAIGN_STATUS_LABEL,
  CAMPAIGN_STATUS_TONE,
  CHANNEL_LABEL,
  hydrateAdminCampaignsFromApi,
  type Campaign,
  type CampaignStatus,
} from "@/lib/admin-marketing-data";

export const Route = createFileRoute("/marketing_/campaigns")({
  head: () => ({
    meta: [
      { title: "Campaigns — Kipit Admin Console" },
      {
        name: "description",
        content: "All Kipit push and email campaigns with audience, reach, status and performance.",
      },
      { property: "og:title", content: "Campaigns — Kipit Admin Console" },
      { property: "og:description", content: "Push and email campaign list for Kipit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CampaignsPage,
});

const TABS: ("all" | CampaignStatus)[] = ["all", "draft", "scheduled", "sending", "sent"];

function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tab, setTab] = useState<"all" | CampaignStatus>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void hydrateAdminCampaignsFromApi().then(setCampaigns);
  }, []);

  const q = query.trim().toLowerCase();
  const rows = campaigns.filter(
    (c) =>
      (tab === "all" || c.status === tab) &&
      (q === "" || [c.name, c.audience, c.title].join(" ").toLowerCase().includes(q)),
  );

  return (
    <AdminShell title="Campaigns" subtitle="ADM-101 · push and email messaging">
      <Link
        to="/marketing"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to marketing
      </Link>

      <Panel className="overflow-hidden">
        <div className="-m-5">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/70 px-5 py-4">
            <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-md px-3 py-1.5 text-[12.5px] font-bold transition ${
                    tab === t
                      ? "bg-brand text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "all" ? "All" : CAMPAIGN_STATUS_LABEL[t]}
                </button>
              ))}
            </div>

            <label className="relative ml-auto w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search campaigns"
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-[13px] outline-none transition focus:border-brand/50"
              />
            </label>

            <Link
              to="/marketing/campaigns/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground transition hover:opacity-95"
            >
              <Plus className="size-4" />
              Create campaign
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[62rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="px-5 py-2.5">Campaign</th>
                  <th className="px-5 py-2.5">Channel</th>
                  <th className="px-5 py-2.5">Audience</th>
                  <th className="px-5 py-2.5 text-right">Reach</th>
                  <th className="px-5 py-2.5 text-right">Open rate</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-border/60 transition hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <span className="block text-[13.5px] font-bold">{c.name}</span>
                      <span className="block text-[12px] text-muted-foreground">{c.title}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold">
                        {c.channel === "push" ? (
                          <BellRing className="size-3.5 text-brand" />
                        ) : (
                          <Mail className="size-3.5 text-brand" />
                        )}
                        {CHANNEL_LABEL[c.channel]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-muted-foreground">{c.audience}</td>
                    <td className="px-5 py-3 text-right text-[13px] font-bold tabular-nums">
                      {c.reach.toLocaleString("en-NG")}
                    </td>
                    <td className="px-5 py-3 text-right text-[13px] tabular-nums">
                      {c.delivered && c.opened
                        ? `${Math.round((c.opened / c.delivered) * 100)}%`
                        : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${CAMPAIGN_STATUS_TONE[c.status]}`}
                      >
                        {CAMPAIGN_STATUS_LABEL[c.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to="/marketing/campaigns/$campaignId"
                        params={{ campaignId: c.id }}
                        className="rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-bold transition hover:border-brand/40 hover:text-brand"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? (
              <p className="px-5 py-14 text-center text-[13px] text-muted-foreground">
                No campaigns match this view.
              </p>
            ) : null}
          </div>
        </div>
      </Panel>
    </AdminShell>
  );
}
