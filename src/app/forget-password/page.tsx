"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Check, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import {
  forgotPasswordSchema,
  resetCodeSchema,
  resetPasswordSchema,
} from "@/lib/auth-validation";

type ResetStep = 1 | 2 | 3 | 4;
type BusyAction = "email" | "verify" | "resend" | "reset" | null;

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "https://ecommerce.routemisr.com/api/v1").replace(/\/$/, "");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function requestPasswordApi(
  endpoint: "forgotPasswords" | "verifyResetCode" | "resetPassword",
  method: "POST" | "PUT",
  payload: Record<string, string>,
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  const message = isRecord(body) && typeof body.message === "string" ? body.message : undefined;
  if (!response.ok) throw new Error(message ?? "Unable to complete your request. Please try again.");
  return message ?? "Request completed successfully.";
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<ResetStep>(1);
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState<BusyAction>(null);

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }

    setBusy("email");
    try {
      setEmail(validation.data.email);
      const message = await requestPasswordApi("forgotPasswords", "POST", validation.data);
      toast.success(message);
      setStep(2);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send a reset code.");
    } finally {
      setBusy(null);
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = resetCodeSchema.safeParse({ resetCode });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Enter the 6-digit code.");
      return;
    }

    setBusy("verify");
    try {
      const message = await requestPasswordApi("verifyResetCode", "POST", validation.data);
      toast.success(message);
      setStep(3);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to verify the reset code.");
    } finally {
      setBusy(null);
    }
  }

  async function handleResendCode() {
    setBusy("resend");
    try {
      const message = await requestPasswordApi("forgotPasswords", "POST", { email });
      toast.success(message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to resend the reset code.");
    } finally {
      setBusy(null);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = resetPasswordSchema.safeParse({ newPassword, confirmPassword });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message ?? "Check your new password.");
      return;
    }

    setBusy("reset");
    try {
      const message = await requestPasswordApi("resetPassword", "PUT", {
        email,
        newPassword: validation.data.newPassword,
      });
      toast.success(message);
      setStep(4);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reset your password.");
    } finally {
      setBusy(null);
    }
  }

  const isSuccess = step === 4;
  const progressStep = isSuccess ? 3 : step;
  const progressItems = [
    { label: "Email", icon: Mail },
    { label: "Verify", icon: KeyRound },
    { label: "Reset", icon: LockKeyhole },
  ];

  return (
    <div className="container mx-auto px-4 py-16" id="forgot-password-section">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <section className="hidden lg:block">
          <div className="space-y-6 text-center">
            <div className="relative flex h-96 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary-50 via-green-50 to-emerald-50 shadow-lg" aria-hidden="true">
              <div className="absolute left-8 top-8 h-24 w-24 rounded-full bg-primary-100/50" />
              <div className="absolute bottom-12 right-10 h-32 w-32 rounded-full bg-green-100/50" />
              <div className="absolute right-20 top-20 h-16 w-16 rounded-full bg-emerald-100/50" />
              <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="relative flex h-28 w-28 rotate-3 items-center justify-center rounded-3xl bg-white shadow-xl transition-transform duration-300 hover:rotate-0">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
                    <LockKeyhole className="h-10 w-10" strokeWidth={2.2} />
                  </div>
                  <div className="absolute -left-16 top-4 flex h-14 w-14 -rotate-12 items-center justify-center rounded-xl bg-white text-primary-500 shadow-lg">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div className="absolute -right-16 top-8 flex h-14 w-14 rotate-12 items-center justify-center rounded-xl bg-white text-green-500 shadow-lg">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="h-3 w-3 animate-pulse rounded-full bg-primary-400" />
                  <span className="h-3 w-3 animate-pulse rounded-full bg-primary-500 [animation-delay:150ms]" />
                  <span className="h-3 w-3 animate-pulse rounded-full bg-primary-600 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-800">Reset Your Password</h2>
              <p className="text-lg text-gray-600">Don&apos;t worry, it happens to the best of us. We&apos;ll help you get back into your account in no time.</p>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
                <span className="flex items-center"><Mail size={16} className="mr-2 text-primary-600" aria-hidden="true" />Email Verification</span>
                <span className="flex items-center"><ShieldCheck size={16} className="mr-2 text-primary-600" aria-hidden="true" />Secure Reset</span>
                <span className="flex items-center"><LockKeyhole size={16} className="mr-2 text-primary-600" aria-hidden="true" />Encrypted</span>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full">
          <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8 lg:p-12">
            <div className="mb-8 text-center">
              <div className="mb-4 flex items-center justify-center"><span className="text-3xl font-bold text-primary-600">Fresh<span className="text-gray-800">Cart</span></span></div>
              {isSuccess ? (
                <>
                  <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600"><Check size={32} strokeWidth={3} aria-hidden="true" /></span>
                  <h1 className="mb-2 text-2xl font-bold text-gray-800">Password Reset!</h1>
                  <p className="text-gray-600">Your password has been updated successfully. You can now sign in with your new password.</p>
                </>
              ) : (
                <>
                  <h1 className="mb-2 text-2xl font-bold text-gray-800">
                    {step === 1 ? "Forgot Password?" : step === 2 ? "Check Your Email" : "Create New Password"}
                  </h1>
                  <p className="text-gray-600">
                    {step === 1 && "No worries, we'll send you a reset code"}
                    {step === 2 && <>Enter the 6-digit code sent to <span className="font-medium text-gray-800">{email}</span>.</>}
                    {step === 3 && "Choose a strong password for your FreshCart account."}
                  </p>
                </>
              )}
            </div>

            <div className="mb-8 flex items-center justify-center" role="group" aria-label={`Password reset step ${progressStep} of 3`}>
              {progressItems.map((item, index) => {
                const currentStep = index + 1;
                const isComplete = progressStep > currentStep;
                const isCurrent = progressStep === currentStep;
                const StepIcon = item.icon;

                return (
                  <div key={item.label} className="flex items-center">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${isCurrent ? "bg-primary-600 text-white ring-4 ring-primary-100" : isComplete ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-400"}`} aria-current={isCurrent ? "step" : undefined}>
                      <StepIcon size={15} aria-hidden="true" />
                    </div>
                    {index < progressItems.length - 1 && <div className={`mx-2 h-0.5 w-10 transition-all duration-300 sm:w-16 ${isComplete ? "bg-primary-400" : "bg-gray-200"}`} />}
                  </div>
                );
              })}
            </div>

            {isSuccess ? (
              <Link href="/login" className="flex w-full items-center justify-center rounded-xl bg-primary-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-primary-700">Back to Sign In</Link>
            ) : step === 1 ? (
              <form className="space-y-6" onSubmit={handleSendCode}>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">Email Address</label>
                  <div className="relative">
                    <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pl-12 transition-all focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-100" />
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  </div>
                </div>
                <button type="submit" disabled={busy !== null} className="w-full rounded-xl bg-primary-600 px-4 py-3 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {busy === "email" ? "Sending..." : "Send Reset Code"}
                </button>
                <div className="text-center"><Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"><ArrowLeft size={14} aria-hidden="true" />Back to Sign In</Link></div>
              </form>
            ) : step === 2 ? (
              <form className="space-y-6" onSubmit={handleVerifyCode}>
                <div>
                  <label htmlFor="resetCode" className="mb-2 block text-sm font-semibold text-gray-700">Verification Code</label>
                  <input id="resetCode" name="resetCode" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={resetCode} onChange={(event) => setResetCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter your 6-digit code" className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-center text-lg tracking-[0.4em] transition-all focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-100" />
                </div>
                <button type="submit" disabled={busy !== null} className="w-full rounded-xl bg-primary-600 px-4 py-3 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {busy === "verify" ? "Verifying..." : "Verify Code"}
                </button>
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-sm text-gray-600">
                  <span>Didn’t receive a code?</span>
                  <button type="button" disabled={busy !== null} onClick={handleResendCode} className="font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-60">
                    {busy === "resend" ? "Sending..." : "Resend Code"}
                  </button>
                </div>
                <button type="button" onClick={() => setStep(1)} className="w-full text-center text-sm font-medium text-gray-500 hover:text-primary-600">Change email address</button>
              </form>
            ) : (
              <form className="space-y-6" onSubmit={handleResetPassword}>
                <div>
                  <label htmlFor="newPassword" className="mb-2 block text-sm font-semibold text-gray-700">New Password</label>
                  <div className="relative">
                    <input id="newPassword" name="newPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Enter a new password" className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-12 transition-all focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-100" />
                    <button type="button" aria-label={showPassword ? "Hide new password" : "Show new password"} onClick={() => setShowPassword((visible) => !visible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-semibold text-gray-700">Confirm Password</label>
                  <div className="relative">
                    <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm your new password" className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 pr-12 transition-all focus:border-primary-500 focus:outline-hidden focus:ring-2 focus:ring-primary-100" />
                    <button type="button" aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"} onClick={() => setShowConfirmPassword((visible) => !visible)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showConfirmPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button>
                  </div>
                </div>
                <p className="-mt-3 text-xs text-gray-500">Use at least 8 characters, including a number and a symbol.</p>
                <button type="submit" disabled={busy !== null} className="w-full rounded-xl bg-primary-600 px-4 py-3 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {busy === "reset" ? "Resetting Password..." : "Reset Password"}
                </button>
              </form>
            )}

            {!isSuccess && <div className="mt-8 border-t border-gray-100 pt-6 text-center"><p className="text-gray-600">Remember your password? <Link href="/login" className="font-semibold text-primary-600 transition-colors hover:text-primary-700">Sign In</Link></p></div>}
          </div>
        </section>
      </div>
    </div>
  );
}
