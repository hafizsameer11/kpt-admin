import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BellRing, Check, Mail, Send } from "lucide-react";
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
import { SEGMENTS, type CampaignChannel } from "@/lib/admin-marketing-data";

export const Route = createFileRoute("/marketing_/campaigns_/new")({
  head: () => ({
    meta: [
      { title: "Create campaign — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Compose a Kipit push or email campaign: name, audience, title, content, call to action and deep link.",
      },
      { property: "og:title", content: "Create campaign — Kipit Admin Console" },
      { property: "og:description", content: "Campaign composer for Kipit growth messaging." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CreateCampaignPage,
});

const DEEP_LINKS = ["/invest", "/call-account", "/explore", "/portfolio/maturities", "/settings/referrals", "/verification"];

function CreateCampaignPage() {
  const navigate = useNavigate();
  const [channel, setChannel] = useState<CampaignChannel>("push");
  const [name, setName] = useState("");
  const [segmentId, setSegmentId] = useState(SEGMENTS[1]?.id ?? "seg-all");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [cta, setCta] = useState("View rates");
  const [deepLink, setDeepLink] = useState(DEEP_LINKS[0] ?? "/invest");
  const [touched, setTouched] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const segment = SEGMENTS.find((s) => s.id === segmentId) ?? SEGMENTS[0]!;
  const valid = name.trim() && title.trim() && content.trim();

  return (
    <AdminShell title="Create campaign" subtitle="ADM-101 · push or email">
      <Link
        to="/marketing/campaigns"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to campaigns
      </Link>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <Panel title="Channel">
            <div className="grid gap-3 sm:grid-cols-2">
              {(["push", "email"] as CampaignChannel[]).map((ch) => {
                const active = channel === ch;
                const Icon = ch === "push" ? BellRing : Mail;
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannel(ch)}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                      active ? "border-brand bg-brand/5" : "border-border hover:border-brand/40"
                    }`}
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-brand/10 text-brand">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-bold">
                        {ch === "push" ? "Push notification" : "Email"}
                      </span>
                      <span className="block text-[12px] text-muted-foreground">
                        {ch === "push" ? "Short, in-app deep link" : "Longer copy with CTA button"}
                      </span>
                    </span>
                    {active ? <Check className="ml-auto size-4 text-brand" /> : null}
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel title="Campaign details">
            <Field label="Campaign name" error={touched && !name.trim()}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. September rate refresh"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand/50"
              />
            </Field>

            <Field label="Audience">
              <select
                value={segmentId}
                onChange={(e) => setSegmentId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand/50"
              >
                {SEGMENTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.size.toLocaleString("en-NG")} customers
                  </option>
                ))}
              </select>
              <Link
                to="/marketing/audience"
                className="mt-1.5 inline-block text-[12px] font-bold text-brand"
              >
                Build a custom audience
              </Link>
            </Field>

            <Field label="Title" error={touched && !title.trim()}>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="New 90-day rate: 17.25%"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand/50"
              />
            </Field>

            <Field label="Content" error={touched && !content.trim()}>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Write the message customers will read."
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand/50"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Call to action">
                <input
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand/50"
                />
              </Field>
              <Field label="Deep link">
                <select
                  value={deepLink}
                  onChange={(e) => setDeepLink(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand/50"
                >
                  {DEEP_LINKS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Preview" eyebrow={channel === "push" ? "Lock screen" : "Inbox"}>
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <div className="rounded-xl bg-card p-4 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  Kipit
                </p>
                <p className="mt-1 text-[14px] font-extrabold">
                  {title.trim() || "Your title appears here"}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {content.trim() || "Your message body appears here."}
                </p>
                <span className="mt-3 inline-flex rounded-lg bg-gold px-3 py-1.5 text-[12px] font-bold text-gold-foreground">
                  {cta || "Open Kipit"}
                </span>
              </div>
            </div>

            <dl className="mt-4 divide-y divide-border/70 text-[13px]">
              <RowKV label="Audience" value={segment.name} />
              <RowKV label="Estimated reach" value={segment.size.toLocaleString("en-NG")} />
              <RowKV label="Destination" value={deepLink} />
            </dl>
          </Panel>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  try {
                    const { createAdminCampaign } = await import("@/lib/admin-api");
                    await createAdminCampaign({
                      name: title.trim() || "Untitled campaign",
                      subject: title.trim(),
                      body: content.trim(),
                      audience: segment.name,
                      channel: "push",
                      status: "draft",
                    });
                    toast.success("Campaign saved as draft");
                    navigate({ to: "/marketing/campaigns" });
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not save");
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
                setConfirmOpen(true);
              }}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-3 text-[13.5px] font-bold text-primary-foreground"
            >
              <Send className="size-4" />
              Schedule send
            </button>
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule this campaign?</DialogTitle>
            <DialogDescription>
              {`"${title.trim()}" will be sent to ${segment.size.toLocaleString("en-NG")} customers in ${segment.name}.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="rounded-lg border border-border px-3.5 py-2 text-[12.5px] font-bold"
            >
              Keep editing
            </button>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  try {
                    const { createAdminCampaign } = await import("@/lib/admin-api");
                    await createAdminCampaign({
                      name: title.trim() || "Untitled campaign",
                      subject: title.trim(),
                      body: content.trim(),
                      audience: segment.name,
                      channel: "push",
                      status: "scheduled",
                      scheduledAt: new Date().toISOString(),
                    });
                    setConfirmOpen(false);
                    toast.success("Campaign scheduled");
                    navigate({ to: "/marketing/campaigns" });
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not schedule");
                  }
                })();
              }}
              className="rounded-lg bg-brand px-3.5 py-2 text-[12.5px] font-bold text-primary-foreground"
            >
              Schedule campaign
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Field({
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

function RowKV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
