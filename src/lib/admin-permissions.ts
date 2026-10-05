/**
 * Effective admin permissions for the signed-in operator.
 * Defaults match Roles & permissions; overrides come from /v1/admin/role-permissions.
 */

import { getAdminSession } from "@/lib/admin-auth";
import { ADMIN_ROLES, type AdminRoleId, ALL_PERMISSION_IDS } from "@/lib/admin-team-data";

const API_ROLE_TO_UI: Record<string, AdminRoleId> = {
  SUPER: "global-admin",
  GLOBAL: "global-admin",
  OPERATIONS: "operations",
  COMPLIANCE: "compliance",
  FINANCE: "finance",
  SUPPORT: "support",
  READ_ONLY: "read-only",
  MARKETING: "support",
};

let cachedOverrides: Record<string, string[]> | null = null;
let cachedAt = 0;
let cachedMeGrants: string[] | null = null;
let cachedMeAt = 0;
let cachedMeRole: string | null = null;

function defaultGrantsForRole(role: string | null | undefined): string[] {
  const key = API_ROLE_TO_UI[String(role || "").toUpperCase()] ?? "read-only";
  if (key === "global-admin") return [...ALL_PERMISSION_IDS];
  const def = ADMIN_ROLES.find((r) => r.id === key);
  return def ? [...def.grants] : [...(ADMIN_ROLES.find((r) => r.id === "read-only")?.grants ?? [])];
}

export function uiRoleIdFromApiRole(role?: string | null): AdminRoleId {
  return API_ROLE_TO_UI[String(role || "").toUpperCase()] ?? "read-only";
}

export async function hydrateAdminPermissionsFromApi(): Promise<string[]> {
  try {
    const { getAdminAccessToken, adminApi, fetchAdminRolePermissions } = await import("./admin-api");
    if (!getAdminAccessToken()) {
      cachedMeGrants = defaultGrantsForRole(getAdminSession()?.role);
      return cachedMeGrants;
    }
    const [me, overrides] = await Promise.all([
      adminApi<{
        role: string;
        permissions?: string[];
      }>("/v1/admin/me").catch(() => null),
      fetchAdminRolePermissions().catch(() => ({}) as Record<string, string[]>),
    ]);
    cachedOverrides = overrides && typeof overrides === "object" ? overrides : {};
    cachedAt = Date.now();
    if (me?.permissions && Array.isArray(me.permissions)) {
      cachedMeGrants = me.permissions;
      cachedMeRole = me.role;
      cachedMeAt = Date.now();
      return cachedMeGrants;
    }
    const role = me?.role || getAdminSession()?.role;
    cachedMeRole = role ?? null;
    const key = uiRoleIdFromApiRole(role);
    const fromOverride = cachedOverrides?.[key];
    cachedMeGrants = Array.isArray(fromOverride) ? [...fromOverride] : defaultGrantsForRole(role);
    cachedMeAt = Date.now();
    return cachedMeGrants;
  } catch {
    cachedMeGrants = defaultGrantsForRole(getAdminSession()?.role);
    return cachedMeGrants;
  }
}

export function getAdminPermissionsSync(): string[] {
  if (cachedMeGrants && Date.now() - cachedMeAt < 60_000) return cachedMeGrants;
  const role = cachedMeRole || getAdminSession()?.role;
  const key = uiRoleIdFromApiRole(role);
  if (cachedOverrides?.[key] && Date.now() - cachedAt < 60_000) {
    return [...cachedOverrides[key]!];
  }
  return defaultGrantsForRole(role);
}

export function adminHasPermission(...needed: string[]): boolean {
  if (!needed.length) return true;
  const role = cachedMeRole || getAdminSession()?.role;
  if (uiRoleIdFromApiRole(role) === "global-admin") return true;
  const grants = getAdminPermissionsSync();
  return needed.some((p) => grants.includes(p));
}

/** Nav / page gate — true if any listed permission is held. */
export function adminCanAccess(...needed: string[]): boolean {
  return adminHasPermission(...needed);
}

export function clearAdminPermissionsCache() {
  cachedOverrides = null;
  cachedMeGrants = null;
  cachedAt = 0;
  cachedMeAt = 0;
  cachedMeRole = null;
}
