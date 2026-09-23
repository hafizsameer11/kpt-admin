import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Panel } from "@/components/kipit/AdminBits";
import { naira } from "@/lib/admin-data";
import { loadAdminUserTransactions } from "@/lib/admin-mappers";
import { type AdminTxn, type AdminTxnType } from "@/lib/admin-users-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/users_/$userId/transactions")({
  component: Transactions,
});

const TYPES: { value: "all" | AdminTxnType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "deposit", label: "Deposits" },
  { value: "placement", label: "Placements" },
  { value: "interest", label: "Interest" },
  { value: "maturity", label: "Maturities" },
  { value: "withdrawal", label: "Withdrawals" },
];

const STATUS_TONE: Record<AdminTxn["status"], string> = {
  successful: "bg-emerald-500/12 text-emerald-700",
  processing: "bg-gold/25 text-gold-foreground",
  failed: "bg-destructive/10 text-destructive",
  declined: "bg-destructive/10 text-destructive",
};

function Transactions() {
  const { userId } = Route.useParams();
  const [all, setAll] = useState<AdminTxn[]>([]);
  const [type, setType] = useState<"all" | AdminTxnType>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<AdminTxn | null>(null);

  useEffect(() => {
    void loadAdminUserTransactions(userId).then(setAll);
  }, [userId]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (!q) return true;
      return [t.label, t.ref, t.channel].some((f) => f.toLowerCase().includes(q));
    });
  }, [all, type, query]);

  return (
    <>
      <Panel className="overflow-hidden">
        <div className="-m-5">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/70 px-5 py-4">
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`rounded-lg px-3 py-1.5 text-[12.5px] font-bold transition ${
                    type === t.value
                      ? "bg-brand text-primary-foreground"
                      : "border border-border bg-card hover:bg-muted"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <label className="ml-auto flex min-w-[14rem] items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search reference or channel"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
              />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="px-5 py-2.5">Date</th>
                  <th className="px-5 py-2.5">Type</th>
                  <th className="px-5 py-2.5">Description</th>
                  <th className="px-5 py-2.5 text-right">Amount</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5">Reference</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setOpen(t)}
                    className="cursor-pointer border-b border-border/60 transition hover:bg-muted/40"
                  >
                    <td className="px-5 py-3 text-[13px] text-muted-foreground">{t.at}</td>
                    <td className="px-5 py-3 text-[13px] font-bold capitalize">{t.type}</td>
                    <td className="px-5 py-3 text-[13px]">{t.label}</td>
                    <td className="px-5 py-3 text-right text-[13px] font-bold">{naira(t.amount)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_TONE[t.status]}`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[12.5px] text-muted-foreground">{t.ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? (
              <p className="px-5 py-12 text-center text-[13px] text-muted-foreground">
                No transactions match these filters.
              </p>
            ) : null}
          </div>
        </div>
      </Panel>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="sm:max-w-[28rem]">
          <DialogHeader>
            <DialogTitle>Transaction detail</DialogTitle>
            <DialogDescription>{open?.ref}</DialogDescription>
          </DialogHeader>
          {open ? (
            <ul className="divide-y divide-border/70 text-[13px]">
              {[
                ["Description", open.label],
                ["Type", open.type],
                ["Amount", naira(open.amount)],
                ["Status", open.status],
                ["Channel", open.channel],
                ["Timestamp", open.at],
              ].map(([k, v]) => (
                <li key={k} className="flex justify-between gap-4 py-2.5">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="text-right font-bold capitalize">{v}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
