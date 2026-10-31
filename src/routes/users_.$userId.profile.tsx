import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Panel } from "@/components/kipit/AdminBits";
import {
  AdminApiError,
  fetchAdminUser,
  updateAdminUserProfile,
} from "@/lib/admin-api";
import { hydrateAdminUserFromApi } from "@/lib/admin-users-data";
import { isSuperAdminSession } from "@/lib/admin-super";

export const Route = createFileRoute("/users_/$userId/profile")({
  component: Profile,
});

function isoDay(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function Profile() {
  const { userId } = Route.useParams();
  const superAdmin = isSuperAdminSession();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [accountType, setAccountType] = useState<"PERSONAL" | "BUSINESS">("PERSONAL");
  const [businessName, setBusinessName] = useState("");
  const [businessRc, setBusinessRc] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [occupation, setOccupation] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState("");
  const [sourceOfFunds, setSourceOfFunds] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressLga, setAddressLga] = useState("");
  const [kycTier, setKycTier] = useState<"TIER_0" | "TIER_1" | "TIER_2">("TIER_0");

  const load = async () => {
    setLoading(true);
    try {
      const row = await fetchAdminUser(userId);
      setFirstName(row.firstName || "");
      setMiddleName(row.middleName || "");
      setSurname(row.surname || "");
      setEmail(row.email || "");
      setPhone(row.phone || "");
      setAccountType(row.accountType === "BUSINESS" ? "BUSINESS" : "PERSONAL");
      setBusinessName(row.businessName || "");
      setBusinessRc(row.businessRcNumber || "");
      setDateOfBirth(isoDay(row.dateOfBirth));
      setGender(row.gender || "");
      setOccupation(row.occupation || "");
      setEmploymentStatus(row.employmentStatus || "");
      setSourceOfFunds(row.sourceOfFunds || "");
      setAddressStreet(row.addressStreet || "");
      setAddressCity(row.addressCity || "");
      setAddressState(row.addressState || "");
      setAddressLga(row.addressLga || "");
      const tier = (row.kycTier || "TIER_0").toUpperCase();
      setKycTier(tier === "TIER_1" || tier === "TIER_2" ? tier : "TIER_0");
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Could not load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [userId]);

  const save = async () => {
    if (!superAdmin || busy) return;
    setBusy(true);
    try {
      await updateAdminUserProfile(userId, {
        firstName: firstName.trim(),
        middleName: middleName.trim() || null,
        surname: surname.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        accountType,
        businessName: accountType === "BUSINESS" ? businessName.trim() || null : null,
        businessRcNumber: accountType === "BUSINESS" ? businessRc.trim() || null : null,
        dateOfBirth: dateOfBirth || null,
        gender: gender.trim() || null,
        occupation: occupation.trim() || null,
        employmentStatus: employmentStatus.trim() || null,
        sourceOfFunds: sourceOfFunds.trim() || null,
        addressStreet: addressStreet.trim() || null,
        addressCity: addressCity.trim() || null,
        addressState: addressState.trim() || null,
        addressLga: addressLga.trim() || null,
        kycTier,
      });
      toast.success("Profile updated");
      await hydrateAdminUserFromApi(userId);
      await load();
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : "Could not update profile");
    } finally {
      setBusy(false);
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[13.5px] outline-none focus:border-brand";
  const labelClass =
    "mb-1 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground";

  if (!superAdmin) {
    return (
      <Panel title="Profile">
        <p className="text-[13px] text-muted-foreground">
          Only Super Admin can edit a customer profile. Open KYC or Overview for read-only details.
        </p>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      <Panel title="Edit profile" eyebrow={loading ? "Loading…" : "Super admin"}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>First name</span>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Middle name</span>
            <input value={middleName} onChange={(e) => setMiddleName(e.target.value)} className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Surname</span>
            <input value={surname} onChange={(e) => setSurname(e.target.value)} className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Account type</span>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as "PERSONAL" | "BUSINESS")}
              className={fieldClass}
            >
              <option value="PERSONAL">Personal</option>
              <option value="BUSINESS">Business</option>
            </select>
          </label>
          {accountType === "BUSINESS" ? (
            <>
              <label className="block">
                <span className={labelClass}>Business name</span>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className={fieldClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>RC number</span>
                <input value={businessRc} onChange={(e) => setBusinessRc(e.target.value)} className={fieldClass} />
              </label>
            </>
          ) : null}
          <label className="block">
            <span className={labelClass}>Date of birth</span>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Gender</span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className={fieldClass}
            >
              <option value="">Select gender</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Occupation</span>
            <input value={occupation} onChange={(e) => setOccupation(e.target.value)} className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>Employment status</span>
            <input
              value={employmentStatus}
              onChange={(e) => setEmploymentStatus(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Source of funds</span>
            <input
              value={sourceOfFunds}
              onChange={(e) => setSourceOfFunds(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className={labelClass}>Street address</span>
            <input
              value={addressStreet}
              onChange={(e) => setAddressStreet(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className={labelClass}>City</span>
            <input value={addressCity} onChange={(e) => setAddressCity(e.target.value)} className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>State</span>
            <input value={addressState} onChange={(e) => setAddressState(e.target.value)} className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>LGA</span>
            <input value={addressLga} onChange={(e) => setAddressLga(e.target.value)} className={fieldClass} />
          </label>
          <label className="block">
            <span className={labelClass}>KYC tier</span>
            <select
              value={kycTier}
              onChange={(e) => setKycTier(e.target.value as "TIER_0" | "TIER_1" | "TIER_2")}
              className={fieldClass}
            >
              <option value="TIER_0">Tier 0</option>
              <option value="TIER_1">Tier 1</option>
              <option value="TIER_2">Tier 2</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            disabled={busy || !firstName.trim() || !surname.trim() || !email.trim()}
            onClick={() => void save()}
            className="inline-flex h-10 items-center rounded-lg bg-brand px-4 text-[13px] font-bold text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save profile"}
          </button>
        </div>
      </Panel>
    </div>
  );
}
