import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  History,
  ImagePlus,
  MessageSquare,
  Paperclip,
  Receipt,
  Send,
  UserRound,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel } from "@/components/kipit/AdminBits";
import { naira } from "@/lib/admin-data";
import {
  CATEGORY_LABEL,
  PRIORITY_TONE,
  TICKET_STATUS_LABEL,
  TICKET_STATUS_TONE,
  hydrateAdminSupportFromApi,
  ticketById,
  type SupportTicket,
  type TicketMessage,
  type TicketStatus,
} from "@/lib/admin-support-data";
import {
  fetchAdminTeam,
  fetchAdminTicket,
  resolveAdminUploadUrl,
  updateAdminTicket,
  uploadAdminTicketAttachment,
} from "@/lib/admin-api";
import { mapSupportTicket } from "@/lib/admin-mappers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/support_/$ticketId")({
  head: () => ({
    meta: [
      { title: "Ticket detail — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Full support ticket view: conversation, customer profile, related transactions and ticket history.",
      },
      { property: "og:title", content: "Ticket detail — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Respond to and resolve a Kipit customer support ticket.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TicketDetailPage,
});

type TeamAgent = { id: string; name: string; email: string; role: string };

function isImageAttachment(url?: string | null, name?: string | null) {
  const hay = `${url || ""} ${name || ""}`.toLowerCase();
  if (/\.pdf(\?|#|$)/i.test(hay)) return false;
  if (/\.(jpe?g|png|webp|gif|heic|heif)(\?|#|$)/i.test(hay)) return true;
  // Server-stored support uploads are image or pdf; treat non-pdf paths as images.
  if (/\/uploads\/support\//i.test(hay) && !/\.pdf(\?|#|$)/i.test(hay)) return true;
  return false;
}

/** Hide accidental pasted base64 / data-URLs so the page doesn't blow out. */
function displayMessageBody(body: string) {
  const text = (body || "").trim();
  if (!text) return "";
  if (/^data:image\//i.test(text) || (text.length > 400 && /^[A-Za-z0-9+/=\s]+$/.test(text))) {
    return "[Image attachment — open the preview below]";
  }
  if (text.length > 4000) return `${text.slice(0, 4000)}…`;
  return text;
}

function TicketAttachment({
  url,
  name,
}: {
  url?: string | null;
  name?: string | null;
}) {
  const resolved = resolveAdminUploadUrl(url);
  const wantsImage = isImageAttachment(resolved, name);
  const [displaySrc, setDisplaySrc] = useState<string | null>(wantsImage ? resolved : null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!resolved || !wantsImage) return;
    let cancelled = false;
    let objectUrl: string | null = null;

    setFailed(false);
    setDisplaySrc(resolved);

    // If the bare <img> is blocked (old CORP headers, odd host), pull bytes via fetch and show a blob URL.
    void (async () => {
      try {
        const res = await fetch(resolved, { mode: "cors", cache: "force-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (cancelled) return;
        if (!blob.type.startsWith("image/") && !isImageAttachment(resolved, name)) {
          throw new Error("not an image");
        }
        objectUrl = URL.createObjectURL(blob);
        setDisplaySrc(objectUrl);
        setFailed(false);
      } catch {
        // Keep direct URL; <img onError> will mark failed if that also cannot load.
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [resolved, wantsImage, name]);

  if (!resolved) return null;

  if (wantsImage && displaySrc && !failed) {
    return (
      <div className="mt-3 space-y-2">
        <a
          href={resolved}
          target="_blank"
          rel="noreferrer"
          className="block max-w-md overflow-hidden rounded-xl border border-border bg-muted/30"
        >
          <img
            src={displaySrc}
            alt={name || "Attachment"}
            className="max-h-72 w-full bg-black/5 object-contain"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
          />
        </a>
        <a
          href={resolved}
          target="_blank"
          rel="noreferrer"
          className="inline-flex max-w-full truncate text-[12px] font-bold text-brand hover:underline"
        >
          {name || "Open image"}
        </a>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-1.5">
      <a
        href={resolved}
        target="_blank"
        rel="noreferrer"
        className="inline-flex max-w-full items-center gap-2 truncate rounded-lg border border-border bg-muted/40 px-3 py-2 text-[12px] font-bold text-brand hover:underline"
      >
        <Paperclip className="size-3.5 shrink-0" />
        {name || "View attachment"}
      </a>
      {wantsImage ? (
        <p className="text-[11.5px] text-muted-foreground">
          Preview unavailable — open the file to view the image.
        </p>
      ) : null}
    </div>
  );
}

function TicketDetailPage() {
  const { ticketId } = useParams({ from: "/support_/$ticketId" });
  const [ticket, setTicket] = useState<SupportTicket | null | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState<TicketStatus>("open");
  const [assignee, setAssignee] = useState("Unassigned");
  const [assigneeAdminId, setAssigneeAdminId] = useState<string | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [agents, setAgents] = useState<TeamAgent[]>([]);
  const [assignPick, setAssignPick] = useState<string | null>(null);
  const [assignBusy, setAssignBusy] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<{
    name: string;
    contentType: string;
    dataBase64: string;
    previewUrl?: string;
  } | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const row = await fetchAdminTicket(ticketId);
        if (!alive) return;
        setTicket(mapSupportTicket(row));
      } catch {
        await hydrateAdminSupportFromApi();
        if (!alive) return;
        setTicket(ticketById(ticketId) ?? null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [ticketId]);

  useEffect(() => {
    if (!ticket) return;
    setMessages(ticket.messages);
    setStatus(ticket.status);
    setAssignee(ticket.assignee);
    setAssigneeAdminId(ticket.assigneeAdminId ?? null);
  }, [ticket]);

  useEffect(() => {
    let alive = true;
    void fetchAdminTeam()
      .then((rows) => {
        if (!alive) return;
        const active = rows
          .filter((r) => r.active)
          .map((r) => ({ id: r.id, name: r.name, email: r.email, role: r.role }));
        setAgents(active);
      })
      .catch(() => {
        if (alive) setAgents([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (ticket === undefined) {
    return (
      <AdminShell title="Support" subtitle="Loading…">
        <p className="text-[13px] text-muted-foreground">Loading ticket…</p>
      </AdminShell>
    );
  }

  if (!ticket) {
    return (
      <AdminShell title="Ticket not found" subtitle="ADM-111">
        <Panel className="p-8 text-center">
          <p className="text-[14px] text-muted-foreground">
            This ticket does not exist or has been archived.
          </p>
          <Link
            to="/support"
            className="mt-4 inline-flex h-10 items-center rounded-lg bg-brand px-4 text-[13px] font-bold text-primary-foreground"
          >
            Back to support
          </Link>
        </Panel>
      </AdminShell>
    );
  }

  function onPickFile(file: File | null) {
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      toast.error("File too large (max 6 MB)");
      return;
    }
    const allowed = /^(image\/(jpeg|jpg|png|webp|gif)|application\/pdf)$/i.test(file.type);
    if (!allowed) {
      toast.error("Use JPG, PNG, WEBP, GIF or PDF");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1]! : result;
      if (!base64 || base64.length < 32) {
        toast.error("Could not read that file");
        return;
      }
      setPendingFile({
        name: file.name || "attachment.jpg",
        contentType: file.type || "image/jpeg",
        dataBase64: base64,
        previewUrl: file.type.startsWith("image/") ? result : undefined,
      });
    };
    reader.onerror = () => toast.error("Could not read that file");
    reader.readAsDataURL(file);
  }

  function sendReply() {
    const body = reply.trim();
    if (!body && !pendingFile) {
      toast.error("Write a reply before sending");
      return;
    }
    if (/^data:image\//i.test(body) || (body.length > 2000 && /^[A-Za-z0-9+/=\s]+$/.test(body))) {
      toast.error("Don't paste images into the reply box — use Attach image instead.");
      return;
    }
    setSending(true);
    void (async () => {
      try {
        let attachmentUrl: string | undefined;
        let attachmentName: string | undefined;
        if (pendingFile) {
          const uploaded = await uploadAdminTicketAttachment(ticket.id, {
            contentType: pendingFile.contentType,
            dataBase64: pendingFile.dataBase64,
            filename: pendingFile.name,
          });
          attachmentUrl = uploaded.url;
          attachmentName = uploaded.filename || pendingFile.name;
        }
        const replyText = body || (attachmentUrl ? "Attached a file." : "");
        await updateAdminTicket(ticket.id, {
          reply: replyText,
          status: "IN_PROGRESS",
          ...(attachmentUrl ? { attachmentUrl, attachmentName } : {}),
        });
        const refreshed = await fetchAdminTicket(ticket.id);
        setTicket(mapSupportTicket(refreshed));
        setReply("");
        setPendingFile(null);
        setStatus("pending");
        toast.success("Reply sent to customer");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not send reply");
      } finally {
        setSending(false);
      }
    })();
  }

  return (
    <AdminShell title={ticket.subject} subtitle={`ADM-111 · ${ticket.ref} · ${ticket.channel}`}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link
          to="/support"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-[12.5px] font-bold transition hover:border-brand/30"
        >
          <ArrowLeft className="size-4" />
          Support desk
        </Link>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${TICKET_STATUS_TONE[status]}`}>
          {TICKET_STATUS_LABEL[status]}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ${PRIORITY_TONE[ticket.priority]}`}
        >
          {ticket.priority} priority
        </span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground ring-1 ring-border">
          {CATEGORY_LABEL[ticket.category]}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAssignPick(assigneeAdminId ?? agents[0]?.id ?? null);
              setAssignOpen(true);
            }}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-[12.5px] font-bold transition hover:border-brand/30"
          >
            <UserPlus className="size-4" />
            {assignee === "Unassigned" ? "Assign" : "Reassign"}
          </button>
          <button
            type="button"
            onClick={() => setResolveOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3 text-[12.5px] font-bold text-primary-foreground transition hover:opacity-90"
          >
            <CheckCircle2 className="size-4" />
            Resolve ticket
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <Panel title="Conversation" icon={MessageSquare} eyebrow={`${messages.length} messages`}>
          <div className="space-y-3 overflow-x-hidden p-5">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`rounded-2xl border p-4 ${
                  m.role === "agent"
                    ? "ml-8 border-brand/20 bg-brand/6"
                    : m.role === "system"
                      ? "border-dashed border-border bg-muted/40"
                      : "mr-8 border-border/80 bg-card"
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="text-[12.5px] font-bold">{m.author}</span>
                  <span className="text-[11.5px] text-muted-foreground">{m.at}</span>
                </div>
                <p className="break-words text-[13px] leading-relaxed text-foreground/85">
                  {displayMessageBody(m.body)}
                </p>
                {m.attachmentUrl ? <TicketAttachment url={m.attachmentUrl} name={m.attachmentName} /> : null}
              </div>
            ))}
          </div>

          <div className="border-t border-border/60 p-5">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                if (
                  /^data:image\//i.test(text) ||
                  (text.length > 2000 && /^[A-Za-z0-9+/=\s]+$/.test(text))
                ) {
                  e.preventDefault();
                  toast.error("Don't paste images here — use Attach image.");
                  return;
                }
                const file = e.clipboardData.files?.[0];
                if (file) {
                  e.preventDefault();
                  onPickFile(file);
                }
              }}
              rows={4}
              placeholder="Write a reply to the customer…"
              className="w-full max-w-full resize-none break-words rounded-xl border border-border bg-muted/30 p-3 text-[13px] outline-none focus:border-brand/40"
            />
            {pendingFile ? (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                {pendingFile.previewUrl ? (
                  <img
                    src={pendingFile.previewUrl}
                    alt=""
                    className="size-14 rounded-lg object-cover"
                  />
                ) : (
                  <span className="grid size-14 place-items-center rounded-lg bg-card">
                    <Paperclip className="size-5 text-muted-foreground" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{pendingFile.name}</p>
                  <p className="text-[11.5px] text-muted-foreground">Ready to send with your reply</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingFile(null)}
                  className="grid size-8 place-items-center rounded-full hover:bg-muted"
                  aria-label="Remove attachment"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    onPickFile(e.target.files?.[0] ?? null);
                    e.currentTarget.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3 text-[12.5px] font-bold transition hover:border-brand/30"
                >
                  <ImagePlus className="size-4" />
                  Attach image
                </button>
                <p className="text-[12px] text-muted-foreground">JPG/PNG/PDF · max 6 MB</p>
              </div>
              <button
                type="button"
                disabled={sending}
                onClick={sendReply}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-[13px] font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                <Send className="size-4" />
                {sending ? "Sending…" : "Send reply"}
              </button>
            </div>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Customer" icon={UserRound}>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-brand/8 text-[13px] font-extrabold text-brand">
                  {ticket.user.name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold">{ticket.user.name}</p>
                  <p className="truncate text-[12px] text-muted-foreground">{ticket.user.email}</p>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                {[
                  ["Phone", ticket.user.phone],
                  ["KYC tier", `Tier ${ticket.user.tier}`],
                  ["Joined", ticket.user.joined],
                  ["Wallet", naira(ticket.user.walletBalance)],
                  ["Invested", naira(ticket.user.invested)],
                  ["Interest earned", naira(ticket.user.lifetimeInterest)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                      {k}
                    </dt>
                    <dd className="text-[13px] font-semibold tabular-nums">{v}</dd>
                  </div>
                ))}
              </dl>

              <Link
                to="/users/$userId"
                params={{ userId: ticket.user.id }}
                className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-lg border border-border text-[12.5px] font-bold transition hover:border-brand/30"
              >
                Open full profile
              </Link>
            </div>
          </Panel>

          <Panel title="Relevant transactions" icon={Receipt}>
            <div className="divide-y divide-border/60">
              {ticket.transactions.length === 0 ? (
                <p className="p-5 text-[13px] text-muted-foreground">
                  No transactions linked to this ticket.
                </p>
              ) : (
                ticket.transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold">{t.label}</p>
                      <p className="text-[11.5px] text-muted-foreground">
                        {t.id} · {t.at} · {t.status}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[13px] font-extrabold tabular-nums ${
                        t.amount < 0 ? "text-destructive" : "text-emerald-700"
                      }`}
                    >
                      {t.amount < 0 ? "-" : "+"}
                      {naira(Math.abs(t.amount))}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <Panel title="Ticket history" icon={History} eyebrow={`Assignee · ${assignee}`}>
            <ol className="p-5">
              {ticket.history.map((h, i) => (
                <li key={i} className="relative pl-6 pb-4 last:pb-0">
                  <span className="absolute left-0 top-1 size-2.5 rounded-full bg-brand" />
                  {i < ticket.history.length - 1 ? (
                    <span className="absolute left-[4.5px] top-4 h-full w-px bg-border" />
                  ) : null}
                  <p className="text-[13px] font-semibold">{h.label}</p>
                  <p className="text-[11.5px] text-muted-foreground">
                    {h.at} · {h.by}
                  </p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign ticket</DialogTitle>
            <DialogDescription>
              Pick a Team member who should own {ticket.ref}. They get an email and the ticket shows
              under their name — any admin can still reply, but ownership is clear.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {agents.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-[13px] text-muted-foreground">
                No active team members found. Invite someone under Team first.
              </p>
            ) : (
              agents.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAssignPick(a.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                    assignPick === a.id
                      ? "border-brand bg-brand/6 text-brand"
                      : "border-border hover:border-brand/30"
                  }`}
                >
                  <span>
                    <span className="block text-[13px] font-semibold">{a.name}</span>
                    <span className="block text-[11.5px] text-muted-foreground">
                      {a.email} · {a.role}
                    </span>
                  </span>
                  {assignPick === a.id ? <CheckCircle2 className="size-4 shrink-0" /> : null}
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setAssignOpen(false)}
              className="h-10 rounded-lg border border-border px-4 text-[13px] font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!assignPick || assignBusy}
              onClick={() => {
                const picked = agents.find((a) => a.id === assignPick);
                if (!picked) return;
                setAssignBusy(true);
                void updateAdminTicket(ticket.id, {
                  assigneeAdminId: picked.id,
                  status: "IN_PROGRESS",
                })
                  .then(() => fetchAdminTicket(ticket.id))
                  .then((row) => {
                    const mapped = mapSupportTicket(row);
                    setTicket(mapped);
                    setAssignee(mapped.assignee);
                    setAssigneeAdminId(mapped.assigneeAdminId ?? picked.id);
                    setStatus(mapped.status);
                    setAssignOpen(false);
                    toast.success(`Ticket assigned to ${picked.name} · email sent`);
                  })
                  .catch((err) =>
                    toast.error(err instanceof Error ? err.message : "Could not assign"),
                  )
                  .finally(() => setAssignBusy(false));
              }}
              className="h-10 rounded-lg bg-brand px-4 text-[13px] font-bold text-primary-foreground disabled:opacity-40"
            >
              {assignBusy ? "Assigning…" : "Assign"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve ticket</DialogTitle>
            <DialogDescription>
              Add a resolution summary for the audit trail. The customer receives a closing message.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            rows={4}
            placeholder="What was done to resolve this?"
            className="w-full resize-none rounded-xl border border-border bg-muted/30 p-3 text-[13px] outline-none focus:border-brand/40"
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => setResolveOpen(false)}
              className="h-10 rounded-lg border border-border px-4 text-[13px] font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!resolution.trim()) {
                  toast.error("Add a resolution summary");
                  return;
                }
                void updateAdminTicket(ticket.id, {
                  status: "RESOLVED",
                  reply: resolution.trim(),
                })
                  .then(() => {
                    setStatus("resolved");
                    setResolveOpen(false);
                    toast.success(`${ticket.ref} marked resolved`);
                  })
                  .catch((err) =>
                    toast.error(err instanceof Error ? err.message : "Could not resolve"),
                  );
              }}
              className="h-10 rounded-lg bg-brand px-4 text-[13px] font-bold text-primary-foreground"
            >
              Mark resolved
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
