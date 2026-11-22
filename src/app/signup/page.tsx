"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Star, Truck } from "lucide-react";
import toast from "react-hot-toast";
import { submitAuth } from "@/lib/auth";
import { signUpSchema } from "@/lib/auth-validation";
import AuthRouteGuard from "@/components/AuthRouteGuard";

function passwordStrength(password: string) {
  const checks = [password.length >= 8, /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password), /[A-Z]/.test(password)];
  const score = checks.filter(Boolean).length;
  if (score <= 1) return { label: "Weak", percentage: score === 0 ? 0 : 25, color: "bg-red-500" };
  if (score === 2) return { label: "Fair", percentage: 50, color: "bg-amber-500" };
  if (score === 3) return { label: "Good", percentage: 75, color: "bg-lime-500" };
  return { label: "Strong", percentage: 100, color: "bg-green-600" };
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [phone, setPhone] = useState("");
  const [terms, setTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const strength = passwordStrength(password);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = signUpSchema.safeParse({ name, email, password, rePassword, phone, terms });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Check the information you entered.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { terms: acceptedTerms, ...payload } = validation.data;
      void acceptedTerms;
      const result = await submitAuth("signup", payload);
      toast.success(result.message ?? "Registration completed.");
      if (result.message === "success") router.replace("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return <AuthRouteGuard access="guest">{
    <main className="py-10">
      <div className="container mx-auto grid max-w-7xl grid-cols-1 gap-12 p-4 lg:grid-cols-2">
        <section>
          <h1 className="text-4xl font-bold">Welcome to <span className="text-primary-600">FreshCart</span></h1>
          <p className="mb-4 mt-2 text-xl">Join thousands of happy customers who enjoy fresh groceries delivered right to their doorstep.</p>

          <ul className="my-8 space-y-6 [&>li]:flex [&>li]:items-start [&>li]:gap-4">
            <li>
              <div className="flex size-12 items-center justify-center rounded-full bg-primary-200 text-lg text-primary-600"><Star size={19} fill="currentColor" aria-hidden="true" /></div>
              <div><h2 className="text-lg font-semibold">Premium Quality</h2><p className="text-gray-600">Premium quality products sourced from trusted suppliers.</p></div>
            </li>
            <li>
              <div className="flex size-12 items-center justify-center rounded-full bg-primary-200 text-lg text-primary-600"><Truck size={20} aria-hidden="true" /></div>
              <div><h2 className="text-lg font-semibold">Fast Delivery</h2><p className="text-gray-600">Same-day delivery available in most areas</p></div>
            </li>
            <li>
              <div className="flex size-12 items-center justify-center rounded-full bg-primary-200 text-lg text-primary-600"><ShieldCheck size={20} aria-hidden="true" /></div>
              <div><h2 className="text-lg font-semibold">Secure Shopping</h2><p className="text-gray-600">Your data and payments are completely secure</p></div>
            </li>
          </ul>

          <div className="rounded-md bg-white p-4 shadow-xs">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700" aria-label="Sarah Johnson">SJ</div>
              <div><h3>Sarah Johnson</h3><div className="flex text-yellow-300" aria-label="5 out of 5 stars"><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/></div></div>
            </div>
            <blockquote><p className="italic text-gray-600">&quot;FreshCart has transformed my shopping experience. The quality of the products is outstanding, and the delivery is always on time. Highly recommend!&quot;</p></blockquote>
          </div>
        </section>

        <section className="rounded-2xl bg-white px-6 py-10 shadow-lg">
          <h2 className="mb-2 text-center text-3xl font-semibold">Create Your Account</h2>
          <p className="text-center">Start your fresh journey with us today</p>

          <div className="my-10 space-y-3">
            <button type="button" aria-label="Sign up with Google" className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-gray-200 px-4 py-3 transition-all duration-200 hover:border-primary-300 hover:bg-primary-50">
              <svg data-prefix="fab" data-icon="google" className="svg-inline--fa fa-google h-5 w-5 shrink-0 text-red-500" role="img" viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="M500 261.8C500 403.3 403.1 504 260 504 122.8 504 12 393.2 12 256S122.8 8 260 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9c-88.3-85.2-252.5-21.2-252.5 118.2 0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9l-140.8 0 0-85.3 236.1 0c2.3 12.7 3.9 24.9 3.9 41.4z" /></svg><span className="text-sm font-medium text-gray-700">Continue with Google</span>
            </button>
            <button type="button" aria-label="Sign up with Facebook" className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-gray-200 px-4 py-3 transition-all duration-200 hover:border-primary-300 hover:bg-primary-50">
              <svg data-prefix="fab" data-icon="facebook" className="svg-inline--fa fa-facebook h-5 w-5 shrink-0 text-blue-600" role="img" viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="M512 256C512 114.6 397.4 0 256 0S0 114.6 0 256C0 376 82.7 476.8 194.2 504.5l0-170.3-52.8 0 0-78.2 52.8 0 0-33.7c0-87.1 39.4-127.5 125-127.5 16.2 0 44.2 3.2 55.7 6.4l0 70.8c-6-.6-16.5-1-29.6-1-42 0-58.2 15.9-58.2 57.2l0 27.8 83.6 0-14.4 78.2-69.3 0 0 175.9C413.8 494.8 512 386.9 512 256z" /></svg><span className="text-sm font-medium text-gray-700">Continue with Facebook</span>
            </button>
          </div>

          <div className="my-4 flex h-0.5 w-full items-center justify-center bg-gray-300/30" aria-hidden="true"><span className="bg-white px-4">or</span></div>

          <form className="space-y-7" noValidate onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2"><label htmlFor="name">Name*</label><input id="name" name="name" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-hidden focus:border-primary-500 focus:ring-2 focus:ring-primary-100" placeholder="Ali" aria-invalid={!name.trim()} type="text" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} /></div>
            <div className="flex flex-col gap-2"><label htmlFor="email">Email*</label><input id="email" name="email" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-hidden focus:border-primary-500 focus:ring-2 focus:ring-primary-100" placeholder="ali@example.com" autoComplete="email" aria-invalid={email.length > 0 && !/^\S+@\S+\.\S+$/.test(email)} type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2"><label htmlFor="password">Password*</label><input id="password" name="password" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-hidden focus:border-primary-500 focus:ring-2 focus:ring-primary-100" placeholder="create a strong password" autoComplete="new-password" aria-invalid={password.length > 0 && (password.length < 8 || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password))} type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
                <div className="flex items-center gap-2"><div className="h-1 grow overflow-hidden rounded-md bg-gray-200" role="progressbar" aria-valuenow={strength.percentage} aria-valuemin={0} aria-valuemax={100} aria-label={`Password strength: ${strength.label}`}><div className={`h-full ${strength.color} transition-all duration-300 ease-out`} style={{ width: `${strength.percentage}%` }} /></div><span className="min-w-[50px] text-sm font-medium">{strength.label}</span></div>
                <p className="-mt-2 text-xs text-gray-500">Must be at least 8 characters with numbers and symbols</p>
              </div>
            </div>
            <div className="flex flex-col gap-2"><label htmlFor="rePassword">Confirm Password*</label><input id="rePassword" name="rePassword" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-hidden focus:border-primary-500 focus:ring-2 focus:ring-primary-100" placeholder="confirm your password" autoComplete="new-password" aria-invalid={rePassword.length > 0 && password !== rePassword} type="password" required value={rePassword} onChange={(event) => setRePassword(event.target.value)} /></div>
            <div className="flex flex-col gap-2"><label htmlFor="phone">Phone Number*</label><input id="phone" name="phone" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-hidden focus:border-primary-500 focus:ring-2 focus:ring-primary-100" placeholder="+1 234 567 8900" autoComplete="tel" aria-invalid={phone.length > 0 && !/^[+]?[0-9\s()-]{8,}$/.test(phone)} type="tel" required value={phone} onChange={(event) => setPhone(event.target.value)} /></div>
            <div><div className="flex items-center gap-2"><input id="terms" className="size-4 accent-primary-600" type="checkbox" name="terms" required checked={terms} onChange={(event) => setTerms(event.target.checked)} /><label htmlFor="terms" className="ms-2">I agree to the <Link className="text-primary-600 hover:underline" href="/terms">Terms of Service</Link> and <Link className="text-primary-600 hover:underline" href="/privacy">Privacy Policy</Link> *</label></div></div>
            <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className="w-full bg-primary-600 py-3 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50">
              <span className="inline-flex items-center justify-center gap-2"><span aria-hidden="true">＋</span><span>{isSubmitting ? "Creating Account..." : "Create My Account"}</span></span>
            </button>
          </form>

          <p className="my-4 border-t border-gray-300/30 pt-10 text-center">Already have an account? <Link className="font-medium text-primary-600 hover:underline" href="/login">Sign In</Link></p>
        </section>
      </div>
    </main>
  }</AuthRouteGuard>;
}
