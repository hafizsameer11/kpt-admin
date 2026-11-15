import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import {
  AdminApiError,
  createAdminLegalDocument,
  fetchAdminLegalDocuments,
  patchAdminLegalDocument,
  type AdminLegalDocument,
} from "@/lib/admin-api";

export const Route = createFileRoute("/settings_/legal-documents")({
  head: () => ({
    meta: [
      { title: "Legal documents — Kipit Admin Console" },
      {
        name: "description",
        content: "Publish and version Kipit Terms, Privacy, Risk Disclosure and Product Terms.",
      },
      { property: "og:title", content: "Legal documents — Kipit Admin Console" },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LegalDocumentsPage,
});

const DOC_KEYS = [
  { value: "terms", label: "Terms & Conditions" },
  { value: "privacy", label: "Privacy Policy" },
  { value: "risk_disclosure", label: "Risk Disclosure" },
  { value: "product_terms_lock", label: "Product Terms — Lock" },
  { value: "product_terms_flex", label: "Product Terms — Flex" },
] as const;

function formatWhen(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function LegalDocumentsPage() {
  const [rows, setRows] = useState<AdminLegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [docKey, setDocKey] = useState<(typeof DOC_KEYS)[number]["value"]>("terms");
  const [title, setTitle] = useState("Terms & Conditions");
  const [version, setVersion] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [publish, setPublish] = useState(true);

  const reload = useCallback(async () => {
    const data = await fetchAdminLegalDocuments();
    setRows(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    void reload()
      .catch((err) =>
        toast.error(err instanceof AdminApiError ? err.message : "Could not load legal documents"),
      )
      .finally(() => setLoading(false));
  }, [reload]);

  useEffect(() => {
    const match = DOC_KEYS.find((d) => d.value === docKey);
    if (match) setTitle(match.label.replace(" — Lock", " — Kipit Lock").replace(" — Flex", " — Kipit Flex"));
  }, [docKey]);

  const publishedCount = rows.filter((r) => r.published).length;

  async function onCreate() {
    if (busy) return;
    if (!version.trim() || !title.trim()) {
      toast.error("Title and version are required");
      return;
    }
    setBusy(true);
    try {
      await createAdminLegalDocument({
        docKey,
        title: title.trim(),
        version: version.trim(),
        fileUrl: fileUrl.trim() || null,
        publish,
      });
      setVersion("");
      setFileUrl("");
      await reload();
      toast.success("Legal document created");
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Could not create document");
    } finally {
      setBusy(false);
    }
  }

  async function onTogglePublish(row: AdminLegalDocument) {
    try {
      await patchAdminLegalDocument(row.id, { publish: !row.published });
      await reload();
      toast.success(`${row.title} ${row.published ? "unpublished" : "published"}`);
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Could not update document");
    }
  }

  return (
    <AdminShell
      title="Legal documents"
      subtitle="Version and publish Terms, Privacy, Risk Disclosure and Product Terms for the client app."
    >
      <div className="mb-4">
        <Link
          to="/settings"
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> System settings
        </Link>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Stat label="Documents" value={String(rows.length)} />
        <Stat label="Published" value={String(publishedCount)} />
        <Stat label="Doc keys" value={String(DOC_KEYS.length)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Panel title="Create version" icon={Plus}>
          <div className="space-y-3 p-4">
            <label className="block text-[12px]">
              <span className="font-semibold text-muted-foreground">Document key</span>
              <select
                value={docKey}
                onChange={(e) => setDocKey(e.target.value as typeof docKey)}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px]"
              >
                {DOC_KEYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[12px]">
              <span className="font-semibold text-muted-foreground">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px]"
              />
            </label>
            <label className="block text-[12px]">
              <span className="font-semibold text-muted-foreground">Version</span>
              <input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="2026.11"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px]"
              />
            </label>
            <label className="block text-[12px]">
              <span className="font-semibold text-muted-foreground">File URL (optional)</span>
              <input
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://…"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px]"
              />
            </label>
            <label className="flex items-center gap-2 text-[12.5px]">
              <input
                type="checkbox"
                checked={publish}
                onChange={(e) => setPublish(e.target.checked)}
              />
              Publish immediately
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onCreate()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-[13px] font-bold text-brand-foreground disabled:opacity-40"
            >
              <Plus className="size-4" /> {busy ? "Saving…" : "Create document"}
            </button>
          </div>
        </Panel>

        <Panel title="All versions" icon={FileText}>
          {loading ? (
            <p className="p-4 text-[13px] text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="p-4 text-[13px] text-muted-foreground">No legal documents yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[12.5px]">
                <thead className="border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Title</th>
                    <th className="px-4 py-2.5 font-semibold">Key</th>
                    <th className="px-4 py-2.5 font-semibold">Version</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold">Published</th>
                    <th className="px-4 py-2.5 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="px-4 py-3 font-semibold">{row.title}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.docKey}</td>
                      <td className="px-4 py-3">{row.version}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                            row.published
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {row.published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatWhen(row.publishedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => void onTogglePublish(row)}
                          className="rounded-lg border border-border px-2.5 py-1 text-[11.5px] font-bold press hover:bg-secondary"
                        >
                          {row.published ? "Unpublish" : "Publish"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </AdminShell>
  );
}
