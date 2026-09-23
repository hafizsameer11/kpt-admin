import { useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Coins,
  FileText,
  History,
  Paperclip,
  Percent,
  Replace,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { compactNaira, naira } from "@/lib/admin-data";
import type { AdminProductDetails } from "@/lib/admin-api";
import {
  DOC_KINDS,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUS_LABEL,
  PRODUCT_STATUS_TONE,
  findProduct,
  type ProductDoc,
} from "@/lib/admin-products-data";

export const Route = createFileRoute("/products_/$productId")({
  head: () => ({
    meta: [
      { title: "Product detail — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Edit a Kipit product's rate, tenor and minimum, manage its documents and open or close it to new placements.",
      },
      { property: "og:title", content: "Product detail — Kipit Admin Console" },
      { property: "og:description", content: "Edit rate, tenor, minimum and documents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProductDetailPage,
});

function linesToList(value: string) {
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function faqsFromText(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.includes("|") ? "|" : line.includes("?") ? "?" : null;
      if (sep === "|") {
        const [q, ...rest] = line.split("|");
        return { q: q.trim(), a: rest.join("|").trim() };
      }
      if (sep === "?") {
        const idx = line.indexOf("?");
        return { q: line.slice(0, idx + 1).trim(), a: line.slice(idx + 1).trim() };
      }
      return { q: line, a: "" };
    })
    .filter((f) => f.q && f.a);
}

function docsToDetails(docs: ProductDoc[]): AdminProductDetails["documents"] {
  return docs.map((d) => ({
    name: d.name,
    meta: d.kind + (d.size && d.size !== "—" ? ` · ${d.size}` : ""),
    url: d.url || "",
  }));
}

function ProductDetailPage() {
  const { productId } = useParams({ from: "/products_/$productId" });
  const product = findProduct(productId);

  const [editOpen, setEditOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docKind, setDocKind] = useState<ProductDoc["kind"]>("Term sheet");
  const [savingCms, setSavingCms] = useState(false);

  const [rate, setRate] = useState(product ? String(product.rate) : "");
  const [minimum, setMinimum] = useState(product ? String(product.minimum) : "");
  const [category, setCategory] = useState(product?.category ?? "Fixed Income");
  const [docs, setDocs] = useState<ProductDoc[]>(product?.documents ?? []);
  const [status, setStatus] = useState(product?.status ?? "draft");
  const [about, setAbout] = useState(product?.cms?.about || product?.description || "");
  const [howText, setHowText] = useState((product?.cms?.how ?? []).join("\n"));
  const [risksText, setRisksText] = useState((product?.cms?.risks ?? []).join("\n"));
  const [faqsText, setFaqsText] = useState(
    (product?.cms?.faqs ?? []).map((f) => `${f.q} | ${f.a}`).join("\n"),
  );

  const faqPreview = useMemo(() => faqsFromText(faqsText), [faqsText]);

  if (!product) {
    return (
      <AdminShell title="Product not found">
        <Panel>
          <p className="py-10 text-center text-[13.5px] text-muted-foreground">
            This product no longer exists.{" "}
            <Link to="/products" className="font-bold text-brand">
              Back to products
            </Link>
          </p>
        </Panel>
      </AdminShell>
    );
  }

  const fill = product.capacity ? Math.min(1, product.raised / product.capacity) : 0;

  async function persistDetails(nextDocs: ProductDoc[] = docs) {
    const { updateAdminProduct } = await import("@/lib/admin-api");
    const { hydrateAdminProductsFromApi } = await import("@/lib/admin-products-data");
    await updateAdminProduct(product!.id, {
      description: about.trim() || undefined,
      details: {
        about: about.trim() || undefined,
        how: linesToList(howText),
        risks: linesToList(risksText),
        faqs: faqsFromText(faqsText),
        documents: docsToDetails(nextDocs),
      },
    });
    await hydrateAdminProductsFromApi();
  }

  return (
    <AdminShell title={product.name} subtitle={`ADM-060 · ${product.category} · ${product.issuer}`}>
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-[13px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to products
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-[11.5px] font-bold ring-1 ${PRODUCT_STATUS_TONE[status]}`}
        >
          {PRODUCT_STATUS_LABEL[status]}
        </span>
        <span className="text-[12.5px] text-muted-foreground">
          Last updated {product.updatedAt} by {product.updatedBy}
        </span>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex h-9 items-center rounded-lg bg-brand px-3.5 text-[12.5px] font-bold text-primary-foreground transition hover:opacity-90"
          >
            Edit product
          </button>
          {status === "closed" ? (
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  try {
                    const { updateAdminProduct } = await import("@/lib/admin-api");
                    const { hydrateAdminProductsFromApi } = await import("@/lib/admin-products-data");
                    await updateAdminProduct(product.id, { availability: "OPEN" });
                    await hydrateAdminProductsFromApi();
                    setStatus("live");
                    toast.success(`${product.name} reopened for new placements`);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not reopen");
                  }
                })();
              }}
              className="inline-flex h-9 items-center rounded-lg border border-border px-3.5 text-[12.5px] font-bold transition hover:border-brand/40"
            >
              Open product
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCloseOpen(true)}
              className="inline-flex h-9 items-center rounded-lg border border-destructive/30 px-3.5 text-[12.5px] font-bold text-destructive transition hover:bg-destructive/5"
            >
              Close product
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Rate" value={`${Number(rate || 0).toFixed(2)}%`} helper="Per annum" tone="brand" icon={Percent} />
        <Stat label="Raised" value={compactNaira(product.raised)} helper={`of ${compactNaira(product.capacity)} capacity`} icon={Coins} progress={fill} />
        <Stat label="Subscribers" value={product.subscribers.toLocaleString("en-NG")} helper="Active positions" tone="gold" icon={Users} />
        <Stat label="Minimum" value={naira(Number(minimum || 0))} helper={product.tenorLabel} icon={FileText} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-5">
          <Panel title="Product details">
            <p className="text-[13.5px] leading-relaxed text-muted-foreground">{product.description}</p>
            <dl className="mt-4 grid gap-x-6 sm:grid-cols-2">
              {[
                ["Category", category],
                ["Issuer / backing", product.issuer],
                ["Tenor", product.tenorLabel],
                ["Minimum", naira(Number(minimum || 0))],
                ["Opened", product.openedAt],
                ["Closes", product.closesAt],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4 border-b border-border/60 py-2.5">
                  <dt className="text-[12.5px] text-muted-foreground">{k}</dt>
                  <dd className="text-right text-[13.5px] font-bold">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title="Customer-facing content" eyebrow="Explore CMS">
            <p className="mb-4 text-[12.5px] text-muted-foreground">
              Controls About, how-it-works, risks, FAQs and documents shown on the app product page.
            </p>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  About
                </span>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows={4}
                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  How it works (one step per line)
                </span>
                <textarea
                  value={howText}
                  onChange={(e) => setHowText(e.target.value)}
                  rows={4}
                  placeholder={"Fund from your Kipit wallet.\nRate locks at purchase.\nPayout at maturity."}
                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  Risks (one per line)
                </span>
                <textarea
                  value={risksText}
                  onChange={(e) => setRisksText(e.target.value)}
                  rows={3}
                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  FAQs (Question | Answer per line)
                </span>
                <textarea
                  value={faqsText}
                  onChange={(e) => setFaqsText(e.target.value)}
                  rows={4}
                  placeholder={"When do I get my money back? | At maturity to your wallet."}
                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
                />
                {faqPreview.length > 0 ? (
                  <p className="mt-1.5 text-[12px] text-muted-foreground">{faqPreview.length} FAQ(s) ready</p>
                ) : null}
              </label>
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={savingCms}
                  onClick={() => {
                    void (async () => {
                      setSavingCms(true);
                      try {
                        await persistDetails();
                        toast.success("Customer-facing content saved");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Could not save content");
                      } finally {
                        setSavingCms(false);
                      }
                    })();
                  }}
                  className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-[13px] font-bold text-primary-foreground disabled:opacity-40"
                >
                  {savingCms ? "Saving…" : "Save content"}
                </button>
              </div>
            </div>
          </Panel>

          <Panel
            title="Documents"
            eyebrow="ADM-062"
            icon={Paperclip}
            action={
              <button
                type="button"
                onClick={() => {
                  setReplaceId(null);
                  setDocName("");
                  setDocUrl("");
                  setUploadOpen(true);
                }}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3 text-[12.5px] font-bold text-primary-foreground transition hover:opacity-90"
              >
                <Upload className="size-4" />
                Upload
              </button>
            }
          >
            {docs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-10 text-center">
                <FileText className="mx-auto size-6 text-muted-foreground" />
                <p className="mt-2 text-[13.5px] font-bold">No documents attached</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/70">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 py-3">
                    <span className="grid size-9 place-items-center rounded-lg bg-brand/8 text-brand">
                      <FileText className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-bold">{d.name}</p>
                      <p className="text-[12px] text-muted-foreground">
                        {d.kind} · {d.size}
                        {d.url ? ` · ${d.url}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReplaceId(d.id);
                        setDocName(d.name.replace(/\.pdf$/i, ""));
                        setDocUrl(d.url || "");
                        setDocKind(d.kind);
                        setUploadOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-bold transition hover:border-brand/40 hover:text-brand"
                    >
                      <Replace className="size-3.5" />
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void (async () => {
                          const next = docs.filter((x) => x.id !== d.id);
                          setDocs(next);
                          try {
                            await persistDetails(next);
                            toast.success("Document removed");
                          } catch (err) {
                            setDocs(docs);
                            toast.error(err instanceof Error ? err.message : "Could not remove");
                          }
                        })();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-2.5 py-1.5 text-[12px] font-bold text-destructive transition hover:bg-destructive/5"
                    >
                      <Trash2 className="size-3.5" />
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel title="Change history" icon={History}>
          <ol className="relative space-y-4 pl-5">
            <span className="absolute left-1.5 top-1 h-[calc(100%-0.5rem)] w-px bg-border" />
            {product.history.map((h) => (
              <li key={h.label} className="relative">
                <span className="absolute -left-[1.06rem] top-1.5 size-2 rounded-full bg-brand ring-4 ring-brand/10" />
                <p className="text-[13.5px] font-bold">{h.label}</p>
                <p className="text-[12px] text-muted-foreground">
                  {h.at} · {h.by}
                </p>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {product.name}</DialogTitle>
            <DialogDescription>
              Rate and minimum changes apply to new placements only. Existing holdings keep their
              booked terms.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Category
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Rate (% per annum)
              </span>
              <input
                value={rate}
                onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, ""))}
                inputMode="decimal"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] tabular-nums outline-none focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Minimum investment
              </span>
              <input
                value={minimum ? Number(minimum).toLocaleString("en-NG") : ""}
                onChange={(e) => setMinimum(e.target.value.replace(/[^\d]/g, ""))}
                inputMode="numeric"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] tabular-nums outline-none focus:border-brand"
              />
            </label>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-[13px] font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  try {
                    const { updateAdminProduct } = await import("@/lib/admin-api");
                    const { hydrateAdminProductsFromApi } = await import("@/lib/admin-products-data");
                    await updateAdminProduct(product.id, {
                      ratePct: Number(rate) || undefined,
                      minimum: minimum ? Number(minimum) : undefined,
                    });
                    await hydrateAdminProductsFromApi();
                    setEditOpen(false);
                    toast.success("Product updated · applies to new placements");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Update failed");
                  }
                })();
              }}
              className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-[13px] font-bold text-primary-foreground"
            >
              Save changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Close {product.name}?</DialogTitle>
            <DialogDescription>
              The product is hidden from new placements. Existing holdings continue running to
              maturity.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setCloseOpen(false)}
              className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-[13px] font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  try {
                    const { updateAdminProduct } = await import("@/lib/admin-api");
                    const { hydrateAdminProductsFromApi } = await import("@/lib/admin-products-data");
                    await updateAdminProduct(product.id, { availability: "CLOSED" });
                    await hydrateAdminProductsFromApi();
                    setStatus("closed");
                    setCloseOpen(false);
                    toast.success(`${product.name} closed to new placements`);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not close product");
                  }
                })();
              }}
              className="inline-flex h-10 items-center rounded-lg bg-destructive px-4 text-[13px] font-bold text-destructive-foreground"
            >
              Close product
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{replaceId ? "Replace document" : "Add document"}</DialogTitle>
            <DialogDescription>
              Name the file and optionally paste a public PDF URL customers can open in the app.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                File name
              </span>
              <input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="term-sheet-v2"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                Document type
              </span>
              <select
                value={docKind}
                onChange={(e) => setDocKind(e.target.value as ProductDoc["kind"])}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
              >
                {DOC_KINDS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                PDF URL (optional)
              </span>
              <input
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
              />
            </label>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setUploadOpen(false)}
              className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-[13px] font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!docName.trim()}
              onClick={() => {
                void (async () => {
                  const entry: ProductDoc = {
                    id: replaceId ?? `new-${Date.now()}`,
                    name: docName.trim().endsWith(".pdf") ? docName.trim() : `${docName.trim()}.pdf`,
                    kind: docKind,
                    size: "—",
                    uploadedAt: "Just now",
                    uploadedBy: "You",
                    url: docUrl.trim() || undefined,
                  };
                  const next = replaceId
                    ? docs.map((d) => (d.id === replaceId ? entry : d))
                    : [...docs, entry];
                  setDocs(next);
                  try {
                    await persistDetails(next);
                    toast.success(replaceId ? "Document replaced" : "Document attached");
                    setUploadOpen(false);
                    setReplaceId(null);
                    setDocName("");
                    setDocUrl("");
                  } catch (err) {
                    setDocs(docs);
                    toast.error(err instanceof Error ? err.message : "Could not save document");
                  }
                })();
              }}
              className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-[13px] font-bold text-primary-foreground disabled:opacity-40"
            >
              {replaceId ? "Replace" : "Attach"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
