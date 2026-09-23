/**
 * Admin console authentication fixtures (ADM-001 – ADM-003).
 * Session UI state lives in localStorage; tokens go through admin-api.
 */

import { adminLogout, getAdminAccessToken, setAdminAccessToken } from "@/lib/admin-api";

export const ADMIN_EMAIL = "seyi.adeleke@kipit.com";
export const ADMIN_PASSWORD = "Kipit1234!";

const KEY = "kipit.admin.session";

export type AdminSession = {
  email: string;
  name: string;
  role: string;
  signedInAt: number;
  locked: boolean;
};

const AUM_ROLES = new Set(["SUPER", "GLOBAL", "OPERATIONS", "Global Admin", "Operations", "Super Admin"]);

export function canViewAum(role?: string | null) {
  if (!role) return false;
  return AUM_ROLES.has(role) || /super|global|operations/i.test(role);
}

function read(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

function write(session: AdminSession | null) {
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(KEY, JSON.stringify(session));
  else window.localStorage.removeItem(KEY);
}

export function getAdminSession() {
  return read();
}

export function isAdminSignedIn() {
  const s = read();
  return Boolean(s && !s.locked && getAdminAccessToken());
}

export function startAdminSession(
  email: string,
  profile?: { name?: string; role?: string },
) {
  write({
    email,
    name: profile?.name || email.split("@")[0] || "Operator",
    role: profile?.role || "OPERATIONS",
    signedInAt: Date.now(),
    locked: false,
  });
}

export function lockAdminSession() {
  const s = read();
  if (s) write({ ...s, locked: true });
}

export function unlockAdminSession() {
  const s = read();
  if (s) write({ ...s, locked: false, signedInAt: Date.now() });
}

export async function endAdminSession() {
  await adminLogout();
  write(null);
  setAdminAccessToken(null);
}

/** Minutes of inactivity before the console auto-locks (ADM-003). */
export const ADMIN_IDLE_MINUTES = 15;
