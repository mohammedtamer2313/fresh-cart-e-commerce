"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Clock3, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Star, Truck, UsersRound } from "lucide-react";
import toast from "react-hot-toast";
import { notifyAuthStateChange } from "@/lib/auth-state";
import { submitAuth } from "@/lib/auth";
import { saveSession } from "@/lib/session";
import { signInSchema } from "@/lib/auth-validation";
import AuthRouteGuard from "@/components/AuthRouteGuard";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = signInSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Check your email and password.");
      return;
    }
    setIsSubmitting(true);

    try {
      const result = await submitAuth("signin", validation.data);
      const token = result.token ?? result.data?.token;
      if (!token) throw new Error(result.message ?? "The sign in response did not include an authentication token.");

      const user = result.user ?? result.data?.user;
      saveSession({
        token,
        user: {
          id: user?.id,
          name: user?.name ?? user?.email ?? email,
          email: user?.email ?? email,
        },
      });
      window.localStorage.setItem("rememberMe", String(rememberMe));
      notifyAuthStateChange();

      toast.success(result.message ?? "Signed in successfully.");
      router.replace("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return <AuthRouteGuard access="guest">{
    <main className="container mx-auto px-4 py-16" id="login-section">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <section className="hidden lg:block">
          <div className="space-y-6 text-center">
            <img className="h-96 w-full rounded-2xl object-cover shadow-lg" alt="fresh vegetables and fruits shopping cart illustration, modern clean style, green theme" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/2e5810ff3e-e750761ebcd4ae5907db.png" />
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-800">FreshCart - Your One-Stop Shop for Fresh Products</h2>
              <p className="text-lg text-gray-600">Join thousands of happy customers who trust FreshCart for their daily grocery needs</p>
              <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
                <div className="flex items-center"><Truck size={16} className="mr-2 text-primary-600" aria-hidden="true" />Free Delivery</div>
                <div className="flex items-center"><ShieldCheck size={16} className="mr-2 text-primary-600" aria-hidden="true" />Secure Payment</div>
                <div className="flex items-center"><Clock3 size={16} className="mr-2 text-primary-600" aria-hidden="true" />24/7 Support</div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full">
          <div className="rounded-2xl bg-white p-8 shadow-xl lg:p-12">
            <div className="mb-8 text-center">
              <div className="mb-4 flex items-center justify-center"><span className="text-3xl font-bold text-primary-600">Fresh<span className="text-gray-800">Cart</span></span></div>
              <h1 className="mb-2 text-2xl font-bold text-gray-800">Welcome Back!</h1>
              <p className="text-gray-600">Sign in to continue your fresh shopping experience</p>
            </div>

            <div className="mb-6 space-y-3">
              <button type="button" className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-gray-200 px-4 py-3 transition-all duration-200 hover:border-primary-300 hover:bg-primary-50">
                <svg data-prefix="fab" data-icon="google" className="svg-inline--fa fa-google h-5 w-5 shrink-0 text-red-500" role="img" viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="M500 261.8C500 403.3 403.1 504 260 504 122.8 504 12 393.2 12 256S122.8 8 260 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9c-88.3-85.2-252.5-21.2-252.5 118.2 0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9l-140.8 0 0-85.3 236.1 0c2.3 12.7 3.9 24.9 3.9 41.4z" /></svg>
                <span className="text-sm font-medium text-gray-700">Continue with Google</span>
              </button>
              <button type="button" className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-gray-200 px-4 py-3 transition-all duration-200 hover:border-primary-300 hover:bg-primary-50">
                <svg data-prefix="fab" data-icon="facebook" className="svg-inline--fa fa-facebook h-5 w-5 shrink-0 text-blue-600" role="img" viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="M512 256C512 114.6 397.4 0 256 0S0 114.6 0 256C0 376 82.7 476.8 194.2 504.5l0-170.3-52.8 0 0-78.2 52.8 0 0-33.7c0-87.1 39.4-127.5 125-127.5 16.2 0 44.2 3.2 55.7 6.4l0 70.8c-6-.6-16.5-1-29.6-1-42 0-58.2 15.9-58.2 57.2l0 27.8 83.6 0-14.4 78.2-69.3 0 0 175.9C413.8 494.8 512 386.9 512 256z" /></svg>
                <span className="text-sm font-medium text-gray-700">Continue with Facebook</span>
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-sm"><span className="bg-white px-4 font-medium text-gray-500">OR CONTINUE WITH EMAIL</span></div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">Email Address</label>
                <div className="relative">
                  <input className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pl-12 transition-all focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-100" placeholder="Enter your email" id="email" type="email" name="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Password</label>
                  <Link className="cursor-pointer text-sm font-medium text-primary-600 hover:text-primary-700" href="/forget-password">Forgot Password?</Link>
                </div>
                <div className="relative">
                  <input id="password" className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pl-12 pr-12 transition-all focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-100" placeholder="Enter your password" type={showPassword ? "text" : "password"} name="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
                  <LockKeyhole size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((show) => !show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="rememberMe" className="flex items-center">
                  <input id="rememberMe" className="h-4 w-4 rounded border-2 border-gray-300 accent-primary-600 focus:ring-primary-500" type="checkbox" name="rememberMe" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                  <span className="ml-3 text-sm text-gray-700">Keep me signed in</span>
                </label>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-primary-600 px-4 py-3 text-lg font-semibold text-white shadow-lg transition-all duration-200 hover:bg-primary-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50">
                {isSubmitting ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="mt-8 border-t border-gray-100 pt-6 text-center">
              <p className="text-gray-600">New to FreshCart?<Link className="ms-2 cursor-pointer font-semibold text-primary-600 hover:text-primary-700" href="/signup">Create an account</Link></p>
            </div>

            <div className="mt-6 flex items-center justify-center space-x-6 text-xs text-gray-500">
              <div className="flex items-center"><LockKeyhole size={13} className="mr-1" aria-hidden="true" />SSL Secured</div>
              <div className="flex items-center"><UsersRound size={13} className="mr-1" aria-hidden="true" />50K+ Users</div>
              <div className="flex items-center"><Star size={13} className="mr-1" aria-hidden="true" />4.9 Rating</div>
            </div>
          </div>
        </section>
      </div>
    </main>
  }</AuthRouteGuard>;
}
