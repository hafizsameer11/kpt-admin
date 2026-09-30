import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel } from "@/components/kipit/AdminBits";
import { findFeedCard, hydrateAdminFeedFromApi } from "@/lib/admin-marketing-data";
import { updateAdminFeedCard } from "@/lib/admin-api";

export const Route = createFileRoute("/marketing_/feed_/$cardId")({
  component: EditFeedCardPage,
});

function EditFeedCardPage() {
  const { cardId } = useParams({ from: "/marketing_/feed_/$cardId" });
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [destination, setDestination] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void hydrateAdminFeedFromApi().then(() => {
      const card = findFeedCard(cardId);
      if (card) {
        setTitle(card.title);
        setDescription(card.description);
        setDestination(card.destination === "—" ? "" : card.destination);
      }
      setReady(true);
    });
  }, [cardId]);

  if (!ready) {
    return (
      <AdminShell title="Edit feed card" subtitle="Loading…">
        <p className="text-[13px] text-muted-foreground">Loading card…</p>
      </AdminShell>
    );
  }

  const card = findFeedCard(cardId);
  if (!card) {
    return (
      <AdminShell title="Edit feed card" subtitle="Not found">
        <Panel className="p-8 text-center">
          <p className="text-[13px] text-muted-foreground">This feed card no longer exists.</p>
          <Link to="/marketing/feed" className="mt-4 inline-block text-[13px] font-bold text-brand">
            Back to feed manager
          </Link>
        </Panel>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Edit home feed card" subtitle={`ADM-104 · ${card.id}`}>
      <Link
        to="/marketing/feed"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to home feed
      </Link>

      <Panel title="Card content">
        <label className="mb-4 block">
          <span className="mb-1.5 block text-[12px] font-bold">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand/50"
          />
        </label>
        <label className="mb-4 block">
          <span className="mb-1.5 block text-[12px] font-bold">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand/50"
          />
        </label>
        <label className="mb-4 block">
          <span className="mb-1.5 block text-[12px] font-bold">Destination link</span>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand/50"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            void updateAdminFeedCard(cardId, {
              title: title.trim(),
              body: description.trim(),
              href: destination.trim() || null,
            })
              .then(() => {
                toast.success("Feed card updated");
                navigate({ to: "/marketing/feed" });
              })
              .catch((err) => toast.error(err instanceof Error ? err.message : "Could not save"));
          }}
          className="rounded-xl bg-brand px-4 py-3 text-[13.5px] font-bold text-primary-foreground"
        >
          Save changes
        </button>
      </Panel>
    </AdminShell>
  );
}
