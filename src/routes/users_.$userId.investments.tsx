import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Panel } from "@/components/kipit/AdminBits";
import { naira } from "@/lib/admin-data";
import {
  AdminApiError,
  createAdminPlacement,
  matureAdminPlacement,
  updateAdminPlacement,
} from "@/lib/admin-api";
import { loadAdminUserPlacements } from "@/lib/admin-mappers";
import { type AdminInvestment } from "@/lib/admin-users-data";
import {
  formatMoneyInput,
  formatRateInput,
  isSuperAdminSession,
  moneyToInput,
  parseMoneyInput,
} from "@/lib/admin-super";
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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function Investments() {
  const { userId } = Route.useParams();
  const superAdmin = useMemo(() => isSuperAdminSession(), []);

  const [rows, setRows] = useState<AdminInvestment[]>([]);
  const [open, setOpen] = useState<AdminInvestment | null>(null);
  const [confirmMature, setConfirmMature] = useState<AdminInvestment | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [kind, setKind] = useState<"FIXED" | "CALL">("FIXED");
  const [amount, setAmount] = useState("");
  const [tenorDays, setTenorDays] = useState("90");
  const [name, setName] = useState("Fixed plan");
  const [debitWallet, setDebitWallet] = useState(true);
  const [startDate, setStartDate] = useState(todayIso());
  const [maturityDate, setMaturityDate] = useState(addDaysIso(todayIso(), 90));
  const [ratePct, setRatePct] = useState("");
  const [expectedInterest, setExpectedInterest] = useState("");
  const [expectedPayout, setExpectedPayout] = useState("");
  const [maturityInstruction, setMaturityInstruction] = useState<"WALLET" | "ROLLOVER" | "PAYOUT">(
    "WALLET",
  );
  const [busy, setBusy] = useState(false);
  const [maturing, setMaturing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [editName, setEditName] = useState("");
  const [editPrincipal, setEditPrincipal] = useState("");
  const [editRatePct, setEditRatePct] = useState("");
  const [editTenor, setEditTenor] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editMaturity, setEditMaturity] = useState("");
  const [editInterest, setEditInterest] = useState("");
  const [editPayout, setEditPayout] = useState("");
  const [editAccrued, setEditAccrued] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "MATURED" | "CLOSED">("ACTIVE");
  const [editInstruction, setEditInstruction] = useState<"WALLET" | "ROLLOVER" | "PAYOUT">("WALLET");
  const [dirtyYield, setDirtyYield] = useState<"rate" | "interest" | "payout" | null>(null);

  const resetCreateForm = () => {
    setKind("FIXED");
    setAmount("");
    setTenorDays("90");
    setName("Fixed plan");
    setDebitWallet(true);
    setStartDate(todayIso());
    setMaturityDate(addDaysIso(todayIso(), 90));
    setRatePct("");
    setExpectedInterest("");
    setExpectedPayout("");
    setMaturityInstruction("WALLET");
  };

  const reload = () => void loadAdminUserPlacements(userId).then(setRows);

  useEffect(() => {
    reload();
  }, [userId]);

  useEffect(() => {
    if (!createOpen) return;
    setAmount("");
    setTenorDays("90");
    setName(kind === "FIXED" ? "Fixed plan" : "Call Account");
    setDebitWallet(true);
    setStartDate(todayIso());
    setMaturityDate(addDaysIso(todayIso(), 90));
    setRatePct("");
    setExpectedInterest("");
    setExpectedPayout("");
    setMaturityInstruction("WALLET");
  }, [kind, createOpen]);

  useEffect(() => {
    if (!open) {
      setEditing(false);
      return;
    }
    setEditName(open.product);
    setEditPrincipal(moneyToInput(open.principal));
    {
      const pct = open.ratePct ?? Number(open.rate.replace("%", "")) || 0;
      setEditRatePct(pct ? pct.toFixed(4).replace(/\.?0+$/, "") : "");
    }
    setEditTenor(open.tenorDays != null ? String(open.tenorDays) : "");
    setEditStart(open.startIso || todayIso());
    setEditMaturity(open.maturityIso || "");
    setEditInterest(
      moneyToInput(open.expectedInterest ?? Math.max(0, open.expected - open.principal)),
    );
    setEditPayout(moneyToInput(open.expected));
    setEditAccrued(moneyToInput(open.accrued ?? 0));
    const raw = (open.statusRaw || "").toUpperCase();
    setEditStatus(raw === "MATURED" || raw === "CLOSED" ? raw : "ACTIVE");
    const instr = (open.maturityInstruction || "WALLET").toUpperCase();
    setEditInstruction(
      instr === "ROLLOVER" || instr === "PAYOUT" ? instr : "WALLET",
    );
    setDirtyYield(null);
  }, [open]);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const payload: Parameters<typeof createAdminPlacement>[1] = {
        kind,
        amount: parseMoneyInput(amount),
        tenorDays: kind === "FIXED" ? Number(tenorDays) || undefined : undefined,
        name: kind === "FIXED" ? name : undefined,
        debitWallet: kind === "FIXED" ? debitWallet : true,
      };
      if (kind === "FIXED" && superAdmin) {
        payload.startDate = startDate;
        if (maturityDate) payload.maturityDate = maturityDate;
        payload.maturityInstruction = maturityInstruction;
        if (expectedPayout.trim()) payload.expectedPayout = parseMoneyInput(expectedPayout);
        else if (expectedInterest.trim())
          payload.expectedInterest = parseMoneyInput(expectedInterest);
        else if (ratePct.trim()) payload.ratePct = Number(ratePct);
      }
      await createAdminPlacement(userId, payload);
      toast.success("Investment recorded");
      setCreateOpen(false);
      resetCreateForm();
      reload();
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Could not create investment");
    } finally {
      setBusy(false);
    }
  };

  const matureNow = async () => {
    if (!confirmMature || maturing) return;
    setMaturing(true);
    try {
      const result = await matureAdminPlacement(userId, confirmMature.id);
      toast.success(
        `Matured ${result.name} — ${naira(result.payout)} to wallet (interest ${naira(result.interest)})`,
      );
      setConfirmMature(null);
      setOpen(null);
      reload();
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Could not mature investment");
    } finally {
      setMaturing(false);
    }
  };

  const saveEdit = async () => {
    if (!open || savingEdit || !superAdmin) return;
    setSavingEdit(true);
    try {
      const payload: Parameters<typeof updateAdminPlacement>[2] = {
        name: editName.trim() || open.product,
        principal: parseMoneyInput(editPrincipal),
        tenorDays: editTenor.trim() ? Number(editTenor) : undefined,
        startDate: editStart || undefined,
        maturityDate: editMaturity || null,
        accrued: editAccrued.trim() ? parseMoneyInput(editAccrued) : undefined,
        status: editStatus,
        maturityInstruction: editInstruction,
      };
      // Prefer exact payout/interest so SUPER totals stick (rate↔interest math truncates).
      if (dirtyYield === "rate" && editRatePct.trim()) {
        payload.ratePct = Number(editRatePct);
      } else if (editPayout.trim()) {
        payload.expectedPayout = parseMoneyInput(editPayout);
      } else if (editInterest.trim()) {
        payload.expectedInterest = parseMoneyInput(editInterest);
      } else if (editRatePct.trim()) {
        payload.ratePct = Number(editRatePct);
      }

      await updateAdminPlacement(userId, open.id, payload);
      toast.success("Investment updated");
      setEditing(false);
      setOpen(null);
      reload();
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Could not update investment");
    } finally {
      setSavingEdit(false);
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand";
  const labelClass =
    "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground";

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

      <Dialog
        open={!!open}
        onOpenChange={(v) => {
          if (!v) {
            setOpen(null);
            setEditing(false);
          }
        }}
      >
        <DialogContent className={editing ? "sm:max-w-[32rem]" : "sm:max-w-[28rem]"}>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit investment" : open?.product}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Super admin can change every field on this placement."
                : "Investment detail."}
            </DialogDescription>
          </DialogHeader>
          {open ? (
            editing && superAdmin ? (
              <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
                <label className="block">
                  <span className={labelClass}>Plan name</span>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className={labelClass}>Principal (₦)</span>
                    <input
                      value={editPrincipal}
                      onChange={(e) => setEditPrincipal(formatMoneyInput(e.target.value))}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Rate (% p.a.)</span>
                    <input
                      value={editRatePct}
                      onChange={(e) => {
                        setDirtyYield("rate");
                        setEditRatePct(formatRateInput(e.target.value));
                      }}
                      className={fieldClass}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className={labelClass}>Start date</span>
                    <input
                      type="date"
                      value={editStart}
                      onChange={(e) => setEditStart(e.target.value)}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Maturity date</span>
                    <input
                      type="date"
                      value={editMaturity}
                      onChange={(e) => setEditMaturity(e.target.value)}
                      className={fieldClass}
                    />
                  </label>
                </div>
                <label className="block">
                  <span className={labelClass}>Tenor (days)</span>
                  <input
                    value={editTenor}
                    onChange={(e) => setEditTenor(e.target.value.replace(/[^\d]/g, ""))}
                    className={fieldClass}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className={labelClass}>Full interest (₦)</span>
                    <input
                      value={editInterest}
                      onChange={(e) => {
                        setDirtyYield("interest");
                        setEditInterest(formatMoneyInput(e.target.value));
                      }}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Total payout (₦)</span>
                    <input
                      value={editPayout}
                      onChange={(e) => {
                        setDirtyYield("payout");
                        setEditPayout(formatMoneyInput(e.target.value));
                      }}
                      className={fieldClass}
                    />
                  </label>
                </div>
                <label className="block">
                  <span className={labelClass}>Accrued interest (₦)</span>
                  <input
                    value={editAccrued}
                    onChange={(e) => setEditAccrued(formatMoneyInput(e.target.value))}
                    className={fieldClass}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className={labelClass}>Status</span>
                    <select
                      value={editStatus}
                      onChange={(e) =>
                        setEditStatus(e.target.value as "ACTIVE" | "MATURED" | "CLOSED")
                      }
                      className={fieldClass}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="MATURED">Matured</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className={labelClass}>At maturity</span>
                    <select
                      value={editInstruction}
                      onChange={(e) =>
                        setEditInstruction(e.target.value as "WALLET" | "ROLLOVER" | "PAYOUT")
                      }
                      className={fieldClass}
                    >
                      <option value="WALLET">Wallet</option>
                      <option value="ROLLOVER">Rollover</option>
                      <option value="PAYOUT">Payout bank</option>
                    </select>
                  </label>
                </div>
                <p className="text-[11.5px] text-muted-foreground">
                  Setting interest or payout adjusts the stored rate so the math matches. Principal
                  changes update the placement ledger only (wallet is not auto-moved).
                </p>
                <DialogFooter className="mt-2">
                  <button
                    type="button"
                    disabled={savingEdit}
                    onClick={() => setEditing(false)}
                    className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-[13px] font-bold disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingEdit || !parseMoneyInput(editPrincipal)}
                    onClick={() => void saveEdit()}
                    className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-[13px] font-bold text-primary-foreground disabled:opacity-50"
                  >
                    {savingEdit ? "Saving…" : "Save changes"}
                  </button>
                </DialogFooter>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-border/70 text-[13px]">
                  {[
                    ["Principal", naira(open.principal)],
                    ["Rate", open.rate],
                    ["Start date", open.start],
                    ["Maturity", open.maturity],
                    [
                      "Full interest",
                      naira(open.expectedInterest ?? Math.max(0, open.expected - open.principal)),
                    ],
                    ["Expected payout", naira(open.expected)],
                    ["Status", open.state],
                  ].map(([k, v]) => (
                    <li key={String(k)} className="flex justify-between gap-4 py-2.5">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-bold capitalize">{v}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 space-y-3">
                  {open.state === "active" ? (
                    <p className="text-[11.5px] leading-snug text-muted-foreground">
                      Mature now pays full tenor interest even if days held are short.
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {superAdmin ? (
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-border bg-background px-4 text-[13px] font-bold"
                      >
                        Edit investment
                      </button>
                    ) : null}
                    {open.state === "active" ? (
                      <button
                        type="button"
                        onClick={() => setConfirmMature(open)}
                        className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-brand px-4 text-[13px] font-bold text-primary-foreground"
                      >
                        Mature now
                      </button>
                    ) : null}
                  </div>
                </div>
              </>
            )
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmMature}
        onOpenChange={(v) => {
          if (!v && !maturing) setConfirmMature(null);
        }}
      >
        <DialogContent className="sm:max-w-[26rem]">
          <DialogHeader>
            <DialogTitle>Mature this investment now?</DialogTitle>
            <DialogDescription>
              Settles immediately with full profit for the original tenor. Customer wallet gets one
              maturity credit (principal + interest).
            </DialogDescription>
          </DialogHeader>
          {confirmMature ? (
            <ul className="divide-y divide-border/70 text-[13px]">
              {[
                ["Product", confirmMature.product],
                ["Principal", naira(confirmMature.principal)],
                [
                  "Full interest",
                  naira(
                    confirmMature.expectedInterest ??
                      Math.max(0, confirmMature.expected - confirmMature.principal),
                  ),
                ],
                ["Payout to wallet", naira(confirmMature.expected)],
                [
                  "Tenor",
                  confirmMature.tenorDays != null ? `${confirmMature.tenorDays} days` : "—",
                ],
              ].map(([k, v]) => (
                <li key={String(k)} className="flex justify-between gap-4 py-2.5">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-bold">{v}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <DialogFooter>
            <button
              type="button"
              disabled={maturing}
              onClick={() => setConfirmMature(null)}
              className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-[13px] font-bold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={maturing}
              onClick={() => void matureNow()}
              className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-[13px] font-bold text-primary-foreground disabled:opacity-50"
            >
              {maturing ? "Maturing…" : "Confirm mature"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={createOpen}
        onOpenChange={(openDlg) => {
          setCreateOpen(openDlg);
          if (!openDlg) resetCreateForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invest for customer</DialogTitle>
            <DialogDescription>
              {superAdmin
                ? "Full control: set start date, rate, interest, and payout as needed."
                : "Place a fixed plan or fund Call Account."}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
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
              <span className={labelClass}>Amount (₦)</span>
              <input
                value={amount}
                onChange={(e) => setAmount(formatMoneyInput(e.target.value))}
                className={fieldClass}
              />
            </label>
            {kind === "FIXED" ? (
              <>
                <label className="block">
                  <span className={labelClass}>Plan name</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={fieldClass}
                  />
                </label>
                {superAdmin ? (
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className={labelClass}>Start date</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          const days = Number(tenorDays) || 90;
                          setMaturityDate(addDaysIso(e.target.value || todayIso(), days));
                        }}
                        className={fieldClass}
                      />
                    </label>
                    <label className="block">
                      <span className={labelClass}>Maturity date</span>
                      <input
                        type="date"
                        value={maturityDate}
                        onChange={(e) => setMaturityDate(e.target.value)}
                        className={fieldClass}
                      />
                    </label>
                  </div>
                ) : null}
                <label className="block">
                  <span className={labelClass}>Tenor (days)</span>
                  <input
                    value={tenorDays}
                    onChange={(e) => {
                      const next = e.target.value.replace(/[^\d]/g, "");
                      setTenorDays(next);
                      if (superAdmin && startDate && next) {
                        setMaturityDate(addDaysIso(startDate, Number(next) || 0));
                      }
                    }}
                    className={fieldClass}
                  />
                </label>
                {superAdmin ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className={labelClass}>Rate (% p.a.)</span>
                        <input
                          value={ratePct}
                          onChange={(e) => setRatePct(formatRateInput(e.target.value))}
                          placeholder="Band default if empty"
                          className={fieldClass}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>At maturity</span>
                        <select
                          value={maturityInstruction}
                          onChange={(e) =>
                            setMaturityInstruction(
                              e.target.value as "WALLET" | "ROLLOVER" | "PAYOUT",
                            )
                          }
                          className={fieldClass}
                        >
                          <option value="WALLET">Wallet</option>
                          <option value="ROLLOVER">Rollover</option>
                          <option value="PAYOUT">Payout bank</option>
                        </select>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className={labelClass}>Interest (₦)</span>
                        <input
                          value={expectedInterest}
                          onChange={(e) => setExpectedInterest(formatMoneyInput(e.target.value))}
                          placeholder="Optional override"
                          className={fieldClass}
                        />
                      </label>
                      <label className="block">
                        <span className={labelClass}>Total payout (₦)</span>
                        <input
                          value={expectedPayout}
                          onChange={(e) => setExpectedPayout(formatMoneyInput(e.target.value))}
                          placeholder="Optional override"
                          className={fieldClass}
                        />
                      </label>
                    </div>
                  </>
                ) : null}
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
              disabled={busy || !parseMoneyInput(amount)}
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
