"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { ChevronRight, CircleUserRound, LoaderCircle, LockKeyhole, MapPin, Plus, Save, Settings, Trash2, UserRound, X } from "lucide-react";
import AuthRouteGuard from "@/components/AuthRouteGuard";
import { getSession, saveSession, type AuthSession } from "@/lib/session";
import { notifyAuthStateChange } from "@/lib/auth-state";

type Section = "addresses" | "settings";
type Profile = { id: string; name: string; email: string; phone: string; role: string };
type Address = { id: string; name: string; details: string; phone: string; city: string };
type AddressForm = Omit<Address, "id">;
type ApiRecord = Record<string, unknown>;

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "https://ecommerce.routemisr.com/api/v1").replace(/\/$/, "");

function record(value: unknown): ApiRecord | null {
  return typeof value === "object" && value !== null ? value as ApiRecord : null;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getProfile(body: unknown, fallback: Profile): Profile {
  const root = record(body);
  const data = record(root?.data);
  const decoded = record(data?.decoded) ?? record(root?.decoded);
  const user = decoded ?? record(data?.user) ?? record(root?.user) ?? data ?? root;
  if (!user) return fallback;
  return {
    id: stringValue(user._id) || stringValue(user.id) || fallback.id,
    name: stringValue(user.name) || fallback.name,
    email: stringValue(user.email) || fallback.email,
    phone: stringValue(user.phone) || fallback.phone,
    role: stringValue(user.role) || fallback.role,
  };
}

function getAddresses(body: unknown): Address[] {
  const root = record(body);
  const data = root?.data;
  const nestedData = record(data);
  const values = Array.isArray(data) ? data : Array.isArray(nestedData?.addresses) ? nestedData.addresses : Array.isArray(nestedData?.data) ? nestedData.data : [];
  return values.flatMap((value): Address[] => {
    const item = record(value);
    const id = stringValue(item?._id) || stringValue(item?.id);
    if (!item || !id) return [];
    return [{ id, name: stringValue(item.name), details: stringValue(item.details), phone: stringValue(item.phone), city: stringValue(item.city) }];
  });
}

async function readBody(response: Response): Promise<unknown> {
  try { return await response.json() as unknown; } catch { return null; }
}

function apiMessage(body: unknown, fallback: string): string {
  const message = record(body)?.message;
  return typeof message === "string" ? message : fallback;
}

function ProfileWorkspace({ initialSection }: { initialSection: Section }) {
  const [section, setSection] = useState<Section>(initialSection);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<Profile>({ id: "", name: "", email: "", phone: "", role: "user" });
  const [identityLoading, setIdentityLoading] = useState(true);
  const [identityError, setIdentityError] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressesError, setAddressesError] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState<AddressForm>({ name: "", details: "", phone: "", city: "" });
  const [addressBusy, setAddressBusy] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const loadAddresses = useCallback(async (token: string) => {
    setAddressesLoading(true);
    setAddressesError("");
    try {
      const response = await fetch(`${API_BASE}/addresses`, { headers: { token, "Cache-Control": "no-cache" }, cache: "no-store", signal: AbortSignal.timeout(8000) });
      const body = await readBody(response);
      if (response.status === 404) { setAddresses([]); return; }
      if (!response.ok) throw new Error(apiMessage(body, "Could not load your addresses."));
      setAddresses(getAddresses(body));
    } catch (error) {
      setAddressesError(error instanceof Error ? error.message : "Could not load your addresses.");
    } finally {
      setAddressesLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const currentSession = getSession();
      if (!currentSession) return;
      await Promise.resolve();
      if (cancelled) return;
      setSession(currentSession);
      const fallbackProfile: Profile = {
        id: currentSession.user.id ?? "",
        name: currentSession.user.name ?? "",
        email: currentSession.user.email ?? "",
        phone: "",
        role: "user",
      };
      setProfile(fallbackProfile);
      void loadAddresses(currentSession.token);
      try {
        const response = await fetch(`${API_BASE}/auth/verifyToken`, { headers: { token: currentSession.token, "Cache-Control": "no-cache" }, cache: "no-store", signal: AbortSignal.timeout(8000) });
        const body = await readBody(response);
        if (!response.ok) throw new Error(apiMessage(body, "Could not load account information."));
        if (!cancelled) setProfile((current) => getProfile(body, current));
      } catch (error) {
        if (!cancelled) setIdentityError(error instanceof Error ? error.message : "Could not load account information.");
      } finally {
        if (!cancelled) setIdentityLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadAddresses]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setProfileBusy(true);
    try {
      const response = await fetch(`${API_BASE}/users/updateMe/`, {
        method: "PUT",
        headers: { token: session.token, "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name, email: profile.email, phone: profile.phone }),
        signal: AbortSignal.timeout(8000),
      });
      const body = await readBody(response);
      if (!response.ok) throw new Error(apiMessage(body, "Could not update your profile."));
      const updatedProfile = getProfile(body, profile);
      setProfile(updatedProfile);
      const nextSession = { ...session, user: { ...session.user, id: updatedProfile.id || session.user.id, name: updatedProfile.name, email: updatedProfile.email } };
      saveSession(nextSession);
      setSession(nextSession);
      notifyAuthStateChange();
      toast.success(apiMessage(body, "Profile updated successfully."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update your profile.");
    } finally {
      setProfileBusy(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    if (newPassword !== confirmPassword) { toast.error("The new passwords do not match."); return; }
    setPasswordBusy(true);
    try {
      const response = await fetch(`${API_BASE}/users/changeMyPassword`, {
        method: "PUT",
        headers: { token: session.token, "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, password: newPassword, rePassword: confirmPassword }),
        signal: AbortSignal.timeout(8000),
      });
      const body = await readBody(response);
      if (!response.ok) throw new Error(apiMessage(body, "Could not change your password."));
      const data = record(record(body)?.data);
      const nextToken = stringValue(data?.token) || stringValue(record(body)?.token);
      if (nextToken) {
        const nextSession = { ...session, token: nextToken };
        saveSession(nextSession);
        setSession(nextSession);
        notifyAuthStateChange();
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(apiMessage(body, "Password changed successfully."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change your password.");
    } finally {
      setPasswordBusy(false);
    }
  }

  async function addAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setAddressBusy(true);
    try {
      const response = await fetch(`${API_BASE}/addresses`, {
        method: "POST",
        headers: { token: session.token, "Content-Type": "application/json" },
        body: JSON.stringify(addressForm),
        signal: AbortSignal.timeout(8000),
      });
      const body = await readBody(response);
      if (!response.ok) throw new Error(apiMessage(body, "Could not add this address."));
      await loadAddresses(session.token);
      setAddressForm({ name: "", details: "", phone: "", city: "" });
      setShowAddressForm(false);
      toast.success(apiMessage(body, "Address added successfully."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add this address.");
    } finally {
      setAddressBusy(false);
    }
  }

  async function deleteAddress(id: string) {
    if (!session) return;
    setAddressBusy(true);
    try {
      const response = await fetch(`${API_BASE}/addresses/${encodeURIComponent(id)}`, { method: "DELETE", headers: { token: session.token }, signal: AbortSignal.timeout(8000) });
      const body = await readBody(response);
      if (!response.ok) throw new Error(apiMessage(body, "Could not remove this address."));
      setAddresses((current) => current.filter((address) => address.id !== id));
      toast.success(apiMessage(body, "Address removed."));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove this address.");
    } finally {
      setAddressBusy(false);
    }
  }

  function closeAddressForm() {
    if (addressBusy) return;
    setShowAddressForm(false);
    setAddressForm({ name: "", details: "", phone: "", city: "" });
  }

  const navLink = (key: Section, href: string, label: string, Icon: typeof MapPin) => {
    const active = section === key;
    return <Link href={href} aria-current={active ? "page" : undefined} onClick={() => setSection(key)} className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${active ? "bg-primary-50 text-primary-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}><span className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${active ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"}`}><Icon size={16} aria-hidden="true" /></span><span className="flex-1 font-medium">{label}</span><ChevronRight size={14} className={`transition-transform ${active ? "text-primary-500" : "text-gray-400"}`} aria-hidden="true" /></Link>;
  };

  return <AuthRouteGuard access="signed-in"><main className="container mx-auto px-4 py-8"><div className="mb-6 flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600"><CircleUserRound size={25} aria-hidden="true" /></span><div><h1 className="text-2xl font-bold text-gray-900">My Profile</h1><p className="text-sm text-gray-500">Manage your account and saved information</p></div></div>
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8"><aside className="w-full shrink-0 lg:w-72"><nav className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs"><div className="border-b border-gray-100 p-4"><h2 className="font-bold text-gray-900">My Account</h2></div><ul className="space-y-1 p-2"><li>{navLink("addresses", "/profile", "My Addresses", MapPin)}</li><li>{navLink("settings", "/profile/settings", "Settings", Settings)}</li></ul></nav></aside>
      <div className="min-w-0 flex-1">{section === "addresses" ? <section>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-bold text-gray-900">My Addresses</h2><p className="mt-1 text-sm text-gray-500">Manage your saved delivery addresses</p></div><button type="button" onClick={() => setShowAddressForm(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 font-semibold text-white shadow-lg shadow-primary-600/25 transition-colors hover:bg-primary-700"><Plus size={16} aria-hidden="true" />Add Address</button></div>
        {addressesLoading ? <div className="rounded-3xl border border-gray-100 bg-white p-12 text-center text-gray-500"><LoaderCircle className="mx-auto mb-3 animate-spin text-primary-600" />Loading addresses...</div> : addressesError ? <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center"><p className="text-gray-600">{addressesError}</p><button type="button" onClick={() => session && void loadAddresses(session.token)} className="mt-4 font-semibold text-primary-600 hover:underline">Try again</button></div> : addresses.length ? <div className="grid gap-4 md:grid-cols-2">{addresses.map((address) => <article key={address.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs"><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600"><MapPin size={18} aria-hidden="true" /></span><div><h3 className="font-bold text-gray-900">{address.name || "Delivery address"}</h3><p className="mt-1 text-sm text-gray-500">{address.details}</p><p className="mt-1 text-sm text-gray-500">{address.city} · {address.phone}</p></div></div><button type="button" title="Remove address" aria-label={`Remove ${address.name || "address"}`} disabled={addressBusy} onClick={() => void deleteAddress(address.id)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50 disabled:opacity-50"><Trash2 size={16} aria-hidden="true" /></button></div></article>)}</div> : <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center sm:p-12"><span className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-400"><MapPin size={30} aria-hidden="true" /></span><h3 className="mb-2 text-lg font-bold text-gray-900">No Addresses Yet</h3><p className="mx-auto mb-6 max-w-sm text-gray-500">Add your first delivery address to make checkout faster and easier.</p><button type="button" onClick={() => setShowAddressForm(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-600/25 transition-colors hover:bg-primary-700"><Plus size={16} aria-hidden="true" />Add Your First Address</button></div>}
      </section> : <section className="space-y-6"><div className="mb-6"><h2 className="text-xl font-bold text-gray-900">Account Settings</h2><p className="mt-1 text-sm text-gray-500">Update your profile information and change your password</p></div>
        <article className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xs"><div className="border-b border-gray-100 p-6 sm:p-8"><div className="mb-6 flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-600"><UserRound size={26} aria-hidden="true" /></span><div><h3 className="font-bold text-gray-900">Profile Information</h3><p className="text-sm text-gray-500">Update your personal details</p></div></div><form onSubmit={saveProfile} className="space-y-5"><label className="block text-sm font-medium text-gray-700">Full Name<input required value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} placeholder="Enter your name" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-hidden transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" /></label><label className="block text-sm font-medium text-gray-700">Email Address<input required type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} placeholder="Enter your email" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-hidden transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" /></label><label className="block text-sm font-medium text-gray-700">Phone Number<input required type="tel" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} placeholder="01xxxxxxxxx" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-hidden transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" /></label><button type="submit" disabled={profileBusy} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-600/25 transition-colors hover:bg-primary-700 disabled:opacity-50">{profileBusy ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />}Save Changes</button></form></div><div className="bg-gray-50 p-6 sm:p-8"><h3 className="mb-2 font-bold text-gray-900">Account Information</h3>{identityLoading ? <p role="status" className="mb-4 text-sm text-gray-500">Loading account details...</p> : identityError ? <p role="alert" className="mb-4 text-sm text-amber-700">{identityError} Showing saved account details where available.</p> : null}<div className="space-y-3 text-sm"><div className="flex items-center justify-between gap-3"><span className="text-gray-500">User ID</span><span className="truncate font-mono text-gray-700">{profile.id || "—"}</span></div><div className="flex items-center justify-between"><span className="text-gray-500">Role</span><span className="rounded-lg bg-primary-100 px-3 py-1 font-medium capitalize text-primary-700">{profile.role || "—"}</span></div></div></div></article>
        <article className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xs"><div className="p-6 sm:p-8"><div className="mb-6 flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600"><LockKeyhole size={25} aria-hidden="true" /></span><div><h3 className="font-bold text-gray-900">Change Password</h3><p className="text-sm text-gray-500">Update your account password</p></div></div><form onSubmit={changePassword} className="space-y-5"><label className="block text-sm font-medium text-gray-700">Current Password<input required type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your current password" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-hidden transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" /></label><label className="block text-sm font-medium text-gray-700">New Password<input required minLength={6} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" placeholder="Enter your new password" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-hidden transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" /><span className="mt-1 block text-xs text-gray-500">Must be at least 6 characters</span></label><label className="block text-sm font-medium text-gray-700">Confirm New Password<input required type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" placeholder="Confirm your new password" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-hidden transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" /></label><button type="submit" disabled={passwordBusy} className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3 font-semibold text-white shadow-lg shadow-amber-600/25 transition-colors hover:bg-amber-700 disabled:opacity-50">{passwordBusy ? <LoaderCircle size={17} className="animate-spin" /> : <LockKeyhole size={17} />}Change Password</button></form></div></article>
      </section>}
      {section === "addresses" && showAddressForm && <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
        <button type="button" aria-label="Close add address dialog" onClick={closeAddressForm} disabled={addressBusy} className="absolute inset-0 bg-black/50 backdrop-blur-sm disabled:cursor-wait" />
        <section role="dialog" aria-modal="true" aria-labelledby="add-address-title" className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 sm:p-8">
          <div className="mb-6 flex items-center justify-between"><h2 id="add-address-title" className="text-xl font-bold text-gray-900">Add New Address</h2><button type="button" disabled={addressBusy} onClick={closeAddressForm} aria-label="Close dialog" className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"><X size={18} aria-hidden="true" /></button></div>
          <form onSubmit={addAddress} className="space-y-5">
            <label className="block text-sm font-medium text-gray-700">Address Name<input required value={addressForm.name} onChange={(event) => setAddressForm({ ...addressForm, name: event.target.value })} placeholder="e.g. Home, Office" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-hidden transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" /></label>
            <label className="block text-sm font-medium text-gray-700">Full Address<textarea required rows={3} value={addressForm.details} onChange={(event) => setAddressForm({ ...addressForm, details: event.target.value })} placeholder="Street, building, apartment..." className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-hidden transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" /></label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="block text-sm font-medium text-gray-700">Phone Number<input required type="tel" value={addressForm.phone} onChange={(event) => setAddressForm({ ...addressForm, phone: event.target.value })} placeholder="01xxxxxxxxx" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-hidden transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" /></label><label className="block text-sm font-medium text-gray-700">City<input required value={addressForm.city} onChange={(event) => setAddressForm({ ...addressForm, city: event.target.value })} placeholder="Cairo" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-hidden transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" /></label></div>
            <div className="flex items-center gap-3 pt-4"><button type="button" disabled={addressBusy} onClick={closeAddressForm} className="flex-1 rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50">Cancel</button><button type="submit" disabled={addressBusy} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-600/25 transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50">{addressBusy ? <><LoaderCircle size={16} className="animate-spin" />Adding...</> : "Add Address"}</button></div>
          </form>
        </section>
      </div>}
      </div>
    </div>
  </main></AuthRouteGuard>;
}

export default function ProfileWorkspacePage({ initialSection }: { initialSection: Section }) {
  return <ProfileWorkspace key={initialSection} initialSection={initialSection} />;
}

export function ProfileSettingsPage() {
  return <ProfileWorkspace key="settings" initialSection="settings" />;
}
