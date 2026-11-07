import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, ExternalLink, FileText, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Panel } from "@/components/kipit/AdminBits";
import { findUser, hydrateAdminUserFromApi } from "@/lib/admin-users-data";
import {
  AdminApiError,
  activateAdminUserKyc,
  fetchAdminUser,
  uploadAdminUserKycDocument,
} from "@/lib/admin-api";
import { isSuperAdminSession } from "@/lib/admin-super";

export const Route = createFileRoute("/users_/$userId/kyc")({
  component: Kyc,
});

type DocRow = {
  label: string;
  value: string;
  url?: string | null;
  state: "passed" | "pending" | "failed";
};

const ICONS = {
  passed: { Icon: CheckCircle2, cls: "text-emerald-600" },
  pending: { Icon: Clock, cls: "text-gold-foreground" },
  failed: { Icon: XCircle, cls: "text-destructive" },
} as const;

async function fileToBase64(file: File) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function Kyc() {
  const { userId } = Route.useParams();
  const superAdmin = isSuperAdminSession();
  const [user, setUser] = useState(findUser(userId));
  const [checks, setChecks] = useState<DocRow[]>([]);
  const [docs, setDocs] = useState<{
    selfieUrl: string | null;
    addressDocUrl: string | null;
    address: string;
    bvn: string;
    nin: string;
  }>({
    selfieUrl: null,
    addressDocUrl: null,
    address: "—",
    bvn: "—",
    nin: "—",
  });
  const [activateTier, setActivateTier] = useState<"TIER_1" | "TIER_2">("TIER_1");
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"selfie" | "address" | null>(null);

  const reload = async () => {
    const u = await hydrateAdminUserFromApi(userId);
    if (u) setUser(u);
    try {
      const row = await fetchAdminUser(userId);
      const kyc = row.kyc as {
        status?: string;
        profile?: {
          bvnName?: string | null;
          ninName?: string | null;
          bvnProviderStatus?: string | null;
          ninProviderStatus?: string | null;
          hasSelfie?: boolean;
          hasAddressDoc?: boolean;
        };
      } | null;
      const d = row.kycDocuments;
      const address = [d?.addressStreet, d?.addressCity, d?.addressState, d?.addressLga]
        .filter(Boolean)
        .join(", ");
      setDocs({
        selfieUrl: d?.selfieUrl ?? null,
        addressDocUrl: d?.addressDocUrl ?? null,
        address: address || "—",
        bvn: d?.bvn?.trim() || "—",
        nin: d?.nin?.trim() || "—",
      });
      const mapStatus = (s?: string | null): DocRow["state"] => {
        if (s === "SUCCESS") return "passed";
        if (s === "FAILED") return "failed";
        return "pending";
      };
      const bvnNumber = d?.bvn?.trim() || "";
      const ninNumber = d?.nin?.trim() || "";
      const bvnName = d?.bvnName || kyc?.profile?.bvnName || "";
      const ninName = d?.ninName || kyc?.profile?.ninName || "";
      setChecks([
        {
          label: "BVN",
          value: bvnNumber
            ? `${bvnNumber}${bvnName ? ` · ${bvnName}` : ""}`
            : bvnName || kyc?.profile?.bvnProviderStatus || "—",
          state: mapStatus(d?.bvnProviderStatus || kyc?.profile?.bvnProviderStatus),
        },
        {
          label: "NIN",
          value: ninNumber
            ? `${ninNumber}${ninName ? ` · ${ninName}` : ""}`
            : ninName || kyc?.profile?.ninProviderStatus || "—",
          state: mapStatus(d?.ninProviderStatus || kyc?.profile?.ninProviderStatus),
        },
        {
          label: "Selfie on file",
          value: d?.selfieUrl || kyc?.profile?.hasSelfie ? "Available for viewing" : "Not uploaded",
          url: d?.selfieUrl,
          state: d?.selfieUrl || kyc?.profile?.hasSelfie ? "passed" : "pending",
        },
        {
          label: "Proof of address",
          value:
            d?.addressDocUrl || kyc?.profile?.hasAddressDoc
              ? "Available for viewing"
              : "Not uploaded",
          url: d?.addressDocUrl,
          state: d?.addressDocUrl || kyc?.profile?.hasAddressDoc ? "passed" : "pending",
        },
        {
          label: "KYC status",
          value: kyc?.status || "—",
          state:
            kyc?.status === "APPROVED"
              ? "passed"
              : kyc?.status === "REJECTED"
                ? "failed"
                : "pending",
        },
      ]);
    } catch {
      setChecks([]);
    }
  };

  useEffect(() => {
    void reload();
  }, [userId]);

  const onUpload = async (kind: "selfie" | "address", file: File | null) => {
    if (!file || !superAdmin) return;
    setUploading(kind);
    try {
      const dataBase64 = await fileToBase64(file);
      const result = await uploadAdminUserKycDocument(userId, {
        kind,
        contentType: file.type || "image/jpeg",
        dataBase64,
      });
      toast.success(`${kind === "selfie" ? "Selfie" : "Address proof"} uploaded`);
      setDocs((prev) => ({
        ...prev,
        selfieUrl: result.selfieUrl,
        addressDocUrl: result.addressDocUrl,
      }));
      await reload();
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const onActivate = async () => {
    if (!superAdmin || busy) return;
    setBusy(true);
    try {
      await activateAdminUserKyc(userId, {
        kycTier: activateTier,
        bvn: bvn.trim() || undefined,
        nin: nin.trim() || undefined,
        unfreeze: true,
      });
      toast.success(`Profile activated at ${activateTier.replace("_", " ")}`);
      await reload();
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Could not activate profile");
    } finally {
      setBusy(false);
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand";
  const labelClass =
    "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground";

  if (!user) {
    return <p className="text-[13px] text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Verification checks">
          {checks.length === 0 ? (
            <p className="py-6 text-[13px] text-muted-foreground">
              No check detail returned by the API.
            </p>
          ) : (
            <ul className="divide-y divide-border/70">
              {checks.map((c) => {
                const { Icon, cls } = ICONS[c.state];
                return (
                  <li key={c.label} className="flex items-start gap-3 py-3.5 first:pt-0">
                    <Icon className={`mt-0.5 size-4.5 shrink-0 ${cls}`} />
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-bold">{c.label}</p>
                      <p className="text-[12.5px] text-muted-foreground">{c.value}</p>
                      {c.url ? (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-[12px] font-bold text-brand"
                        >
                          View file <ExternalLink className="size-3" />
                        </a>
                      ) : null}
                    </div>
                    <span className="ml-auto text-[11.5px] font-bold capitalize text-muted-foreground">
                      {c.state}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Documents & address">
          <ul className="divide-y divide-border/70 text-[13px]">
            {[
              ["Current tier", `Tier ${user.tier}`],
              ["BVN", docs.bvn],
              ["NIN", docs.nin],
              ["Residential address", docs.address],
              ["Account status", user.status],
            ].map(([k, v]) => (
              <li key={k} className="flex justify-between gap-4 py-2.5">
                <span className="text-muted-foreground">{k}</span>
                <span className="max-w-[60%] text-right font-bold capitalize">{v}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid gap-2">
            {docs.selfieUrl ? (
              <a
                href={docs.selfieUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-[12.5px] font-bold text-brand"
              >
                <FileText className="size-3.5" /> View selfie
              </a>
            ) : null}
            {docs.addressDocUrl ? (
              <a
                href={docs.addressDocUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-[12.5px] font-bold text-brand"
              >
                <FileText className="size-3.5" /> View proof of address
              </a>
            ) : null}
          </div>
        </Panel>
      </div>

      {superAdmin ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <Panel title="Upload KYC documents" eyebrow="Super admin">
            <div className="space-y-3">
              <label className="block">
                <span className={labelClass}>Selfie / liveness photo</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  disabled={uploading != null}
                  onChange={(e) => void onUpload("selfie", e.target.files?.[0] ?? null)}
                  className="block w-full text-[13px]"
                />
                {uploading === "selfie" ? (
                  <p className="mt-1 text-[12px] text-muted-foreground">Uploading…</p>
                ) : null}
              </label>
              <label className="block">
                <span className={labelClass}>Proof of address</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  disabled={uploading != null}
                  onChange={(e) => void onUpload("address", e.target.files?.[0] ?? null)}
                  className="block w-full text-[13px]"
                />
                {uploading === "address" ? (
                  <p className="mt-1 text-[12px] text-muted-foreground">Uploading…</p>
                ) : null}
              </label>
            </div>
          </Panel>

          <Panel title="Activate profile" eyebrow="Complete registration">
            <div className="space-y-3">
              <label className="block">
                <span className={labelClass}>Activate at tier</span>
                <select
                  value={activateTier}
                  onChange={(e) => setActivateTier(e.target.value as "TIER_1" | "TIER_2")}
                  className={fieldClass}
                >
                  <option value="TIER_1">Tier 1</option>
                  <option value="TIER_2">Tier 2</option>
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>BVN (optional)</span>
                <input
                  value={bvn}
                  onChange={(e) => setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  className={fieldClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>NIN (optional)</span>
                <input
                  value={nin}
                  onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  className={fieldClass}
                />
              </label>
              <p className="text-[12px] text-muted-foreground">
                Marks KYC approved, sets the tier, and unfreezes the account so the customer can use
                the app.
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onActivate()}
                className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-[13px] font-bold text-primary-foreground disabled:opacity-50"
              >
                {busy ? "Activating…" : "Activate profile"}
              </button>
            </div>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
