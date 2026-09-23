import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

import { AdminShell } from "@/components/kipit/AdminShell";
import { Panel } from "@/components/kipit/AdminBits";
import { fetchSignupDropoffs } from "@/lib/admin-api";

export const Route = createFileRoute("/users_/dropoffs")({
  head: () => ({
    meta: [
      { title: "Signup drop-offs — Kipit Admin Console" },
      { name: "description", content: "Customers who started signup but did not finish." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DropoffsPage,
});

const STEP_LABEL: Record<string, string> = {
  method: "Chose sign-up method",
  email: "Entered email",
  otp: "OTP step",
  details: "Personal details",
  password: "Password",
  pin: "Transaction PIN",
  biometrics: "Biometrics",
  complete: "Completed",
};

function DropoffsPage() {
  const [rows, setRows] = useState<
    { id: string; email: string | null; phone: string | null; step: string; lastSeenAt: string }[]
  >([]);

  useEffect(() => {
    void fetchSignupDropoffs()
      .then(setRows)
      .catch(() => setRows([]));
  }, []);

  return (
    <AdminShell title="Signup drop-offs" subtitle="Incomplete onboarding funnel">
      <Link
        to="/users"
        className="inline-flex items-center gap-2 text-[13px] font-bold text-muted-foreground transition hover:text-brand"
      >
        <ArrowLeft className="size-4" />
        Back to users
      </Link>

      <Panel title="Potential customers" eyebrow={`${rows.length} open`} className="mt-5">
        {rows.length === 0 ? (
          <p className="py-6 text-[13px] text-muted-foreground">No incomplete sign-ups logged yet.</p>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left">
              <thead>
                <tr className="border-y border-border/70 bg-muted/40 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  <th className="px-5 py-2.5">Contact</th>
                  <th className="px-5 py-2.5">Last step</th>
                  <th className="px-5 py-2.5">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="px-5 py-3 text-[13.5px] font-bold">
                      {r.email || r.phone || "Unknown"}
                    </td>
                    <td className="px-5 py-3 text-[13px]">{STEP_LABEL[r.step] ?? r.step}</td>
                    <td className="px-5 py-3 text-[13px] text-muted-foreground">
                      {new Date(r.lastSeenAt).toLocaleString("en-NG")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </AdminShell>
  );
}
