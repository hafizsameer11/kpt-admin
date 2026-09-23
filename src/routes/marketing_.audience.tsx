import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Filter, Users } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel, Stat } from "@/components/kipit/AdminBits";
import { SEGMENTS } from "@/lib/admin-marketing-data";
import { hydrateAdminUsersFromApi } from "@/lib/admin-users-data";

export const Route = createFileRoute("/marketing_/audience")({
  head: () => ({
    meta: [
      { title: "Audience segmentation — Kipit Admin Console" },
      {
        name: "description",
        content:
          "Build Kipit marketing audiences from KYC tier, investment status, user segment and custom filters.",
      },
      { property: "og:title", content: "Audience segmentation — Kipit Admin Console" },
      { property: "og:description", content: "Segment builder for Kipit campaigns." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AudiencePage,
});

const TIERS = ["Any tier", "Tier 0", "Tier 1", "Tier 2"];
const STATUSES = ["Any", "Active plan", "No active plan", "Never invested", "Maturing soon"];
const SEGMENT_KINDS = ["All customers", "New signups", "High value", "Dormant"];

function AudiencePage() {
  const [tier, setTier] = useState(TIERS[0]!);
  const [status, setStatus] = useState(STATUSES[0]!);
  const [kind, setKind] = useState(SEGMENT_KINDS[0]!);
  const [minBalance, setMinBalance] = useState("");
  const [base, setBase] = useState(0);

  useEffect(() => {
    void hydrateAdminUsersFromApi().then((users) => setBase(users.length));
  }, []);

  const estimate = Math.max(
    0,
    Math.round(
      base *
        (tier === "Any tier" ? 1 : tier === "Tier 2" ? 0.42 : tier === "Tier 1" ? 0.31 : 0.12) *
        (status === "Any" ? 1 : status === "Active plan" ? 0.58 : 0.24) *
        (kind === "All customers" ? 1 : 0.4) *
        (minBalance.trim() ? 0.35 : 1),
    ),
  );

  return (
    <AdminShell title="Audience segmentation" subtitle="ADM-102 · build and save reusable audiences">
      <Link
        to="/marketing"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to marketing
      </Link>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <Panel title="Custom audience" icon={Filter}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="KYC tier" value={tier} onChange={setTier} options={TIERS} />
            <Select label="Investment status" value={status} onChange={setStatus} options={STATUSES} />
            <Select label="User segment" value={kind} onChange={setKind} options={SEGMENT_KINDS} />
            <div>
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                Minimum wallet balance
              </p>
              <input
                value={minBalance}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  setMinBalance(digits ? Number(digits).toLocaleString("en-NG") : "");
                }}
                placeholder="₦0"
                inputMode="numeric"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand/50"
              />
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-brand/20 bg-brand/5 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Estimated audience size
            </p>
            <p className="mt-1 text-[26px] font-extrabold tabular-nums text-brand">
              {estimate.toLocaleString("en-NG")}
            </p>
            <p className="text-[12.5px] text-muted-foreground">
              {tier} · {status} · {kind}
              {minBalance ? ` · wallet ≥ ₦${minBalance}` : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={() => toast.success("Custom audience saved")}
            className="mt-4 w-full rounded-xl bg-brand px-4 py-3 text-[13.5px] font-bold text-primary-foreground"
          >
            Save audience
          </button>
        </Panel>

        <div className="space-y-5">
          <Stat
            label="Total customers"
            value={base.toLocaleString("en-NG")}
            helper="Addressable base"
            tone="brand"
            icon={Users}
          />
          <Panel title="Saved segments">
            <ul className="divide-y divide-border/70">
              {SEGMENTS.map((s) => (
                <li key={s.id} className="flex items-center gap-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold">{s.name}</span>
                    <span className="block truncate text-[12px] text-muted-foreground">
                      {s.description}
                    </span>
                  </span>
                  <span className="text-right text-[13px] font-extrabold tabular-nums">
                    {s.size.toLocaleString("en-NG")}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </AdminShell>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand/50"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
