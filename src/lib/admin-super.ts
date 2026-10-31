import { getAdminSession } from "@/lib/admin-auth";

/** API role SUPER only — GLOBAL is not enough for privileged admin actions. */
export function isSuperAdminSession() {
  return String(getAdminSession()?.role || "").toUpperCase() === "SUPER";
}

/** Money input that keeps up to 2 decimal places (kobo) without shifting on format. */
export function formatMoneyInput(raw: string) {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) return "";
  const firstDot = cleaned.indexOf(".");
  let intPart = firstDot >= 0 ? cleaned.slice(0, firstDot) : cleaned;
  let decPart = firstDot >= 0 ? cleaned.slice(firstDot + 1).replace(/\./g, "").slice(0, 2) : null;
  intPart = intPart.replace(/^0+(?=\d)/, "") || (decPart != null ? "0" : intPart);
  if (decPart != null) {
    const intFormatted = intPart ? Number(intPart).toLocaleString("en-NG") : "0";
    return `${intFormatted}.${decPart}`;
  }
  return intPart ? Number(intPart).toLocaleString("en-NG") : "";
}

export function parseMoneyInput(raw: string) {
  const n = Number(String(raw).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Format a stored naira amount for inputs without Math.round drift. */
export function moneyToInput(naira: number) {
  if (!Number.isFinite(naira)) return "";
  const fixed = (Math.round(naira * 100) / 100).toFixed(2);
  const [intPart, dec] = fixed.split(".");
  const intFormatted = Number(intPart).toLocaleString("en-NG");
  if (dec === "00") return intFormatted;
  if (dec.endsWith("0")) return `${intFormatted}.${dec.slice(0, 1)}`;
  return `${intFormatted}.${dec}`;
}
