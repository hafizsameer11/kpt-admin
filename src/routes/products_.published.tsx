import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Layers, Plus } from "lucide-react";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel } from "@/components/kipit/AdminBits";

type PublishedSearch = { name?: string | undefined; rate?: string | undefined; tenor?: string | undefined };

export const Route = createFileRoute("/products_/published")({
  validateSearch: (search: Record<string, unknown>): PublishedSearch => {
    const str = (v: unknown) =>
      typeof v === "string" ? v : typeof v === "number" ? String(v) : undefined;
    return { name: str(search['name']), rate: str(search['rate']), tenor: str(search['tenor']) };
  },
  head: () => ({
    meta: [
      { title: "Product published — Kipit Admin Console" },
      {
        name: "description",
        content: "Confirmation that a new Kipit investment product is live and open for placements.",
      },
      { property: "og:title", content: "Product published — Kipit Admin Console" },
      { property: "og:description", content: "New Kipit product is live for customers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProductPublishedPage,
});

function ProductPublishedPage() {
  const { name, rate, tenor } = Route.useSearch();

  return (
    <AdminShell title="Product published" subtitle="ADM-064 · confirmation">
      <div className="mx-auto max-w-2xl">
        <Panel className="text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-500/12 text-emerald-600">
            <CheckCircle2 className="size-7" />
          </span>
          <h2 className="mt-4 font-display text-[22px] font-extrabold tracking-[-0.02em]">
            {name ?? "Product"} is live
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-[13.5px] text-muted-foreground">
            Customers can now see and subscribe to this product. The change is recorded in the audit
            log against your admin account.
          </p>

          <dl className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { k: "Rate", v: `${rate ?? "0"}%` },
              { k: "Tenor", v: `${tenor ?? "0"} days` },
              { k: "Status", v: "Open" },
            ].map((i) => (
              <div key={i.k} className="rounded-xl border border-border/80 bg-muted/30 p-3">
                <dt className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  {i.k}
                </dt>
                <dd className="mt-1 font-display text-[17px] font-extrabold">{i.v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/products"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-5 text-[13px] font-bold text-primary-foreground transition hover:opacity-90"
            >
              <Layers className="size-4" />
              Back to products
            </Link>
            <Link
              to="/products/new"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-5 text-[13px] font-bold transition hover:border-brand/40"
            >
              <Plus className="size-4" />
              Create another
            </Link>
          </div>
        </Panel>
      </div>
    </AdminShell>
  );
}
