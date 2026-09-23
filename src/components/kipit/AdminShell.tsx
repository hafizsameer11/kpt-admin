import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ArrowLeftRight,
  Banknote,
  Package,
  Percent,
  SlidersHorizontal,
  Scale,
  Megaphone,
  LifeBuoy,
  MessageSquare,
  UserCog,
  KeyRound,
  ScrollText,
  Bell,
  FileSpreadsheet,
  LineChart,
  Search,
  Settings,
  UserCircle,
  LockKeyhole,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import {
  ADMIN_IDLE_MINUTES,
  endAdminSession,
  getAdminSession,
  lockAdminSession,
  type AdminSession,
} from "@/lib/admin-auth";


type Item = { label: string; to: string; icon: LucideIcon; soon?: boolean };
type Group = { heading: string; items: Item[] };

/** Admin console navigation, mapped to the ADM-0xx sections in the UX spec. */
const GROUPS: Group[] = [
  {
    heading: "Overview",
    items: [{ label: "Executive dashboard", to: "/", icon: LayoutDashboard }],
  },
  {
    heading: "Operations",
    items: [
      { label: "Users", to: "/users", icon: Users },
      { label: "Signup drop-offs", to: "/users/dropoffs", icon: Users },
      { label: "Compliance & KYC", to: "/compliance", icon: ShieldCheck },
      { label: "Transactions", to: "/transactions", icon: ArrowLeftRight },
      { label: "Withdrawals", to: "/withdrawals", icon: Banknote },
      { label: "Reconciliation", to: "/reconciliation", icon: Scale },
    ],
  },
  {
    heading: "Products & rates",
    items: [
      { label: "Products", to: "/products", icon: Package },
      { label: "Rate management", to: "/rates", icon: Percent },
      { label: "Plan adjustments", to: "/adjustments", icon: SlidersHorizontal },
    ],
  },
  {
    heading: "Growth & care",
    items: [
      { label: "Marketing", to: "/marketing", icon: Megaphone },
      { label: "Support", to: "/support", icon: LifeBuoy },
      { label: "Ask AI log", to: "/ai-chat", icon: MessageSquare },
    ],
  },
  {
    heading: "Insights",
    items: [
      { label: "Reports & analytics", to: "/analytics", icon: LineChart },
      { label: "Reports centre", to: "/reports", icon: FileSpreadsheet },
    ],
  },
  {
    heading: "Console",
    items: [
      { label: "Admin users", to: "/team", icon: UserCog },
      { label: "Roles & permissions", to: "/team/roles", icon: KeyRound },
      { label: "Audit log", to: "/audit", icon: ScrollText },
      { label: "Notifications", to: "/notifications", icon: Bell },
      { label: "System settings", to: "/settings", icon: Settings },
      { label: "My profile", to: "/profile", icon: UserCircle },
    ],
  },

];

/**
 * Administration console shell — a separate operational surface from the
 * consumer app: persistent brand sidebar, operator top bar, dense content.
 */
export function AdminShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [session, setSession] = useState<AdminSession | null>(null);

  /** ADM-001/003 — no session means back to sign in; a locked session goes to the lock screen. */
  useEffect(() => {
    const current = getAdminSession();
    setSession(current);
    if (!current) navigate({ to: "/login", replace: true });
    else if (current.locked) navigate({ to: "/locked", replace: true });
  }, [navigate, pathname]);

  /** ADM-003 — auto-lock after a period of inactivity. */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(
        () => {
          lockAdminSession();
          navigate({ to: "/locked", replace: true });
        },
        ADMIN_IDLE_MINUTES * 60 * 1000,
      );
    };
    const events = ["mousemove", "keydown", "click", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [navigate]);

  const initials = (session?.name ?? "Seyi Adeleke")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();



  return (
    <div className="min-h-screen bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[16.5rem] flex-col bg-brand-gradient text-primary-foreground lg:flex">
        <div className="flex h-16 items-center gap-2 px-6">
          <Logo tone="light" className="text-xl" />
          <span className="rounded-md bg-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gold">
            Admin
          </span>
        </div>

        <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-6">
          {GROUPS.map((group) => (
            <div key={group.heading} className="mt-5 first:mt-1">
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-primary-foreground/40">
                {group.heading}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active =
                    !item.soon &&
                    (pathname === item.to ||
                      (item.to !== "/" && pathname.startsWith(`${item.to}/`)));

                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <Link
                        to={item.to}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
                          active
                            ? "bg-white/12 text-primary-foreground"
                            : "text-primary-foreground/60 hover:bg-white/8 hover:text-primary-foreground"
                        }`}
                      >
                        <Icon
                          className={`size-4 ${active ? "text-gold" : "text-primary-foreground/50"}`}
                          strokeWidth={active ? 2.3 : 1.9}
                        />
                        <span className="truncate">{item.label}</span>
                        {item.soon ? (
                          <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-primary-foreground/35">
                            Soon
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/8 p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold text-[12px] font-extrabold text-gold-foreground">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold">{session?.name ?? "Seyi Adeleke"}</p>
              <p className="truncate text-[11px] text-primary-foreground/55">
                {session?.role ?? "Global Admin"}
              </p>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                lockAdminSession();
                navigate({ to: "/locked" });
              }}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-white/15 px-2 py-2 text-[11px] font-semibold text-primary-foreground/75 transition hover:bg-white/10"
            >
              <LockKeyhole className="size-3.5" /> Lock
            </button>
            <button
              type="button"
              onClick={() => {
                void endAdminSession().then(() => {
                  navigate({ to: "/login", replace: true });
                });
              }}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-white/15 px-2 py-2 text-[11px] font-semibold text-primary-foreground/75 transition hover:bg-white/10"
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
          </div>

        </div>
      </aside>

      <div className="lg:pl-[16.5rem]">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-4 px-4 md:px-8">
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-[19px] font-extrabold tracking-[-0.02em]">
                {title}
              </h1>
              {subtitle ? (
                <p className="truncate text-[12px] text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = new FormData(e.currentTarget).get("q");
                navigate({ to: "/search", search: { q: String(q ?? "") } });
              }}
              className="hidden items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 md:flex"
            >
              <Search className="size-4 text-muted-foreground" />
              <input
                name="q"
                placeholder="Search users, references…"
                className="w-56 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
              />
            </form>

            <Link
              to="/notifications"
              aria-label="Notifications"
              className="relative grid size-10 place-items-center rounded-lg border border-border bg-card text-foreground transition hover:bg-muted"
            >
              <Bell className="size-4" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-gold" />
            </Link>

          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
