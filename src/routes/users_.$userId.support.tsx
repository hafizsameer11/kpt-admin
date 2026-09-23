import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";

import { Panel } from "@/components/kipit/AdminBits";
import { loadAdminSupportTickets, mapUserSupportTicket } from "@/lib/admin-mappers";
import { type AdminTicket } from "@/lib/admin-users-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/users_/$userId/support")({
  component: Support,
});

const STATUS_TONE: Record<AdminTicket["status"], string> = {
  open: "bg-destructive/10 text-destructive",
  pending: "bg-gold/25 text-gold-foreground",
  resolved: "bg-emerald-500/12 text-emerald-700",
};

const PRIORITY_TONE: Record<AdminTicket["priority"], string> = {
  high: "bg-destructive/10 text-destructive",
  normal: "bg-brand/10 text-brand",
  low: "bg-muted text-muted-foreground",
};

function Support() {
  const { userId } = Route.useParams();
  const [rows, setRows] = useState<AdminTicket[]>([]);
  const [open, setOpen] = useState<AdminTicket | null>(null);

  useEffect(() => {
    void loadAdminSupportTickets().then((tickets) => {
      setRows(
        tickets.filter((t) => t.user.id === userId).map((t) => mapUserSupportTicket(t)),
      );
    });
  }, [userId]);

  return (
    <>
      <Panel title="Support tickets">
        {rows.length === 0 ? (
          <p className="py-6 text-[13px] text-muted-foreground">No tickets raised by this customer.</p>
        ) : (
          <ul className="divide-y divide-border/70">
            {rows.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setOpen(t)}
                  className="flex w-full items-center gap-4 py-4 text-left transition hover:opacity-80"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                    <MessageSquare className="size-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold">{t.subject}</span>
                    <span className="block text-[12px] text-muted-foreground">
                      {t.id} · {t.category} · created {t.created}
                    </span>
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${PRIORITY_TONE[t.priority]}`}>
                    {t.priority}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_TONE[t.status]}`}>
                    {t.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="sm:max-w-[30rem]">
          <DialogHeader>
            <DialogTitle>{open?.subject}</DialogTitle>
            <DialogDescription>
              {open?.id} · {open?.category}
            </DialogDescription>
          </DialogHeader>
          {open ? (
            <div className="space-y-4">
              <ul className="divide-y divide-border/70 text-[13px]">
                {[
                  ["Priority", open.priority],
                  ["Status", open.status],
                  ["Created", open.created],
                ].map(([k, v]) => (
                  <li key={k} className="flex justify-between gap-4 py-2.5">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-bold capitalize">{v}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Last message
                </p>
                <p className="mt-1 text-[13px]">{open.lastMessage}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
