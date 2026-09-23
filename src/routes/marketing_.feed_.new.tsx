import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel } from "@/components/kipit/AdminBits";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/marketing_/feed_/new")({
  head: () => ({
    meta: [
      { title: "Create home feed card — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Compose a Kipit home feed card with title, description, image, call to action and destination deep link.",
      },
      { property: "og:title", content: "Create home feed card — Kipit Admin Console" },
      { property: "og:description", content: "Home feed card composer for the Kipit app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CreateFeedCardPage,
});

const DESTINATIONS = [
  "/invest",
  "/call-account",
  "/explore",
  "/learn",
  "/portfolio/maturities",
  "/settings/referrals",
];

function CreateFeedCardPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [cta, setCta] = useState("Read now");
  const [destination, setDestination] = useState(DESTINATIONS[0] ?? "/invest");
  const [touched, setTouched] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const valid = title.trim() !== "" && description.trim() !== "" && image !== "";

  return (
    <AdminShell title="Create home feed card" subtitle="ADM-104 · appears on the app home screen">
      <Link
        to="/marketing/feed"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to home feed
      </Link>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Card content">
          <Labeled label="Title" error={touched && !title.trim()}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Rates just moved"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand/50"
            />
          </Labeled>

          <Labeled label="Description" error={touched && !description.trim()}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="One or two lines of supporting copy."
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand/50"
            />
          </Labeled>

          <Labeled label="Image" error={touched && !image}>
            <button
              type="button"
              onClick={() => setImageOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border px-4 py-4 text-left transition hover:border-brand/50"
            >
              <span className="grid size-10 place-items-center rounded-lg bg-brand/10 text-brand">
                <ImagePlus className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-bold">
                  {image || "Choose a card image"}
                </span>
                <span className="block text-[12px] text-muted-foreground">
                  Recommended 1200 × 800, navy or gold treatment
                </span>
              </span>
            </button>
          </Labeled>

          <div className="grid gap-4 sm:grid-cols-2">
            <Labeled label="Call to action">
              <input
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand/50"
              />
            </Labeled>
            <Labeled label="Destination">
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand/50"
              >
                {DESTINATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Labeled>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Preview" eyebrow="App home">
            <div className="overflow-hidden rounded-2xl bg-brand-gradient p-5 text-primary-foreground">
              <div className="grid h-32 place-items-center rounded-xl bg-white/10 text-[12px] font-bold text-primary-foreground/70">
                {image || "Image preview"}
              </div>
              <p className="mt-4 text-[16px] font-extrabold">
                {title.trim() || "Card title appears here"}
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-primary-foreground/75">
                {description.trim() || "Supporting copy appears here."}
              </p>
              <span className="mt-4 inline-flex rounded-lg bg-gold px-3.5 py-2 text-[12.5px] font-bold text-gold-foreground">
                {cta || "Read now"}
              </span>
            </div>
            <p className="mt-3 text-[12px] text-muted-foreground">Taps open {destination}</p>
          </Panel>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  try {
                    const { createAdminFeedCard } = await import("@/lib/admin-api");
                    await createAdminFeedCard({
                      title: title.trim(),
                      body: description.trim(),
                      href: destination,
                      active: false,
                      kind: "promo",
                    });
                    toast.success("Feed card saved as draft");
                    navigate({ to: "/marketing/feed" });
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not save draft");
                  }
                })();
              }}
              className="flex-1 rounded-xl border border-border px-4 py-3 text-[13.5px] font-bold"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={() => {
                setTouched(true);
                if (!valid) return;
                setPublishOpen(true);
              }}
              className="flex-1 rounded-xl bg-brand px-4 py-3 text-[13.5px] font-bold text-primary-foreground"
            >
              Publish card
            </button>
          </div>
        </div>
      </div>

      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose card image</DialogTitle>
            <DialogDescription>Pick from the Kipit brand library.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Rates hero · navy", "Learn cover · education", "Referral card · gold", "Explore cover · bonds"].map(
              (opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setImage(opt);
                    setImageOpen(false);
                  }}
                  className={`rounded-xl border p-4 text-left text-[13px] font-bold transition ${
                    image === opt ? "border-brand bg-brand/5" : "border-border hover:border-brand/40"
                  }`}
                >
                  {opt}
                </button>
              ),
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish this card?</DialogTitle>
            <DialogDescription>
              It appears immediately on the app home feed for all customers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setPublishOpen(false)}
              className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] font-bold"
            >
              Keep editing
            </button>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  try {
                    const { createAdminFeedCard } = await import("@/lib/admin-api");
                    await createAdminFeedCard({
                      title: title.trim(),
                      body: description.trim(),
                      href: destination,
                      active: true,
                      kind: "promo",
                    });
                    setPublishOpen(false);
                    toast.success("Feed card published");
                    navigate({ to: "/marketing/feed" });
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not publish");
                  }
                })();
              }}
              className="rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground"
            >
              Publish card
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Labeled({
  label,
  error,
  children,
}: {
  label: string;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      {children}
      {error ? (
        <p className="mt-1 text-[11.5px] font-semibold text-destructive">This field is required.</p>
      ) : null}
    </div>
  );
}
