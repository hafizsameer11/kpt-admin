import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Download, Gauge, LifeBuoy, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { downloadCsv } from "@/lib/csv-export";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import {
  CATEGORY_LABEL,
  PRIORITY_TONE,
  hydrateAdminSupportFromApi,
  TICKET_STATUS_LABEL,
  TICKET_STATUS_TONE,
  type SupportTicket,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/admin-support-data";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support tickets — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Kipit support desk: triage customer tickets by category, priority and status, and open full conversations.",
      },
      { property: "og:title", content: "Support tickets — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Triage and resolve Kipit customer support tickets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SupportListPage,
});

const TABS: ("all" | TicketStatus)[] = ["all", "open", "pending", "resolved", "closed"];
const PRIORITIES: ("all" | TicketPriority)[] = ["all", "urgent", "high", "normal", "low"];

function SupportListPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [tab, setTab] = useState<"all" | TicketStatus>("open");
  const [priority, setPriority] = useState<"all" | TicketPriority>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void hydrateAdminSupportFromApi().then(setTickets);
  }, []);

  const totals = useMemo(
    () => ({
      open: tickets.filter((t) => t.status === "open").length,
      pending: tickets.filter((t) => t.status === "pending").length,
      urgent: tickets.filter((t) => t.priority === "urgent").length,
      resolved: tickets.filter((t) => t.status === "resolved" || t.status === "closed").length,
    }),
    [tickets],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((t) => {
      if (tab !== "all" && t.status !== tab) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (!q) return true;
      return [t.ref, t.subject, t.user.name, t.user.email, t.assignee].some((f) =>
        f.toLowerCase().includes(q),
      );
    });
  }, [tickets, tab, priority, query]);

  return (
    <AdminShell title="Support" subtitle="ADM-110 · customer ticket desk">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Open tickets"
          value={String(totals.open)}
          helper={`${totals.urgent} marked urgent`}
          tone="brand"
          icon={LifeBuoy}
        />
        <Stat
          label="Awaiting customer"
          value={String(totals.pending)}
          helper="Reply expected from user"
          icon={Clock}
        />
        <Stat
          label="Resolved"
          value={String(totals.resolved)}
          helper="Resolved or closed"
          tone="gold"
          icon={Gauge}
        />
        <Stat
          label="Satisfaction"
          value="—"
          helper="CSAT not collected yet"
          icon={Star}
        />
      </div>

      <Panel className="mt-5 overflow-hidden">
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
                  {t === "all" ? "All" : TICKET_STATUS_LABEL[t]}
                </button>
              ))}
            </div>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "all" | TicketPriority)}
              className="h-9 rounded-lg border border-border bg-muted/40 px-2.5 text-[12.5px] font-bold capitalize outline-none"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p === "all" ? "All priorities" : p}
                </option>
              ))}
            </select>

            <label className="ml-auto flex min-w-[16rem] items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ticket, subject, customer or agent"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                const n = downloadCsv(
                  "kipit-support",
                  ["Subject", "Reference", "Customer", "Email", "Category", "Priority", "Status", "Assignee", "Created", "Channel"],
                  rows.map((t) => [
                    t.subject,
                    t.ref,
                    t.user.name,
                    t.user.email,
                    CATEGORY_LABEL[t.category],
                    t.priority,
                    TICKET_STATUS_LABEL[t.status],
                    t.assignee,
                    t.createdAt,
                    t.channel,
                  ]),
                );
                toast.success(`Downloaded ${n} rows`);
              }}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3 text-[12.5px] font-bold text-primary-foreground transition hover:opacity-90"
            >
              <Download className="size-4" />
              Export
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[64rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="px-5 py-2.5">Ticket</th>
                  <th className="px-5 py-2.5">Customer</th>
                  <th className="px-5 py-2.5">Category</th>
                  <th className="px-5 py-2.5">Priority</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5">Assignee</th>
                  <th className="px-5 py-2.5">Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="group border-b border-border/60 transition hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <Link to="/support/$ticketId" params={{ ticketId: t.id }} className="block">
                        <span className="block text-[13.5px] font-bold group-hover:text-brand">
                          {t.subject}
                        </span>
                        <span className="block text-[12px] text-muted-foreground">
                          {t.ref} · {t.channel} · updated {t.updatedAt}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className="block text-[13px] font-semibold">{t.user.name}</span>
                      <span className="block text-[12px] text-muted-foreground">{t.user.email}</span>
                    </td>
                    <td className="px-5 py-3 text-[13px]">{CATEGORY_LABEL[t.category]}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ${PRIORITY_TONE[t.priority]}`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${TICKET_STATUS_TONE[t.status]}`}
                      >
                        {TICKET_STATUS_LABEL[t.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-muted-foreground">{t.assignee}</td>
                    <td className="px-5 py-3 text-[12.5px] text-muted-foreground">{t.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? (
              <p className="px-5 py-14 text-center text-[13px] text-muted-foreground">
                No tickets match this view.
              </p>
            ) : null}
          </div>
        </div>
      </Panel>
    </AdminShell>
  );
}
