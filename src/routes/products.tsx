import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Coins,
  FileStack,
  Layers,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import { compactNaira, naira } from "@/lib/admin-data";
import {
  hydrateAdminProductsFromApi,
  PRODUCT_STATUS_LABEL,
  PRODUCT_STATUS_TONE,
  type AdminProduct,
  type ProductStatus,
} from "@/lib/admin-products-data";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Product management — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Create, publish, open and close Kipit investment products with rates, tenors, minimums and supporting documents.",
      },
      { property: "og:title", content: "Product management — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Admin workspace for Kipit product catalogue, rates and offer documents.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProductListPage,
});

const TABS: ("all" | ProductStatus)[] = ["all", "live", "review", "draft", "closed"];

function ProductListPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [tab, setTab] = useState<"all" | ProductStatus>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void hydrateAdminProductsFromApi().then(setProducts);
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (tab !== "all" && p.status !== tab) return false;
      if (!q) return true;
      return [p.name, p.category, p.issuer].some((f) => f.toLowerCase().includes(q));
    });
  }, [products, tab, query]);

  const productTotals = useMemo(
    () => ({
      live: products.filter((p) => p.status === "live").length,
      review: products.filter((p) => p.status === "review").length,
      draft: products.filter((p) => p.status === "draft").length,
      raised: products.reduce((s, p) => s + p.raised, 0),
      subscribers: products.reduce((s, p) => s + p.subscribers, 0),
    }),
    [products],
  );

  return (
    <AdminShell title="Products" subtitle="ADM-060 · catalogue, rates, tenors and documents">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Open products"
          value={String(productTotals.live)}
          helper={`${productTotals.draft} drafts · ${productTotals.review} in review`}
          tone="brand"
          icon={Layers}
        />
        <Stat
          label="Total raised"
          value={compactNaira(productTotals.raised)}
          helper="Across all products"
          icon={Coins}
        />
        <Stat
          label="Subscribers"
          value={productTotals.subscribers.toLocaleString("en-NG")}
          helper="Active customer positions"
          tone="gold"
          icon={Users}
        />
        <Stat
          label="Awaiting sign-off"
          value={String(productTotals.review)}
          helper="Compliance review before publishing"
          icon={FileStack}
        />
      </div>

      <Panel className="mt-5 overflow-hidden">
        <div className="-m-5">
          <div className="flex flex-wrap items-center gap-3 border-b border-border/70 px-5 py-4">
            <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`rounded-md px-3 py-1.5 text-[12.5px] font-bold transition ${
                    tab === t
                      ? "bg-brand text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "all" ? "All" : PRODUCT_STATUS_LABEL[t]}
                </button>
              ))}
            </div>

            <label className="ml-auto flex min-w-[16rem] items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search product, category or issuer"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
              />
            </label>

            <Link
              to="/products/new"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3 text-[12.5px] font-bold text-primary-foreground transition hover:opacity-90"
            >
              <Plus className="size-4" />
              Create product
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[66rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="px-5 py-2.5">Product</th>
                  <th className="px-5 py-2.5">Category</th>
                  <th className="px-5 py-2.5 text-right">Rate</th>
                  <th className="px-5 py-2.5">Tenor</th>
                  <th className="px-5 py-2.5 text-right">Minimum</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="group border-b border-border/60 transition hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <Link
                        to="/products/$productId"
                        params={{ productId: p.id }}
                        className="block min-w-0"
                      >
                        <span className="block truncate text-[13.5px] font-bold group-hover:text-brand">
                          {p.name}
                        </span>
                        <span className="block truncate text-[12px] text-muted-foreground">
                          {p.issuer} · {p.documents.length} document
                          {p.documents.length === 1 ? "" : "s"}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[13px]">{p.category}</td>
                    <td className="px-5 py-3 text-right text-[13.5px] font-extrabold tabular-nums text-brand">
                      {p.rate.toFixed(2)}%
                    </td>
                    <td className="px-5 py-3 text-[13px]">{p.tenorLabel}</td>
                    <td className="px-5 py-3 text-right text-[13px] tabular-nums">{naira(p.minimum)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${PRODUCT_STATUS_TONE[p.status]}`}
                      >
                        {PRODUCT_STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            navigate({
                              to: "/products/$productId",
                              params: { productId: p.id },
                            })
                          }
                          className="rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-bold transition hover:border-brand/40 hover:text-brand"
                        >
                          Edit
                        </button>
                        {p.status === "closed" ? (
                          <button
                            type="button"
                            onClick={() => {
                              void (async () => {
                                try {
                                  const { updateAdminProduct } = await import("@/lib/admin-api");
                                  const { hydrateAdminProductsFromApi } = await import(
                                    "@/lib/admin-products-data"
                                  );
                                  await updateAdminProduct(p.id, { availability: "OPEN" });
                                  const next = await hydrateAdminProductsFromApi();
                                  setProducts(next);
                                  toast.success(`${p.name} reopened for new placements`);
                                } catch (err) {
                                  toast.error(
                                    err instanceof Error ? err.message : "Could not reopen",
                                  );
                                }
                              })();
                            }}
                            className="rounded-lg bg-brand px-2.5 py-1.5 text-[12px] font-bold text-primary-foreground transition hover:opacity-90"
                          >
                            Open
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              void (async () => {
                                try {
                                  const { updateAdminProduct } = await import("@/lib/admin-api");
                                  const { hydrateAdminProductsFromApi } = await import(
                                    "@/lib/admin-products-data"
                                  );
                                  await updateAdminProduct(p.id, { availability: "CLOSED" });
                                  const next = await hydrateAdminProductsFromApi();
                                  setProducts(next);
                                  toast.success(`${p.name} closed to new placements`);
                                } catch (err) {
                                  toast.error(
                                    err instanceof Error ? err.message : "Could not close",
                                  );
                                }
                              })();
                            }}
                            className="rounded-lg border border-destructive/30 px-2.5 py-1.5 text-[12px] font-bold text-destructive transition hover:bg-destructive/5"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? (
              <p className="px-5 py-14 text-center text-[13px] text-muted-foreground">
                No products match this view.
              </p>
            ) : null}
          </div>
        </div>
      </Panel>
    </AdminShell>
  );
}
