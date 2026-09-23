import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, LayoutList, Plus } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import {
  FEED_STATUS_LABEL,
  FEED_STATUS_TONE,
  hydrateAdminFeedFromApi,
  type FeedCard,
  type FeedCardStatus,
} from "@/lib/admin-marketing-data";

export const Route = createFileRoute("/marketing_/feed")({
  head: () => ({
    meta: [
      { title: "Home feed manager — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Create, edit, publish and unpublish the cards that appear on the Kipit app home feed.",
      },
      { property: "og:title", content: "Home feed manager — Kipit Admin Console" },
      { property: "og:description", content: "Manage Kipit app home feed cards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FeedManagerPage,
});

function FeedManagerPage() {
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [states, setStates] = useState<Record<string, FeedCardStatus>>({});

  useEffect(() => {
    void hydrateAdminFeedFromApi().then((loaded) => {
      setCards(loaded);
      setStates(Object.fromEntries(loaded.map((c) => [c.id, c.status])));
    });
  }, []);

  const toggle = (id: string, title: string) => {
    const next: FeedCardStatus = states[id] === "published" ? "unpublished" : "published";
    void (async () => {
      try {
        const { updateAdminFeedCard } = await import("@/lib/admin-api");
        await updateAdminFeedCard(id, { active: next === "published" });
        setStates((s) => ({ ...s, [id]: next }));
        toast.success(next === "published" ? `${title} published` : `${title} unpublished`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not update feed card");
      }
    })();
  };

  const published = Object.values(states).filter((s) => s === "published").length;

  return (
    <AdminShell title="Home feed manager" subtitle="ADM-103 · cards on the app home screen">
      <Link
        to="/marketing"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to marketing
      </Link>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Published cards" value={String(published)} helper="Live on app home" tone="brand" icon={LayoutList} />
        <Stat
          label="Impressions (30d)"
          value={`${(cards.reduce((a, c) => a + c.impressions, 0) / 1000).toFixed(1)}k`}
          helper="Card views"
        />
        <Stat
          label="Taps (30d)"
          value={cards.reduce((a, c) => a + c.taps, 0).toLocaleString("en-NG")}
          helper="Card interactions"
          tone="gold"
        />
      </div>

      <Panel
        className="mt-5"
        title="Feed cards"
        eyebrow="Ordered as shown in the app"
        action={
          <Link
            to="/marketing/feed/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground"
          >
            <Plus className="size-4" />
            Create card
          </Link>
        }
      >
        <ul className="space-y-3">
          {cards.map((c) => {
            const status = states[c.id]!;
            return (
              <li
                key={c.id}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-border p-4 transition hover:border-brand/40"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-brand-gradient text-[10px] font-bold uppercase tracking-wider text-primary-foreground/70">
                  {c.position}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-extrabold">{c.title}</span>
                  <span className="block truncate text-[12.5px] text-muted-foreground">
                    {c.description}
                  </span>
                  <span className="mt-1 block text-[11.5px] text-muted-foreground">
                    {c.image} · CTA “{c.cta}” → {c.destination}
                  </span>
                </span>
                <span className="hidden text-right sm:block">
                  <span className="block text-[13px] font-extrabold tabular-nums">
                    {c.impressions.toLocaleString("en-NG")}
                  </span>
                  <span className="block text-[11.5px] text-muted-foreground">Impressions</span>
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${FEED_STATUS_TONE[status]}`}
                >
                  {FEED_STATUS_LABEL[status]}
                </span>
                <span className="flex gap-2">
                  <Link
                    to="/marketing/feed/new"
                    className="rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-bold transition hover:border-brand/40 hover:text-brand"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggle(c.id, c.title)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-bold transition hover:border-brand/40 hover:text-brand"
                  >
                    {status === "published" ? (
                      <>
                        <EyeOff className="size-3.5" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye className="size-3.5" />
                        Publish
                      </>
                    )}
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>
    </AdminShell>
  );
}
