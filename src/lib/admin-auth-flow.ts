/** In-memory draft carrying the sign-in step to the two-factor step (ADM-001 → ADM-002). */
import { ADMIN_EMAIL } from "./admin-auth";

export { ADMIN_EMAIL, ADMIN_PASSWORD } from "./admin-auth";

let pendingEmail = ADMIN_EMAIL;
let pendingPassword = "";
let pendingProfile: { name?: string; role?: string } = {};

export function setPendingAdminEmail(email: string) {
  pendingEmail = email;
}

export function getPendingAdminEmail() {
  return pendingEmail;
}

export function setPendingAdminPassword(password: string) {
  pendingPassword = password;
}

export function getPendingAdminPassword() {
  return pendingPassword;
}

export function clearPendingAdminPassword() {
  pendingPassword = "";
}

export function setPendingAdminProfile(profile: { name?: string; role?: string }) {
  pendingProfile = profile;
}

export function getPendingAdminProfile() {
  return pendingProfile;
}

let pendingDebugOtp: string | null = null;

export function setPendingDebugOtp(code: string | null) {
  pendingDebugOtp = code;
}

export function takePendingDebugOtp() {
  const code = pendingDebugOtp;
  pendingDebugOtp = null;
  return code;
}
