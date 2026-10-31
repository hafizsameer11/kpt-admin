import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Panel, Stat } from "@/components/kipit/AdminBits";
import { naira } from "@/lib/admin-data";
import { AdminApiError, adjustAdminUserBalance, fetchAdminUser } from "@/lib/admin-api";
import { findUser, hydrateAdminUserFromApi } from "@/lib/admin-users-data";
import {
  formatMoneyInput,
  isSuperAdminSession,
  parseMoneyInput,
} from "@/lib/admin-super";

export const Route = createFileRoute("/users_/$userId/balances")({
  component: Balances,
});

function Balances() {
  const { userId } = Route.useParams();
  const superAdmin = isSuperAdminSession();
  const [wallet, setWallet] = useState(0);
  const [call, setCall] = useState(0);
  const [fixed, setFixed] = useState(0);
  const [explore, setExplore] = useState(0);
  const [loading, setLoading] = useState(true);

  const [pool, setPool] = useState<"WALLET" | "CALL">("WALLET");
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const row = await fetchAdminUser(userId);
      setWallet(row.balances.wallet);
      setCall(row.balances.call);
      setFixed(row.balances.fixed);
      setExplore(row.balances.explore);
      await hydrateAdminUserFromApi(userId);
    } catch {
      const fallback = findUser(userId);
      if (fallback) {
        setWallet(fallback.wallet);
        setCall(fallback.call);
        setFixed(fallback.fixed);
        setExplore(fallback.explore);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [userId]);

  const total = wallet + call + fixed + explore;
  const pools = [
    { label: "Wallet", value: wallet, helper: "Uninvested cash", tone: "bg-brand/30" },
    { label: "Call Account", value: call, helper: "Daily accrual, withdraw anytime", tone: "bg-brand/60" },
    { label: "Fixed plans", value: fixed, helper: "Locked until maturity", tone: "bg-brand" },
    { label: "Explore products", value: explore, helper: "Marketplace subscriptions", tone: "bg-gold" },
  ];

  const submitAdjust = async () => {
    if (busy) return;
    const n = parseMoneyInput(amount);
    if (!(n > 0) || reason.trim().length < 3) {
      toast.error("Enter a positive amount and a reason (min 3 characters)");
      return;
    }
    setBusy(true);
    try {
      const result = await adjustAdminUserBalance(userId, {
        pool,
        direction,
        amount: n,
        reason: reason.trim(),
      });
      setWallet(result.balances.wallet);
      setCall(result.balances.call);
      setFixed(result.balances.fixed);
      setExplore(result.balances.explore);
      setAmount("");
      setReason("");
      toast.success(
        `${direction === "credit" ? "Credited" : "Debited"} ${naira(n)} ${pool === "WALLET" ? "wallet" : "Call Account"}`,
      );
      void hydrateAdminUserFromApi(userId);
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Could not adjust balance");
    } finally {
      setBusy(false);
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand";
  const labelClass =
    "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground";

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Wallet" value={loading ? "…" : naira(wallet)} />
        <Stat label="Call" value={loading ? "…" : naira(call)} />
        <Stat label="Investments" value={loading ? "…" : naira(fixed + explore)} />
        <Stat label="Portfolio total" value={loading ? "…" : naira(total)} tone="brand" />
      </section>

      {superAdmin ? (
        <Panel title="Adjust balance" eyebrow="Super admin only">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={labelClass}>Pool</span>
              <select
                value={pool}
                onChange={(e) => setPool(e.target.value as "WALLET" | "CALL")}
                className={fieldClass}
              >
                <option value="WALLET">Wallet</option>
                <option value="CALL">Call Account</option>
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Direction</span>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as "credit" | "debit")}
                className={fieldClass}
              >
                <option value="credit">Credit (add)</option>
                <option value="debit">Debit (remove)</option>
              </select>
            </label>
            <label className="block">
              <span className={labelClass}>Amount (₦)</span>
              <input
                value={amount}
                onChange={(e) => setAmount(formatMoneyInput(e.target.value))}
                placeholder="0.00"
                className={fieldClass}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelClass}>Reason</span>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Required — shown in audit log"
                className={fieldClass}
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={busy || !parseMoneyInput(amount) || reason.trim().length < 3}
              onClick={() => void submitAdjust()}
              className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-[13px] font-bold text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save adjustment"}
            </button>
          </div>
        </Panel>
      ) : null}

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
