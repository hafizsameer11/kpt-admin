import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Laptop, Smartphone } from "lucide-react";
import { toast } from "sonner";

import { Panel } from "@/components/kipit/AdminBits";
import { loadAdminUserSessions } from "@/lib/admin-mappers";
import { type AdminSession } from "@/lib/admin-users-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/users_/$userId/sessions")({
  component: Sessions,
});

const TONE: Record<AdminSession["status"], string> = {
  active: "bg-emerald-500/12 text-emerald-700",
  expired: "bg-muted text-muted-foreground",
  revoked: "bg-destructive/10 text-destructive",
};

function Sessions() {
  const { userId } = Route.useParams();
  const [rows, setRows] = useState<AdminSession[]>([]);
  const [target, setTarget] = useState<AdminSession | null>(null);

  useEffect(() => {
    void loadAdminUserSessions(userId).then(setRows);
  }, [userId]);

  return (
    <>
      <Panel title="ADM-025 · Devices and login activity">
        <ul className="divide-y divide-border/70">
          {rows.map((s) => {
            const Icon = s.device.toLowerCase().includes("chrome") ? Laptop : Smartphone;
            return (
              <li key={s.id} className="flex flex-wrap items-center gap-4 py-4 first:pt-0">
                <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
                  <Icon className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold">
                    {s.device}
                    {s.current ? (
                      <span className="ml-2 rounded-md bg-gold/25 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-foreground">
                        Current
                      </span>
                    ) : null}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {s.os} · {s.location} · IP {s.ip}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${TONE[s.status]}`}>
                    {s.status}
                  </span>
                  <p className="mt-1 text-[12px] text-muted-foreground">{s.lastSeen}</p>
                </div>
                {s.status === "active" ? (
                  <button
                    type="button"
                    onClick={() => setTarget(s)}
                    className="rounded-lg border border-border px-3 py-1.5 text-[12.5px] font-bold transition hover:bg-muted"
                  >
                    Revoke
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Panel>

      <Dialog open={!!target} onOpenChange={(v) => !v && setTarget(null)}>
        <DialogContent className="sm:max-w-[24rem]">
          <DialogHeader>
            <DialogTitle>Revoke session</DialogTitle>
            <DialogDescription>
              The customer will be signed out of {target?.device} and must authenticate again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setTarget(null)}
              className="rounded-lg border border-border px-4 py-2 text-[13px] font-bold transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!target) return;
                void (async () => {
                  try {
                    const { revokeAdminUserSession } = await import("@/lib/admin-api");
                    await revokeAdminUserSession(userId, target.id);
                    setTarget(null);
                    toast.success("Session revoked", {
                      description: "Recorded in the audit log.",
                    });
                    window.location.reload();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not revoke session");
                  }
                })();
              }}
              className="rounded-lg bg-destructive px-4 py-2 text-[13px] font-bold text-white"
            >
              Revoke session
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
