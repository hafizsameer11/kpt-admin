import {
  createFileRoute,
  Link,
  Outlet,
  notFound,
  useNavigate,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Lock, LockOpen, Mail, Phone, TicketCheck } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { StatusPill, TierPill } from "@/components/kipit/AdminBits";
import { findUser, hydrateAdminUserFromApi, portfolioValue } from "@/lib/admin-users-data";
import { naira } from "@/lib/admin-data";
import { createAdminSupportTicket, setAdminUserFrozen } from "@/lib/admin-api";
import {
  CATEGORY_LABEL,
  type TicketCategory,
} from "@/lib/admin-support-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/users_/$userId")({
  ssr: false,
  loader: async ({ params }) => {
    let user = findUser(params.userId);
    if (!user && typeof window !== "undefined") {
      user = (await hydrateAdminUserFromApi(params.userId)) ?? undefined;
    }
    if (!user) {
      if (typeof window === "undefined") return { user: null };
      throw notFound();
    }
    return { user };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.user?.name ?? "User";
    return {
      meta: [
        { title: `${name} — Kipit Admin Console` },
        {
          name: "description",
          content: `Administrative profile for ${name}: balances, investments, transactions, KYC, sessions, support and audit trail.`,
        },
        { property: "og:title", content: `${name} — Kipit Admin Console` },
        {
          property: "og:description",
          content: "Customer profile overview for Kipit administrators.",
        },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: AdminUserProfile,
});

const TABS = [
  { label: "Overview", to: "/users/$userId" as const, exact: true },
  { label: "Balances", to: "/users/$userId/balances" as const },
  { label: "Investments", to: "/users/$userId/investments" as const },
  { label: "Transactions", to: "/users/$userId/transactions" as const },
  { label: "KYC", to: "/users/$userId/kyc" as const },
  { label: "Sessions", to: "/users/$userId/sessions" as const },
  { label: "Support", to: "/users/$userId/support" as const },
  { label: "Audit", to: "/users/$userId/audit" as const },
  { label: "Access", to: "/users/$userId/frozen" as const },
];

const TICKET_CATEGORIES = Object.keys(CATEGORY_LABEL) as TicketCategory[];

function AdminUserProfile() {
  const loaderData = Route.useLoaderData();
  const user = loaderData.user;
  const { userId } = Route.useParams();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const router = useRouter();
  const [freezeOpen, setFreezeOpen] = useState(false);
  const [freezeBusy, setFreezeBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketBusy, setTicketBusy] = useState(false);
  const [ticketCategory, setTicketCategory] = useState<TicketCategory>("general");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketBody, setTicketBody] = useState("");

  if (!user) {
    return (
      <AdminShell title="User profile" subtitle="ADM-021">
        <p className="text-[13px] text-muted-foreground">Loading user…</p>
      </AdminShell>
    );
  }

  const isFrozen = user.status === "frozen";
  const freezeRequiresReason = !isFrozen;

  return (
    <AdminShell title={user.name} subtitle={`ADM-021 · ${user.id}`}>
      <div className="space-y-5">
        <Link
          to="/users"
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All users
        </Link>

        {/* Identity header */}
        <section className="relative overflow-hidden rounded-3xl bg-brand-gradient p-6 text-primary-foreground shadow-[0_24px_60px_-38px_rgba(11,29,58,0.9)]">
          <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-gold/18 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/4 size-64 rounded-full bg-white/8 blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-gold text-[16px] font-extrabold text-gold-foreground">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
              <div>
                <h2 className="font-display text-[24px] font-extrabold tracking-[-0.02em]">
                  {user.name}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-primary-foreground/70">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="size-3.5" />
                    {user.email}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    {user.phone}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <TierPill tier={user.tier} onDark />
                  <StatusPill status={user.status} onDark />
                  <span className="text-[12px] text-primary-foreground/60">
                    Joined {user.joined} · last active {user.lastActive}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-right ring-1 ring-white/15">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/55">
                  Portfolio value
                </p>
                <p className="mt-1 font-display text-[24px] font-extrabold tracking-[-0.02em]">
                  {naira(portfolioValue(user))}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTicketOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-[12.5px] font-bold text-primary-foreground transition hover:bg-white/20"
                >
                  <TicketCheck className="size-4" />
                  New ticket
                </button>
                <button
                  type="button"
                  onClick={() => setFreezeOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-[12.5px] font-bold text-gold-foreground transition hover:opacity-90"
                >
                  {isFrozen ? (
                    <>
                      <LockOpen className="size-4" />
                      Unfreeze
                    </>
                  ) : (
                    <>
                      <Lock className="size-4" />
                      Freeze account
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <nav className="no-scrollbar sticky top-16 z-20 overflow-x-auto rounded-2xl border border-border/80 bg-card/95 p-1.5 shadow-[0_1px_2px_rgba(11,29,58,0.04),0_12px_28px_-22px_rgba(11,29,58,0.4)] backdrop-blur">
          <ul className="flex min-w-max gap-1">
            {TABS.map((tab) => {
              const active = pathname === tab.to.replace("$userId", userId);

              return (
                <li key={tab.label}>
                  <Link
                    to={tab.to}
                    params={{ userId }}
                    activeOptions={{ exact: true }}
                    className={`block rounded-xl px-3.5 py-2 text-[13px] font-bold transition ${
                      active
                        ? "bg-brand text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Outlet />
      </div>

      {/* New support ticket */}
      <Dialog
        open={ticketOpen}
        onOpenChange={(open) => {
          setTicketOpen(open);
          if (!open) {
            setTicketCategory("general");
            setTicketSubject("");
            setTicketBody("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[26rem]">
          <DialogHeader>
            <DialogTitle>New support ticket</DialogTitle>
            <DialogDescription>
              Open a ticket on behalf of {user.name}. They can follow up in the app.
            </DialogDescription>
          </DialogHeader>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Category
            </span>
            <select
              value={ticketCategory}
              onChange={(e) => setTicketCategory(e.target.value as TicketCategory)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
            >
              {TICKET_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Subject
            </span>
            <input
              value={ticketSubject}
              onChange={(e) => setTicketSubject(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
            />
          </label>
          <textarea
            value={ticketBody}
            onChange={(e) => setTicketBody(e.target.value)}
            rows={4}
            placeholder="Message to support"
            className="w-full rounded-xl border border-border bg-muted/40 p-3 text-[13px] outline-none focus:border-brand"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={ticketBusy}
              onClick={() => setTicketOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-[13px] font-bold transition hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={
                ticketBusy ||
                ticketSubject.trim().length < 3 ||
                ticketBody.trim().length < 4
              }
              onClick={() => {
                if (ticketBusy) return;
                setTicketBusy(true);
                void createAdminSupportTicket({
                  userId: user.id,
                  category: ticketCategory,
                  subject: ticketSubject.trim(),
                  body: ticketBody.trim(),
                })
                  .then((created) => {
                    setTicketOpen(false);
                    setTicketCategory("general");
                    setTicketSubject("");
                    setTicketBody("");
                    toast.success("Support ticket created", {
                      description: created.subject,
                    });
                    void navigate({
                      to: "/support_/$ticketId",
                      params: { ticketId: created.id },
                    });
                  })
                  .catch((err) =>
                    toast.error(err instanceof Error ? err.message : "Could not create ticket"),
                  )
                  .finally(() => setTicketBusy(false));
              }}
              className="rounded-lg bg-brand px-4 py-2 text-[13px] font-bold text-primary-foreground transition disabled:opacity-40"
            >
              {ticketBusy ? "Creating…" : "Create ticket"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Freeze / unfreeze dialog (ADM-033) */}
      <Dialog
        open={freezeOpen}
        onOpenChange={(open) => {
          setFreezeOpen(open);
          if (!open) setReason("");
        }}
      >
        <DialogContent className="sm:max-w-[26rem]">
          <DialogHeader>
            <DialogTitle>{isFrozen ? "Unfreeze account" : "Freeze account"}</DialogTitle>
            <DialogDescription>
              {isFrozen
                ? "Restores funding, investing and withdrawals for this customer."
                : "Blocks funding, investing and withdrawals until the freeze is lifted. A reason is mandatory and recorded in the audit log."}
            </DialogDescription>
          </DialogHeader>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder={isFrozen ? "Optional note for the audit log" : "Reason (required)"}
            className="w-full rounded-xl border border-border bg-muted/40 p-3 text-[13px] outline-none focus:border-brand"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={freezeBusy}
              onClick={() => setFreezeOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-[13px] font-bold transition hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={
                freezeBusy || (freezeRequiresReason && reason.trim().length < 4)
              }
              onClick={() => {
                if (freezeBusy) return;
                const freeze = !isFrozen;
                setFreezeBusy(true);
                void setAdminUserFrozen(
                  user.id,
                  freeze,
                  reason.trim() || undefined,
                )
                  .then(async () => {
                    await hydrateAdminUserFromApi(user.id);
                    setFreezeOpen(false);
                    setReason("");
                    toast.success(freeze ? "Account frozen" : "Account unfrozen", {
                      description: "Recorded in the audit log.",
                    });
                    await router.invalidate();
                  })
                  .catch((err) =>
                    toast.error(err instanceof Error ? err.message : "Could not update freeze"),
                  )
                  .finally(() => setFreezeBusy(false));
              }}
              className="rounded-lg bg-destructive px-4 py-2 text-[13px] font-bold text-white transition disabled:opacity-40"
            >
              {freezeBusy ? "Saving…" : isFrozen ? "Unfreeze" : "Freeze account"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
