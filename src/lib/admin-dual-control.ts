import { getAdminSession } from "@/lib/admin-auth";

export type DualControlPayload = {
  operatorPin?: string;
  approverEmail?: string;
  approverPin?: string;
};

/** SUPER/GLOBAL skip dual confirm; Operations and others need a second approver on sensitive edits. */
export function needsDualConfirmForMutation(): boolean {
  const role = String(getAdminSession()?.role || "").toUpperCase();
  return role !== "SUPER" && role !== "GLOBAL";
}