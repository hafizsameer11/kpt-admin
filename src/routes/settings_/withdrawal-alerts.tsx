import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import {
  AdminApiError,
  addWithdrawalNotifyEmail,
  deleteWithdrawalNotifyEmail,
  fetchWithdrawalNotifyEmails,
  patchWithdrawalNotifyEmail,
  type WithdrawalNotifyActivity,
  type WithdrawalNotifyEmail,
} from "@/lib/admin-api";
import { naira } from "@/lib/admin-data";

export const Route = createFileRoute("/settings_/withdrawal-alerts")({
  head: () => ({
    meta: [
      { title: "Withdrawal alert emails — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Manage who receives withdrawal request notification emails, including addresses outside the admin console.",
      },
      { property: "og:title", content: "Withdrawal alert emails — Kipit Admin Console" },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WithdrawalAlertEmailsPage,
});

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function WithdrawalAlertEmailsPage() {
  const [emails, setEmails] = useState<WithdrawalNotifyEmail[]>([]);
  const [activity, setActivity] = useState<WithdrawalNotifyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailInput, setEmailInput] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const data = await fetchWithdrawalNotifyEmails();
    setEmails(data.emails ?? []);
    setActivity(data.activity ?? []);
  }, []);

  useEffect(() => {
    void reload()
      .catch((err) =>
        toast.error(err instanceof AdminApiError ? err.message : "Could not load alert emails"),
      )
      .finally(() => setLoading(false));
  }, [reload]);

  const activeCount = emails.filter((e) => e.active).length;
  const sentCount = activity.filter((a) => a.status === "sent").length;
  const failedCount = activity.filter((a) => a.status === "failed").length;

  async function onAdd() {
    if (busy) return;
    setBusy(true);
    try {
      await addWithdrawalNotifyEmail({
        email: emailInput.trim(),
        ...(labelInput.trim() ? { label: labelInput.trim() } : {}),
      });
      setEmailInput("");
      setLabelInput("");
      await reload();
      toast.success("Email added to withdrawal alerts");
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Could not add email");
    } finally {
      setBusy(false);
    }
  }

  async function onToggle(row: WithdrawalNotifyEmail) {
    try {
      await patchWithdrawalNotifyEmail(row.id, { active: !row.active });
      await reload();
      toast.success(`${row.email} ${row.active ? "paused" : "activated"}`);
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Could not update email");
    }
  }

  async function onRemove(row: WithdrawalNotifyEmail) {
    if (!window.confirm(`Remove ${row.email} from withdrawal alerts?`)) return;
    try {
      await deleteWithdrawalNotifyEmail(row.id);
      await reload();
      toast.success("Email removed");
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Could not remove email");
    }
  }

  return (
    <AdminShell
      title="Withdrawal alert emails"
      subtitle="Notify any inbox when a customer requests a withdrawal"
    >
      <Link
        to="/settings"
        className="mb-4 inline-flex items-center gap-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        System settings
      </Link>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat label="Active recipients" value={String(activeCount)} helper="Emails that get alerts" tone="brand" />
        <Stat label="Delivered (recent)" value={String(sentCount)} helper="Accepted by mail provider" tone="gold" />
        <Stat label="Failed (recent)" value={String(failedCount)} helper="Send errors in activity" tone="brand" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Panel title="Recipients" eyebrow="Manage list" icon={Mail}>
          <p className="mb-4 text-[13px] text-muted-foreground">
            Add any email — Kipit admin accounts or external addresses. Active addresses receive a
            notification for every new withdrawal request.
          </p>

          <div className="mb-4 space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3">
            <input
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="ops@company.com"
              type="email"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-[13px]"
            />
            <input
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="Label (optional) — e.g. Finance on-call"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-[13px]"
            />
            <button
              type="button"
              disabled={busy || !emailInput.trim()}
              onClick={() => void onAdd()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-[13px] font-bold text-white disabled:opacity-50"
            >
              <Plus className="size-3.5" />
              Add email
            </button>
          </div>

          {loading ? (
            <p className="text-[13px] text-muted-foreground">Loading…</p>
          ) : emails.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No alert emails yet. Add the first one above.</p>
          ) : (
            <ul className="space-y-2">
              {emails.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold">{row.email}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {row.label || "No label"} · added {formatWhen(row.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={row.active}
                    onClick={() => void onToggle(row)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                      row.active ? "bg-brand" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${
                        row.active ? "left-[1.4rem]" : "left-0.5"
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => void onRemove(row)}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-red-600"
                    aria-label={`Remove ${row.email}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Delivery activity" eyebrow="Recent sends">
          <p className="mb-4 text-[13px] text-muted-foreground">
            Shows whether each alert was accepted by the email provider (sent) or failed. This is
            provider acceptance, not inbox open tracking.
          </p>
          {loading ? (
            <p className="text-[13px] text-muted-foreground">Loading…</p>
          ) : activity.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">
              No sends logged yet. Activity appears when customers request withdrawals.
            </p>
          ) : (
            <ul className="max-h-[34rem] space-y-2 overflow-y-auto pr-1">
              {activity.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-border/70 px-3 py-2.5 text-[13px]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold">{row.email}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                        row.status === "sent"
                          ? "bg-emerald-500/15 text-emerald-700"
                          : "bg-red-500/15 text-red-700"
                      }`}
                    >
                      {row.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {formatWhen(row.at)}
                    {row.amountNaira != null ? ` · ${naira(row.amountNaira)}` : ""}
                    {row.reference ? ` · ${row.reference}` : ""}
                  </p>
                  {row.status === "sent" ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {row.provider || "provider"}
                      {row.providerMessageId ? ` · id ${row.providerMessageId}` : ""}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-red-600">{row.error || "Send failed"}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </AdminShell>
  );
}
