import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

import { Panel } from "@/components/kipit/AdminBits";
import { findUser, hydrateAdminUserFromApi } from "@/lib/admin-users-data";
import type { KycCheck } from "@/lib/admin-users-data";

export const Route = createFileRoute("/users_/$userId/kyc")({
  component: Kyc,
});

const ICONS = {
  passed: { Icon: CheckCircle2, cls: "text-emerald-600" },
  pending: { Icon: Clock, cls: "text-gold-foreground" },
  failed: { Icon: XCircle, cls: "text-destructive" },
} as const;

function Kyc() {
  const { userId } = Route.useParams();
  const [user, setUser] = useState(findUser(userId));
  const [checks, setChecks] = useState<KycCheck[]>([]);

  useEffect(() => {
    void hydrateAdminUserFromApi(userId).then((u) => {
      if (u) setUser(u);
    });
  }, [userId]);

  if (!user) {
    return <p className="text-[13px] text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Panel title="Verification checks">
        {checks.length === 0 ? (
          <p className="py-6 text-[13px] text-muted-foreground">No check detail returned by the API.</p>
        ) : (
        <ul className="divide-y divide-border/70">
          {checks.map((c) => {
            const { Icon, cls } = ICONS[c.state];
            return (
              <li key={c.label} className="flex items-start gap-3 py-3.5 first:pt-0">
                <Icon className={`mt-0.5 size-4.5 shrink-0 ${cls}`} />
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold">{c.label}</p>
                  <p className="text-[12.5px] text-muted-foreground">{c.value}</p>
                </div>
                <span className="ml-auto text-[11.5px] font-bold capitalize text-muted-foreground">
                  {c.state}
                </span>
              </li>
            );
          })}
        </ul>
        )}
      </Panel>

      <Panel title="Submission">
        <ul className="divide-y divide-border/70 text-[13px]">
          {[
            ["Current tier", `Tier ${user.tier}`],
            ["Submitted", "—"],
            ["Reviewer", "—"],
            ["Account status", user.status],
          ].map(([k, v]) => (
            <li key={k} className="flex justify-between gap-4 py-2.5">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-bold capitalize">{v}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-xl bg-muted/60 p-3 text-[12.5px] text-muted-foreground">
          Approve, reject or escalate actions live in the Compliance & KYC queue (ADM-030–032).
        </p>
      </Panel>
    </div>
  );
}
