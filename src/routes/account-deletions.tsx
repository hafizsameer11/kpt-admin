import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, UserRoundX } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import { fetchAdminAccountDeletions, type AdminAccountDeletionRow } from "@/lib/admin-api";
import {
  DELETION_STATUS_LABEL,
  DELETION_STATUS_TONE,
  mapDeletionStatus,
  type DeletionStatus,
} from "@/lib/admin-account-deletions-data";

export const Route = createFileRoute("/account-deletions")({
  head: () => ({
    meta: [
      { title: "Account deletions — Kipit Admin Console" },
      {
        name: "description",
        content: "Review and process customer account deletion requests.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountDeletionQueuePage,
});

const TABS: ("all" | DeletionStatus)[] = ["all", "submitted", "processing", "rejected", "deleted"];

function AccountDeletionQueuePage() {
  const [items, setItems] = useState<AdminAccountDeletionRow[]>([]);
  const [tab, setTab] = useState<"all" | DeletionStatus>("submitted");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void fetchAdminAccountDeletions()
      .then(setItems)
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Could not load deletion requests"),
      );
  }, []);

  const totals = useMemo(() => {
    return {
      submitted: items.filter((i) => i.status === "SUBMITTED").length,
      processing: items.filter((i) => i.status === "PROCESSING").length,
      rejected: items.filter((i) => i.status === "REJECTED").length,
      deleted: items.filter((i) => i.status === "DELETED").length,
    };
  }, [items]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((row) => {
      const status = mapDeletionStatus(row.status);
      if (tab !== "all" && status !== tab) return false;
      if (!q) return true;
      return [
        row.user.name,
        row.user.email ?? "",
        row.user.phone ?? "",
        row.reasonLabel ?? "",
      ].some((f) => f.toLowerCase().includes(q));
    });
  }, [items, tab, query]);

  return (
    <AdminShell
      title="Account deletions"
      subtitle="Customer soft-delete requests · 30-day hold before Mark deleted"
    >
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Submitted" value={String(totals.submitted)} helper="Awaiting review" />
        <Stat label="Processing" value={String(totals.processing)} helper="Checks in progress" />
        <Stat label="Rejected" value={String(totals.rejected)} helper="Can resubmit in app" />
        <Stat label="Deleted" value={String(totals.deleted)} helper="Soft-deleted" />
      </div>

      <Panel title="Queue" eyebrow="Requests" icon={UserRoundX}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-bold capitalize ${
                tab === t ? "bg-brand text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {t === "all" ? "All" : DELETION_STATUS_LABEL[t]}
            </button>
          ))}
          <div className="relative ml-auto min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, phone…"
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-[13px]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="pb-2 font-bold">Customer</th>
                <th className="pb-2 font-bold">Reason</th>
                <th className="pb-2 font-bold">Submitted</th>
                <th className="pb-2 font-bold">Purge after</th>
                <th className="pb-2 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const status = mapDeletionStatus(row.status);
                return (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3">
                      <Link
                        to="/account-deletions/$deletionId"
                        params={{ deletionId: row.id }}
                        className="font-bold text-brand hover:underline"
                      >
                        {row.user.name}
                      </Link>
                      <p className="text-[12px] text-muted-foreground">
                        {row.user.email || row.user.phone || row.user.id}
                      </p>
                    </td>
                    <td className="py-3">{row.reasonLabel ?? row.reasonCode}</td>
                    <td className="py-3 tabular-nums">
                      {new Date(row.createdAt).toLocaleDateString("en-NG")}
                    </td>
                    <td className="py-3 tabular-nums">
                      {new Date(row.scheduledPurgeAt).toLocaleDateString("en-NG")}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${DELETION_STATUS_TONE[status]}`}
                      >
                        {DELETION_STATUS_LABEL[status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!rows.length ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No deletion requests in this view.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Panel>
    </AdminShell>
  );
}
