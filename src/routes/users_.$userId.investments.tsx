import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Panel } from "@/components/kipit/AdminBits";
import { naira } from "@/lib/admin-data";
import { AdminApiError, createAdminPlacement } from "@/lib/admin-api";
import { loadAdminUserPlacements } from "@/lib/admin-mappers";
import { type AdminInvestment } from "@/lib/admin-users-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/users_/$userId/investments")({
  component: Investments,
});

const SECTIONS: { key: AdminInvestment["state"]; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "matured", label: "Matured" },
  { key: "adjusted", label: "Adjusted" },
];

function Investments() {
  const { userId } = Route.useParams();
  const [rows, setRows] = useState<AdminInvestment[]>([]);
  const [open, setOpen] = useState<AdminInvestment | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [kind, setKind] = useState<"FIXED" | "CALL">("FIXED");
  const [amount, setAmount] = useState("");
  const [tenorDays, setTenorDays] = useState("90");
  const [name, setName] = useState("Fixed plan");
  const [debitWallet, setDebitWallet] = useState(true);
  const [busy, setBusy] = useState(false);

  const reload = () => void loadAdminUserPlacements(userId).then(setRows);

  useEffect(() => {
    reload();
  }, [userId]);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await createAdminPlacement(userId, {
        kind,
        amount: Number(amount.replace(/,/g, "")),
        tenorDays: kind === "FIXED" ? Number(tenorDays) : undefined,
        name: kind === "FIXED" ? name : undefined,
        debitWallet: kind === "FIXED" ? debitWallet : true,
      });
      toast.success("Investment recorded");
      setCreateOpen(false);
      setAmount("");
      reload();
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Could not create investment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-10 items-center rounded-xl bg-brand px-4 text-[13px] font-bold text-primary-foreground"
        >
          Invest for customer
        </button>
      </div>

      {SECTIONS.map((section) => {
        const list = rows.filter((r) => r.state === section.key);
        return (
          <Panel
            key={section.key}
            title={`${section.label} investments`}
            action={
              <span className="text-[12px] font-bold text-muted-foreground">
                {list.length} {list.length === 1 ? "holding" : "holdings"}
              </span>
            }
          >
            {list.length === 0 ? (
              <p className="py-4 text-[13px] text-muted-foreground">Nothing in this section.</p>
            ) : (
              <div className="-mx-5 overflow-x-auto">
                <table className="w-full min-w-[52rem] border-collapse text-left">
                  <thead>
                    <tr className="border-y border-border/70 bg-muted/40 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                      <th className="px-5 py-2.5">Product</th>
                      <th className="px-5 py-2.5 text-right">Principal</th>
                      <th className="px-5 py-2.5">Rate</th>
                      <th className="px-5 py-2.5">Start</th>
                      <th className="px-5 py-2.5">Maturity</th>
                      <th className="px-5 py-2.5 text-right">Expected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => setOpen(r)}
                        className="cursor-pointer border-b border-border/60 transition hover:bg-muted/40"
                      >
                        <td className="px-5 py-3 text-[13.5px] font-bold">{r.product}</td>
                        <td className="px-5 py-3 text-right text-[13px]">{naira(r.principal)}</td>
                        <td className="px-5 py-3 text-[13px] font-bold text-brand">{r.rate}</td>
                        <td className="px-5 py-3 text-[13px] text-muted-foreground">{r.start}</td>
                        <td className="px-5 py-3 text-[13px] text-muted-foreground">{r.maturity}</td>
                        <td className="px-5 py-3 text-right text-[13px] font-bold">
                          {naira(r.expected)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        );
      })}

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="sm:max-w-[28rem]">
          <DialogHeader>
            <DialogTitle>{open?.product}</DialogTitle>
            <DialogDescription>Investment detail.</DialogDescription>
          </DialogHeader>
          {open ? (
            <ul className="divide-y divide-border/70 text-[13px]">
              {[
                ["Principal", naira(open.principal)],
                ["Rate", open.rate],
                ["Start date", open.start],
                ["Maturity", open.maturity],
                ["Expected", naira(open.expected)],
              ].map(([k, v]) => (
                <li key={String(k)} className="flex justify-between gap-4 py-2.5">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-bold">{v}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invest for customer</DialogTitle>
            <DialogDescription>
              Place a fixed plan or fund Call Account. Existing UI layout is unchanged elsewhere.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              {(["FIXED", "CALL"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-bold ${
                    kind === k ? "bg-brand text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {k === "FIXED" ? "Fixed plan" : "Call Account"}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Amount (₦)
              </span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
              />
            </label>
            {kind === "FIXED" ? (
              <>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Plan name
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    Tenor (days)
                  </span>
                  <input
                    value={tenorDays}
                    onChange={(e) => setTenorDays(e.target.value.replace(/[^\d]/g, ""))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
                  />
                </label>
                <label className="flex items-center gap-2 text-[13px]">
                  <input
                    type="checkbox"
                    checked={debitWallet}
                    onChange={(e) => setDebitWallet(e.target.checked)}
                  />
                  Debit customer wallet (uncheck to seed from suspense then place)
                </label>
              </>
            ) : null}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-[13px] font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || !Number(amount)}
              onClick={() => void submit()}
              className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-[13px] font-bold text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Saving…" : "Confirm"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
