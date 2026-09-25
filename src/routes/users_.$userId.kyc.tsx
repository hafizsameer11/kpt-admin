import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, ExternalLink, FileText, XCircle } from "lucide-react";

import { Panel } from "@/components/kipit/AdminBits";
import { findUser, hydrateAdminUserFromApi } from "@/lib/admin-users-data";
import { fetchAdminUser } from "@/lib/admin-api";

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

function Kyc() {
  const { userId } = Route.useParams();
  const [user, setUser] = useState(findUser(userId));
  const [checks, setChecks] = useState<DocRow[]>([]);
  const [docs, setDocs] = useState<{ selfieUrl: string | null; addressDocUrl: string | null; address: string }>({
    selfieUrl: null,
    addressDocUrl: null,
    address: "—",
  });

  useEffect(() => {
    void hydrateAdminUserFromApi(userId).then((u) => {
      if (u) setUser(u);
    });
    void (async () => {
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
        });
        const mapStatus = (s?: string | null): DocRow["state"] => {
          if (s === "SUCCESS") return "passed";
          if (s === "FAILED") return "failed";
          return "pending";
        };
        setChecks([
          {
            label: "BVN",
            value: kyc?.profile?.bvnName || kyc?.profile?.bvnProviderStatus || "—",
            state: mapStatus(kyc?.profile?.bvnProviderStatus),
          },
          {
            label: "NIN",
            value: kyc?.profile?.ninName || kyc?.profile?.ninProviderStatus || "—",
            state: mapStatus(kyc?.profile?.ninProviderStatus),
          },
          {
            label: "Selfie on file",
            value: d?.selfieUrl || kyc?.profile?.hasSelfie ? "Available for viewing" : "Not uploaded",
            url: d?.selfieUrl,
            state: d?.selfieUrl || kyc?.profile?.hasSelfie ? "passed" : "pending",
          },
          {
            label: "Proof of address",
            value: d?.addressDocUrl || kyc?.profile?.hasAddressDoc ? "Available for viewing" : "Not uploaded",
            url: d?.addressDocUrl,
            state: d?.addressDocUrl || kyc?.profile?.hasAddressDoc ? "passed" : "pending",
          },
          {
            label: "KYC status",
            value: kyc?.status || "—",
            state: kyc?.status === "APPROVED" ? "passed" : kyc?.status === "REJECTED" ? "failed" : "pending",
          },
        ]);
      } catch {
        setChecks([]);
      }
    })();
  }, [userId]);

  if (!user) {
    return <p className="text-[13px] text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Panel title="Verification checks">
        {checks.length === 0 ? (
          <p className="py-6 text-[13px] text-muted-foreground">No check detail returned by the API.</p>
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
        <p className="mt-4 rounded-xl bg-muted/60 p-3 text-[12.5px] text-muted-foreground">
          Tier 2 auto-approves when NIN and name match. Selfie and address files stay here for admin viewing only —
          they are not a separate approval status.
        </p>
      </Panel>
    </div>
  );
}
