import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";
import { downloadCsv } from "@/lib/csv-export";

import { Panel } from "@/components/kipit/AdminBits";
import { loadAdminAuditLog, mapUserAuditEntry } from "@/lib/admin-mappers";
import type { AdminAudit } from "@/lib/admin-users-data";

export const Route = createFileRoute("/users_/$userId/audit")({
  component: Audit,
});

function Audit() {
  const { userId } = Route.useParams();
  const [all, setAll] = useState<AdminAudit[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    void loadAdminAuditLog().then((entries) => {
      setAll(
        entries
          .filter(
            (e) =>
              e.targetId === userId ||
              e.target === userId ||
              e.action.includes(userId),
          )
          .map((e) => mapUserAuditEntry(e, userId)),
      );
    });
  }, [userId]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((a) =>
      [a.admin, a.action, a.entity].some((f) => f.toLowerCase().includes(q)),
    );
  }, [all, query]);

  return (
    <Panel className="overflow-hidden">
      <div className="-m-5">
        <div className="flex flex-wrap items-center gap-3 border-b border-border/70 px-5 py-4">
          <label className="flex min-w-[16rem] flex-1 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search administrator, action or entity"
              className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              const n = downloadCsv(
                `kipit-user-audit-${userId}`,
                ["Actor", "Action", "Entity", "Previous", "New", "Timestamp"],
                rows.map((a) => [a.admin, a.action, a.entity, a.previous, a.next, a.at]),
              );
              toast.success(`Downloaded ${n} rows`);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[13px] font-semibold transition hover:bg-muted"
          >
            <Download className="size-4" />
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-border/70 bg-muted/40 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                <th className="px-5 py-2.5">Actor</th>
                <th className="px-5 py-2.5">Action</th>
                <th className="px-5 py-2.5">Entity</th>
                <th className="px-5 py-2.5">Previous</th>
                <th className="px-5 py-2.5">New</th>
                <th className="px-5 py-2.5">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b border-border/60">
                  <td className="px-5 py-3 text-[13px] font-bold">{a.admin}</td>
                  <td className="px-5 py-3 text-[13px]">{a.action}</td>
                  <td className="px-5 py-3 text-[12.5px] text-muted-foreground">{a.entity}</td>
                  <td className="px-5 py-3 text-[13px] text-muted-foreground">{a.previous}</td>
                  <td className="px-5 py-3 text-[13px] font-semibold">{a.next}</td>
                  <td className="px-5 py-3 text-[12.5px] text-muted-foreground">{a.at}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            <p className="px-5 py-12 text-center text-[13px] text-muted-foreground">
              No audit entries match this search.
            </p>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}
