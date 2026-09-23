import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Search, SearchX } from "lucide-react";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel } from "@/components/kipit/AdminBits";
import { globalSearch, SEARCH_SUGGESTIONS, type SearchGroup } from "@/lib/admin-console-data";

export const Route = createFileRoute("/search")({
  validateSearch: z.object({ q: z.string().catch("") }),
  head: () => ({
    meta: [
      { title: "Search — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Search customers, transactions, withdrawals, products, console users and admin pages across the Kipit console.",
      },
      { property: "og:title", content: "Search — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Global search across every Kipit console record and page.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GlobalSearchPage,
});

const GROUP_ORDER: SearchGroup[] = [
  "Customers",
  "Transactions",
  "Withdrawals",
  "Products",
  "Console users",
  "Admin pages",
];

function GlobalSearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [term, setTerm] = useState(q);

  const results = globalSearch(q);
  const groups = GROUP_ORDER.map(
    (g) => [g, results.filter((r) => r.group === g)] as const,
  ).filter(([, list]) => list.length > 0);

  const submit = (value: string) =>
    navigate({ to: "/search", search: { q: value } });

  return (
    <AdminShell
      title="Search"
      subtitle={q ? `${results.length} results for “${q}”` : "Customers, records and pages"}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(term);
        }}
        className="flex flex-wrap items-center gap-3"
      >
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search a name, email, reference, product or page…"
            className="w-full bg-transparent text-[14px] font-semibold outline-none"
          />
        </label>
        <button
          type="submit"
          className="rounded-xl bg-brand px-5 py-3 text-[13.5px] font-bold text-primary-foreground transition hover:opacity-90"
        >
          Search
        </button>
      </form>

      {SEARCH_SUGGESTIONS.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[12px] font-semibold text-muted-foreground">Try:</span>
          {SEARCH_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setTerm(s);
                submit(s);
              }}
              className="rounded-full border border-border bg-card px-3 py-1 text-[12px] font-bold text-muted-foreground transition hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-5 space-y-5">
        {q && groups.length === 0 ? (
          <Panel>
            <div className="grid place-items-center py-14 text-center">
              <SearchX className="size-8 text-muted-foreground" />
              <p className="mt-3 font-display text-[16px] font-extrabold">No matches</p>
              <p className="text-[13px] text-muted-foreground">
                Nothing matched “{q}”. Try a customer name, an email, or a reference like WDL-40912.
              </p>
            </div>
          </Panel>
        ) : null}

        {groups.map(([group, list]) => (
          <Panel key={group} title={group} eyebrow={`${list.length} result${list.length > 1 ? "s" : ""}`}>
            <ul className="divide-y divide-border/60">
              {list.map((r) => (
                <li key={r.id}>
                  <Link
                    to={r.to}
                    params={r.params as never}
                    className="flex items-center gap-3 py-3 transition first:pt-0 last:pb-0 hover:opacity-80"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-bold">{r.title}</p>
                      <p className="truncate text-[12.5px] text-muted-foreground">{r.subtitle}</p>
                    </div>
                    {r.meta ? (
                      <span className="shrink-0 text-[12.5px] font-bold text-muted-foreground">
                        {r.meta}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </AdminShell>
  );
}
