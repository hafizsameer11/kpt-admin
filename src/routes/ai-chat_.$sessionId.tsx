import { useEffect, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Bot, Flag, MessageSquare, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel } from "@/components/kipit/AdminBits";
import {
  INTENT_LABEL,
  OUTCOME_LABEL,
  OUTCOME_TONE,
  hydrateAdminChatSessionFromApi,
  sessionById,
} from "@/lib/admin-chat-data";

export const Route = createFileRoute("/ai-chat_/$sessionId")({
  head: () => ({
    meta: [
      { title: "Ask AI conversation — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Full Ask AI conversation transcript with intents, response cards, handoffs and moderation actions.",
      },
      { property: "og:title", content: "Ask AI conversation — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Review a single Ask AI conversation end to end.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AiChatSessionPage,
});

function AiChatSessionPage() {
  const { sessionId } = useParams({ from: "/ai-chat_/$sessionId" });
  const [session, setSession] = useState<ReturnType<typeof sessionById>>(undefined);

  useEffect(() => {
    void hydrateAdminChatSessionFromApi(sessionId).then((s) => {
      setSession(s ?? sessionById(sessionId));
    });
  }, [sessionId]);

  if (session === undefined) {
    return (
      <AdminShell title="Ask AI" subtitle="Loading…">
        <p className="text-[13px] text-muted-foreground">Loading conversation…</p>
      </AdminShell>
    );
  }

  if (!session) {
    return (
      <AdminShell title="Ask AI" subtitle="Conversation not found">
        <Panel>
          <div className="p-8 text-center">
            <p className="text-[13px] text-muted-foreground">
              This conversation is no longer available.
            </p>
            <Link
              to="/ai-chat"
              className="mt-4 inline-flex h-9 items-center rounded-lg bg-brand px-3 text-[12.5px] font-bold text-primary-foreground"
            >
              Back to Ask AI log
            </Link>
          </div>
        </Panel>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={`Conversation ${session.ref}`} subtitle={`${session.device} · ${session.startedAt}`}>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/ai-chat"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-[12.5px] font-bold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All conversations
        </Link>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${OUTCOME_TONE[session.outcome]}`}>
          {OUTCOME_LABEL[session.outcome]}
        </span>
        {session.flagged ? (
          <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-bold text-destructive ring-1 ring-destructive/20">
            Flagged for review
          </span>
        ) : null}

        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() =>
              toast.success(session.flagged ? "Flag cleared" : "Conversation flagged for review")
            }
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-[12.5px] font-bold transition hover:text-foreground"
          >
            <Flag className="size-4" />
            {session.flagged ? "Clear flag" : "Flag"}
          </button>
          <Link
            to="/users/$userId"
            params={{ userId: session.user.id }}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3 text-[12.5px] font-bold text-primary-foreground transition hover:opacity-90"
          >
            <User className="size-4" />
            Open customer
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Transcript" eyebrow={`${session.turns} turns · ${session.duration}`} icon={MessageSquare} className="xl:col-span-2">
          <div className="space-y-4 p-5">
            {session.transcript.map((turn) => (
              <div
                key={turn.id}
                className={`flex gap-3 ${turn.role === "user" ? "" : "flex-row-reverse text-right"}`}
              >
                <span
                  className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${
                    turn.role === "user" ? "bg-muted text-muted-foreground" : "bg-brand/10 text-brand"
                  }`}
                >
                  {turn.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                </span>
                <div className={`max-w-[80%] ${turn.role === "user" ? "" : "ml-auto"}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ring-1 ${
                      turn.role === "user"
                        ? "bg-muted/50 ring-border"
                        : "bg-brand/6 ring-brand/15"
                    } ${turn.flagged ? "ring-destructive/40" : ""}`}
                  >
                    {turn.text}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{turn.at}</span>
                    {turn.intent ? <span>· {INTENT_LABEL[turn.intent]}</span> : null}
                    {turn.card ? (
                      <span className="rounded-full bg-gold/20 px-2 py-0.5 font-bold text-gold-foreground ring-1 ring-gold/40">
                        {turn.card}
                      </span>
                    ) : null}
                    {turn.flagged ? (
                      <span className="font-bold text-destructive">Flagged</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Session detail">
            <dl className="divide-y divide-border/60 text-[13px]">
              {[
                ["Customer", session.user.name],
                ["Email", session.user.email],
                ["Device", session.device],
                ["Started", session.startedAt],
                ["Duration", session.duration],
                ["Top intent", INTENT_LABEL[session.topIntent]],
                ["Outcome", OUTCOME_LABEL[session.outcome]],
                ["Handoff", session.handoffTo ?? "None"],
                [
                  "Feedback",
                  session.satisfaction === "positive"
                    ? "Positive"
                    : session.satisfaction === "negative"
                      ? "Negative"
                      : "Not rated",
                ],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 px-5 py-2.5">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title="Guardrails" icon={ShieldCheck}>
            <p className="px-5 py-4 text-[12.5px] leading-relaxed text-muted-foreground">
              Ask AI is read-only: it can explain products, quote rates and show balances, but it can
              never move money, change bank details or approve a withdrawal. Any money action opens the
              secure journey for the customer to confirm.
            </p>
          </Panel>
        </div>
      </div>
    </AdminShell>
  );
}
