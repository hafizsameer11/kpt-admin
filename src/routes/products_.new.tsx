import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  FileText,
  Paperclip,
  Replace,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel } from "@/components/kipit/AdminBits";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { naira } from "@/lib/admin-data";
import { DOC_KINDS, PRODUCT_CATEGORIES, type ProductDoc } from "@/lib/admin-products-data";

export const Route = createFileRoute("/products_/new")({
  head: () => ({
    meta: [
      { title: "Create product — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Capture product details, attach offer documents and review everything before publishing a new Kipit investment product.",
      },
      { property: "og:title", content: "Create product — Kipit Admin Console" },
      {
        property: "og:description",
        content: "Three-step product creation with documents and pre-publish review.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CreateProductPage,
});

const STEPS = [
  { id: 1, label: "Product details", code: "ADM-061" },
  { id: 2, label: "Documents", code: "ADM-062" },
  { id: 3, label: "Review", code: "ADM-063" },
];

function digits(v: string) {
  return v.replace(/[^\d]/g, "");
}

function CreateProductPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Fixed Income");
  const [issuer, setIssuer] = useState("");
  const [description, setDescription] = useState("");
  const [about, setAbout] = useState("");
  const [howText, setHowText] = useState("");
  const [risksText, setRisksText] = useState("");
  const [faqsText, setFaqsText] = useState("");
  const [rate, setRate] = useState("");
  const [tenor, setTenor] = useState("");
  const [minimum, setMinimum] = useState("");

  const [docs, setDocs] = useState<ProductDoc[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [docName, setDocName] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [docKind, setDocKind] = useState<ProductDoc["kind"]>("Term sheet");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const detailsValid =
    name.trim().length > 2 &&
    issuer.trim().length > 1 &&
    description.trim().length > 10 &&
    Number(rate) > 0 &&
    Number(digits(tenor)) > 0 &&
    Number(digits(minimum)) > 0;

  const minimumLabel = useMemo(
    () => (digits(minimum) ? naira(Number(digits(minimum))) : "—"),
    [minimum],
  );

  function saveDoc() {
    if (!docName.trim()) return;
    const entry: ProductDoc = {
      id: replaceId ?? `new-${Date.now()}`,
      name: docName.trim().endsWith(".pdf") ? docName.trim() : `${docName.trim()}.pdf`,
      kind: docKind,
      size: "—",
      uploadedAt: "Just now",
      uploadedBy: "You",
      url: docUrl.trim() || undefined,
    };
    setDocs((prev) =>
      replaceId ? prev.map((d) => (d.id === replaceId ? entry : d)) : [...prev, entry],
    );
    toast.success(replaceId ? "Document replaced" : "Document attached");
    setUploadOpen(false);
    setReplaceId(null);
    setDocName("");
    setDocUrl("");
  }

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
        if (line.includes("|")) {
          const [q, ...rest] = line.split("|");
          return { q: q.trim(), a: rest.join("|").trim() };
        }
        const idx = line.indexOf("?");
        if (idx >= 0) {
          return { q: line.slice(0, idx + 1).trim(), a: line.slice(idx + 1).trim() };
        }
        return { q: line, a: "" };
      })
      .filter((f) => f.q && f.a);
  }

  return (
    <AdminShell title="Create product" subtitle="ADM-061 – ADM-063 · details, documents, review">
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-[13px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to products
      </Link>

      <ol className="mt-4 flex flex-wrap items-center gap-3">
        {STEPS.map((s) => {
          const done = step > s.id;
          const active = step === s.id;
          return (
            <li key={s.id} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => (s.id < step ? setStep(s.id) : undefined)}
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 text-left transition ${
                  active
                    ? "border-brand/40 bg-brand/8"
                    : done
                      ? "border-emerald-500/30 bg-emerald-500/8"
                      : "border-border/80 bg-card"
                }`}
              >
                <span
                  className={`grid size-6 place-items-center rounded-full text-[11px] font-extrabold ${
                    done
                      ? "bg-emerald-600 text-white"
                      : active
                        ? "bg-brand text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="size-3.5" /> : s.id}
                </span>
                <span>
                  <span className="block text-[13px] font-bold">{s.label}</span>
                  <span className="block text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {s.code}
                  </span>
                </span>
              </button>
              {s.id !== 3 ? <span className="h-px w-6 bg-border" /> : null}
            </li>
          );
        })}
      </ol>

      {step === 1 ? (
        <Panel title="Product details" eyebrow="ADM-061" className="mt-5 max-w-4xl">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Product name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kipit Fixed 120"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
              />
            </Field>
            <Field label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Issuer / backing" className="md:col-span-2">
              <input
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="e.g. Federal Government of Nigeria"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
              />
            </Field>
            <Field label="Description" className="md:col-span-2">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="How the product works, who it suits and how interest is paid."
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
              />
            </Field>
            <Field label="About (app product page)" className="md:col-span-2">
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows={3}
                placeholder="Customer-facing about copy. Defaults to description if blank."
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
              />
            </Field>
            <Field label="How it works (one step per line)" className="md:col-span-2">
              <textarea
                value={howText}
                onChange={(e) => setHowText(e.target.value)}
                rows={3}
                placeholder={"Fund from wallet.\nRate locks at purchase.\nPayout at maturity."}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
              />
            </Field>
            <Field label="Risks (one per line)" className="md:col-span-2">
              <textarea
                value={risksText}
                onChange={(e) => setRisksText(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
              />
            </Field>
            <Field label="FAQs (Question | Answer per line)" className="md:col-span-2">
              <textarea
                value={faqsText}
                onChange={(e) => setFaqsText(e.target.value)}
                rows={3}
                placeholder={"When do I get paid? | At maturity to your wallet."}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
              />
            </Field>
            <Field label="Rate (% per annum)">
              <input
                value={rate}
                onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, ""))}
                inputMode="decimal"
                placeholder="18.25"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] tabular-nums outline-none focus:border-brand"
              />
            </Field>
            <Field label="Tenor (days)">
              <input
                value={tenor}
                onChange={(e) => setTenor(digits(e.target.value))}
                inputMode="numeric"
                placeholder="90"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] tabular-nums outline-none focus:border-brand"
              />
            </Field>
            <Field label="Minimum investment" helper={minimumLabel}>
              <input
                value={digits(minimum) ? Number(digits(minimum)).toLocaleString("en-NG") : ""}
                onChange={(e) => setMinimum(digits(e.target.value))}
                inputMode="numeric"
                placeholder="50,000"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] tabular-nums outline-none focus:border-brand"
              />
            </Field>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              disabled={!detailsValid}
              onClick={() => setStep(2)}
              className="inline-flex h-10 items-center rounded-lg bg-brand px-5 text-[13px] font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              Continue to documents
            </button>
          </div>
        </Panel>
      ) : null}

      {step === 2 ? (
        <Panel
          title="Supporting documents"
          eyebrow="ADM-062"
          icon={Paperclip}
          className="mt-5 max-w-4xl"
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
            <div className="rounded-xl border border-dashed border-border py-12 text-center">
              <FileText className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-2 text-[13.5px] font-bold">No documents attached</p>
              <p className="text-[12.5px] text-muted-foreground">
                Attach the term sheet, offer document or risk disclosure customers will see.
              </p>
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
                      {d.kind} · {d.uploadedAt} · {d.uploadedBy}
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
                      setDocs((prev) => prev.filter((x) => x.id !== d.id));
                      toast.success("Document removed");
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

          <div className="mt-5 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-[13px] font-bold transition hover:border-brand/40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex h-10 items-center rounded-lg bg-brand px-5 text-[13px] font-bold text-primary-foreground transition hover:opacity-90"
            >
              Continue to review
            </button>
          </div>
        </Panel>
      ) : null}

      {step === 3 ? (
        <div className="mt-5 grid max-w-5xl gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Panel title="Review product" eyebrow="ADM-063">
            <dl className="divide-y divide-border/70">
              <Row label="Product name" value={name} />
              <Row label="Category" value={category} />
              <Row label="Issuer / backing" value={issuer} />
              <Row label="Rate" value={`${rate || "0"}% per annum`} />
              <Row label="Tenor" value={`${digits(tenor) || "0"} days`} />
              <Row label="Minimum" value={minimumLabel} />
              <Row label="Documents" value={`${docs.length} attached`} />
            </dl>
            <p className="mt-4 rounded-xl bg-muted/50 p-3 text-[13px] leading-relaxed text-muted-foreground">
              {description || "No description provided."}
            </p>
          </Panel>

          <Panel title="Before you publish">
            <ul className="space-y-2.5 text-[13px]">
              {[
                "Rate and tenor apply to new placements only.",
                "Customers see the description and documents on the product page.",
                "Publishing is recorded in the audit log against your admin account.",
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span className="text-muted-foreground">{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-brand text-[13px] font-bold text-primary-foreground transition hover:opacity-90"
              >
                Publish product
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border text-[13px] font-bold transition hover:border-brand/40"
              >
                Back
              </button>
            </div>
          </Panel>
        </div>
      ) : null}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{replaceId ? "Replace document" : "Upload document"}</DialogTitle>
            <DialogDescription>
              Prototype upload — name the file and choose what kind of document it is.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="File name">
              <input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="term-sheet-v1"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
              />
            </Field>
            <Field label="Document type">
              <select
                value={docKind}
                onChange={(e) => setDocKind(e.target.value as ProductDoc["kind"])}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
              >
                {DOC_KINDS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </Field>
            <Field label="PDF URL (optional)">
              <input
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand"
              />
            </Field>
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
              onClick={saveDoc}
              className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-[13px] font-bold text-primary-foreground disabled:opacity-40"
            >
              {replaceId ? "Replace" : "Attach"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publish {name || "product"}?</DialogTitle>
            <DialogDescription>
              The product becomes visible to customers immediately and opens for new placements.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-[13px] font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmOpen(false);
                void (async () => {
                  try {
                    const { createAdminProduct } = await import("@/lib/admin-api");
                    const { hydrateAdminProductsFromApi } = await import("@/lib/admin-products-data");
                    const created = await createAdminProduct({
                      name: name.trim(),
                      categoryName: category,
                      description: description.trim(),
                      blurb: description.trim().slice(0, 140) || name.trim(),
                      ratePct: Number(rate),
                      tenorDays: Number(digits(tenor)),
                      minimum: Number(digits(minimum)),
                      issuer: issuer.trim() || undefined,
                      availability: "OPEN",
                      details: {
                        about: (about.trim() || description.trim()) || undefined,
                        how: linesToList(howText),
                        risks: linesToList(risksText),
                        faqs: faqsFromText(faqsText),
                        documents: docs.map((d) => ({
                          name: d.name,
                          meta: d.kind,
                          url: d.url || "",
                        })),
                      },
                    });
                    await hydrateAdminProductsFromApi();
                    toast.success(`${created.name} published`);
                    navigate({
                      to: "/products/published",
                      search: {
                        name: created.name,
                        rate: String(created.ratePct),
                        tenor: String(created.tenorDays),
                      },
                    });
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not publish product");
                  }
                })();
              }}
              className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-[13px] font-bold text-primary-foreground"
            >
              Publish product
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function Field({
  label,
  helper,
  children,
  className = "",
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
        {helper ? <span className="normal-case tracking-normal">{helper}</span> : null}
      </span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-[12.5px] text-muted-foreground">{label}</dt>
      <dd className="text-right text-[13.5px] font-bold">{value || "—"}</dd>
    </div>
  );
}
