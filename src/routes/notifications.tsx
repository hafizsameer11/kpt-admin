import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, BellOff, CheckCheck, Settings2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import {
  NOTIFICATION_LABEL,
  NOTIFICATION_TONE,
  hydrateAdminNotificationsFromApi,
  type AdminNotification,
  type NotificationKind,
} from "@/lib/admin-console-data";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Every operational alert for Kipit operators: withdrawals, compliance, reconciliation, rates and system notices in one inbox.",
      },
      { property: "og:title", content: "Notifications — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Operational alert inbox for the Kipit admin console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationsPage,
});

const KINDS: ("all" | NotificationKind)[] = [
  "all",
  "compliance",
  "withdrawal",
  "reconciliation",
  "rates",
  "support",
  "system",
];

function NotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [kind, setKind] = useState<"all" | NotificationKind>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [read, setRead] = useState<string[]>([]);

  useEffect(() => {
    void hydrateAdminNotificationsFromApi().then(setNotifications);
  }, []);

  const isUnread = (id: string, base: boolean) => base && !read.includes(id);

  const rows = useMemo(
    () =>
      notifications.filter((n) => {
        if (kind !== "all" && n.kind !== kind) return false;
        if (unreadOnly && !isUnread(n.id, n.unread)) return false;
        return true;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notifications, kind, unreadOnly, read],
  );

  const grouped = useMemo(() => {
    const order = ["Today", "Yesterday", "Earlier"] as const;
    return order
      .map((day) => [day, rows.filter((r) => r.day === day)] as const)
      .filter(([, list]) => list.length > 0);
  }, [rows]);

  const unreadCount = notifications.filter((n) => isUnread(n.id, n.unread)).length;
  const highCount = notifications.filter((n) => n.priority === "high").length;

  return (
    <AdminShell title="Notifications" subtitle="Operational alerts across the console">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Unread" value={String(unreadCount)} helper="Needs an operator" tone="brand" icon={Bell} />
        <Stat label="High priority" value={String(highCount)} helper="Money or compliance impact" tone="gold" />
        <Stat label="Total this week" value={String(notifications.length)} helper="All categories" />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition ${
              kind === k
                ? "bg-brand text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {k === "all" ? "All" : NOTIFICATION_LABEL[k]}
          </button>
        ))}

        <label className="ml-auto inline-flex items-center gap-2 text-[12.5px] font-semibold text-muted-foreground">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="size-4 accent-[color:var(--brand)]"
          />
          Unread only
        </label>

        <button
          type="button"
          onClick={() => {
            setRead(notifications.map((n) => n.id));
            toast.success("All notifications marked as read");
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-[12.5px] font-bold transition hover:bg-muted"
        >
          <CheckCheck className="size-4" /> Mark all read
        </button>

        <Link
          to="/profile"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-[12.5px] font-bold transition hover:bg-muted"
        >
          <Settings2 className="size-4" /> Preferences
        </Link>
      </div>

      <div className="mt-5 space-y-5">
        {grouped.length === 0 ? (
          <Panel>
            <div className="grid place-items-center py-12 text-center">
              <BellOff className="size-8 text-muted-foreground" />
              <p className="mt-3 font-display text-[16px] font-extrabold">Nothing here</p>
              <p className="text-[13px] text-muted-foreground">
                No notifications match this filter.
              </p>
            </div>
          </Panel>
        ) : null}

        {grouped.map(([day, list]) => (
          <Panel key={day} title={day} eyebrow="Alerts">
            <ul className="divide-y divide-border/60">
              {list.map((n) => {
                const unread = isUnread(n.id, n.unread);
                return (
                  <li key={n.id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                    <span
                      className={`mt-0.5 inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider ring-1 ${NOTIFICATION_TONE[n.kind]}`}
                    >
                      {NOTIFICATION_LABEL[n.kind]}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {unread ? <span className="size-1.5 rounded-full bg-gold" /> : null}
                        <p
                          className={`truncate text-[13.5px] ${
                            unread ? "font-extrabold text-foreground" : "font-semibold text-foreground/80"
                          }`}
                        >
                          {n.title}
                        </p>
                        {n.priority === "high" ? (
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                            High
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[12.5px] text-muted-foreground">{n.body}</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[11.5px] text-muted-foreground">{n.time}</span>
                      {n.to ? (
                        <Link
                          to={n.to}
                          onClick={() => setRead((r) => [...r, n.id])}
                          className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-bold text-primary-foreground transition hover:opacity-90"
                        >
                          Open
                        </Link>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        ))}
      </div>
    </AdminShell>
  );
}
