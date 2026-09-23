import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowRight,
  Ban,
  Clock,
  FileText,
  Lock,
  LockOpen,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Panel, Stat } from "@/components/kipit/AdminBits";
import { findUser, hydrateAdminUserFromApi, portfolioValue, type AdminUser } from "@/lib/admin-users-data";
import { setAdminUserFrozen } from "@/lib/admin-api";
import { naira } from "@/lib/admin-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/users_/$userId/frozen")({
  loader: async ({ params }) => {
    let user = findUser(params.userId);
    if (!user) user = (await hydrateAdminUserFromApi(params.userId)) ?? undefined;
    if (!user) throw notFound();
    return { user };
  },
  component: FrozenState,
});

const RESTRICTIONS = [
  { label: "Wallet funding", blocked: true },
  { label: "New investments", blocked: true },
  { label: "Withdrawals and payouts", blocked: true },
  { label: "Adding payout banks", blocked: true },
  { label: "Sign in and view balances", blocked: false },
  { label: "Contact support", blocked: false },
];

function FrozenState() {
  const { user: initial } = Route.useLoaderData();
  const [user, setUser] = useState<AdminUser>(initial);
  const [frozen, setFrozen] = useState(initial.status === "frozen");
  const [unfreezeOpen, setUnfreezeOpen] = useState(false);
  const [freezeOpen, setFreezeOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void hydrateAdminUserFromApi(initial.id).then((u) => {
      if (!u) return;
      setUser(u);
      setFrozen(u.status === "frozen");
    });
  }, [initial.id]);

  const timeline =
    frozen && user.freeze
      ? [
          {
            id: "t-freeze",
            title: "Account frozen",
            detail: user.freeze.reason || "Compliance review",
            by: user.freeze.by || "Compliance",
            when: user.freeze.date || "—",
          },
        ]
      : [];

  async function applyFreeze() {
    if (!reason.trim()) return;
    setBusy(true);
    try {
      await setAdminUserFrozen(user.id, true, reason.trim());
      setFrozen(true);
      setFreezeOpen(false);
      setReason("");
      toast.success("Account frozen", { description: `${user.name} is now restricted.` });
      const refreshed = await hydrateAdminUserFromApi(user.id);
      if (refreshed) setUser(refreshed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to freeze account");
    } finally {
      setBusy(false);
    }
  }

  async function liftFreeze() {
    setBusy(true);
    try {
      await setAdminUserFrozen(user.id, false);
      setFrozen(false);
      setUnfreezeOpen(false);
      toast.success("Restriction lifted", { description: `${user.name} has full access.` });
      const refreshed = await hydrateAdminUserFromApi(user.id);
      if (refreshed) setUser(refreshed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to lift restriction");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section
        className={`relative overflow-hidden rounded-3xl border p-6 ${
          frozen ? "border-destructive/30 bg-destructive/8" : "border-emerald-500/25 bg-emerald-500/8"
        }`}
      >
        <div className="flex flex-wrap items-center gap-4">
          <span
            className={`grid size-12 place-items-center rounded-2xl ${
              frozen ? "bg-destructive/15 text-destructive" : "bg-emerald-500/15 text-emerald-700"
            }`}
          >
            {frozen ? <Lock className="size-5" /> : <LockOpen className="size-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[20px] font-extrabold tracking-[-0.02em]">
              {frozen ? "This account is frozen" : "This account has full access"}
            </h2>
            <p className="text-[13px] text-muted-foreground">
              {frozen
                ? `${user.name} cannot fund, invest or withdraw. Balances stay intact and continue to earn where already invested.`
                : `${user.name} can fund, invest and withdraw normally.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => (frozen ? setUnfreezeOpen(true) : setFreezeOpen(true))}
            className={`rounded-lg px-4 py-2.5 text-[13px] font-bold transition hover:opacity-90 ${
              frozen
                ? "bg-brand text-primary-foreground"
                : "bg-destructive text-destructive-foreground"
            }`}
          >
            {frozen ? "Lift restriction" : "Freeze account"}
          </button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Status"
          value={frozen ? "Frozen" : "Active"}
          helper={frozen ? user.freeze?.date ?? "Restricted" : "No restriction"}
          tone="brand"
          icon={ShieldAlert}
        />
        <Stat label="Balances held" value={naira(portfolioValue(user))} helper="Across all pockets" tone="gold" icon={Wallet} />
        <Stat label="Days restricted" value={frozen ? "—" : "0"} helper="Target review 5 working days" icon={Clock} />
        <Stat
          label="Open compliance case"
          value={frozen ? "Active" : "—"}
          helper={user.freeze?.reason ?? "No open case"}
          icon={FileText}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
        <Panel title="What is blocked" eyebrow="Customer experience" icon={Ban}>
          <ul className="space-y-2.5">
            {RESTRICTIONS.map((r) => (
              <li
                key={r.label}
                className="flex items-center gap-3 rounded-xl border border-border/70 px-3.5 py-2.5"
              >
                <span
                  className={`size-2 rounded-full ${r.blocked ? "bg-destructive" : "bg-emerald-500"}`}
                />
                <span className="flex-1 text-[13.5px] font-semibold">{r.label}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    r.blocked
                      ? "bg-destructive/10 text-destructive"
                      : "bg-emerald-500/12 text-emerald-700"
                  }`}
                >
                  {frozen ? (r.blocked ? "Blocked" : "Allowed") : "Allowed"}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-xl bg-muted/50 p-3.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Message shown to the customer
            </p>
            <p className="mt-1 text-[13px]">
              “Your account is temporarily restricted while we complete a routine check. Your money
              is safe. Please send the documents requested by our team.”
            </p>
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel title="Restriction history" eyebrow="Audit trail">
            {timeline.length === 0 ? (
              <p className="py-4 text-[13px] text-muted-foreground">No restriction events yet.</p>
            ) : (
              <ol className="relative space-y-4 border-l border-border pl-5">
                {timeline.map((t) => (
                  <li key={t.id} className="relative">
                    <span className="absolute -left-[1.55rem] top-1.5 size-2.5 rounded-full bg-gold ring-4 ring-card" />
                    <p className="text-[13.5px] font-bold">{t.title}</p>
                    <p className="text-[12.5px] text-muted-foreground">{t.detail}</p>
                    <p className="text-[11.5px] text-muted-foreground">
                      {t.by} · {t.when}
                    </p>
                  </li>
                ))}
              </ol>
            )}
            <Link
              to="/users/$userId/audit"
              params={{ userId: user.id }}
              className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-bold text-brand"
            >
              Full audit trail <ArrowRight className="size-3.5" />
            </Link>
          </Panel>
        </div>
      </div>

      <Dialog open={unfreezeOpen} onOpenChange={setUnfreezeOpen}>
        <DialogContent className="sm:max-w-[26rem]">
          <DialogHeader>
            <DialogTitle>Lift the restriction?</DialogTitle>
            <DialogDescription>
              {user.name} regains funding, investing and withdrawal access immediately. The change is
              recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setUnfreezeOpen(false)}
              className="rounded-lg border border-border px-3.5 py-2 text-[13px] font-bold transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void liftFreeze()}
              className="rounded-lg bg-brand px-3.5 py-2 text-[13px] font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              Lift restriction
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={freezeOpen} onOpenChange={setFreezeOpen}>
        <DialogContent className="sm:max-w-[26rem]">
          <DialogHeader>
            <DialogTitle>Freeze this account</DialogTitle>
            <DialogDescription>
              Blocks funding, investing and withdrawals until lifted. A reason is mandatory.
            </DialogDescription>
          </DialogHeader>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for the restriction"
            className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFreezeOpen(false)}
              className="rounded-lg border border-border px-3.5 py-2 text-[13px] font-bold transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!reason.trim() || busy}
              onClick={() => void applyFreeze()}
              className="rounded-lg bg-destructive px-3.5 py-2 text-[13px] font-bold text-destructive-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              Freeze account
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
