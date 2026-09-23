import { createFileRoute } from "@tanstack/react-router";

import { Panel, Stat } from "@/components/kipit/AdminBits";
import { naira } from "@/lib/admin-data";
import { findUser, portfolioValue } from "@/lib/admin-users-data";

export const Route = createFileRoute("/users_/$userId/balances")({
  component: Balances,
});

function Balances() {
  const { userId } = Route.useParams();
  const user = findUser(userId)!;
  const total = portfolioValue(user);

  const pools = [
    { label: "Wallet", value: user.wallet, helper: "Uninvested cash", tone: "bg-brand/30" },
    { label: "Call Account", value: user.call, helper: "Daily accrual, withdraw anytime", tone: "bg-brand/60" },
    { label: "Fixed plans", value: user.fixed, helper: "Locked until maturity", tone: "bg-brand" },
    { label: "Explore products", value: user.explore, helper: "Marketplace subscriptions", tone: "bg-gold" },
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Wallet" value={naira(user.wallet)} />
        <Stat label="Call" value={naira(user.call)} />
        <Stat label="Investments" value={naira(user.fixed + user.explore)} />
        <Stat label="Portfolio total" value={naira(total)} tone="brand" />
      </section>

      <Panel title="ADM-022 · Balance composition">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {pools.map((p) => (
            <span
              key={p.label}
              className={p.tone}
              style={{ width: `${total ? (p.value / total) * 100 : 0}%` }}
            />
          ))}
        </div>

        <ul className="mt-5 divide-y divide-border/70">
          {pools.map((p) => (
            <li key={p.label} className="flex items-center justify-between gap-4 py-3.5 first:pt-0">
              <div className="flex items-center gap-3">
                <span className={`size-2.5 rounded-full ${p.tone}`} />
                <div>
                  <p className="text-[13.5px] font-bold">{p.label}</p>
                  <p className="text-[12px] text-muted-foreground">{p.helper}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-extrabold">{naira(p.value)}</p>
                <p className="text-[12px] text-muted-foreground">
                  {total ? Math.round((p.value / total) * 100) : 0}%
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
