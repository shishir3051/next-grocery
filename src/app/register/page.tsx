"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, CheckCircle2, ChevronLeft, Leaf, AlertCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import Button from "@/components/ui/Button";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

// Shared input style from docs/design/DESIGN_SYSTEM.md (left padding leaves room for the icon)
const INPUT_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";
const ICON_CLASS = "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4";
const LABEL_CLASS = "block text-sm font-medium text-slate-700";

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "An error occurred");
      } else if (data.requireOtp) {
        setSuccessMsg("OTP has been sent to your email.");
        setStep(2);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid OTP");
        setIsLoading(false);
      } else {
        // Auto sign in after successful verification
        setSuccessMsg("Email verified! Logging you in...");
        const signInRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (signInRes?.ok) {
           router.push("/");
           router.refresh();
        } else {
           setError("Auto-login failed. Please go to Login page.");
           setIsLoading(false);
        }
      }
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  // Step forms slide in/out; with reduced motion they simply swap.
  const stepMotion = reduceMotion
    ? { initial: false as const }
    : { initial: { opacity: 0, x: -16 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 16 } };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Auth pages have no global header, so give users a clear way back */}
        <Link
          href="/"
          className="mb-4 inline-flex h-10 items-center gap-1 rounded-lg px-2 -ml-2 text-sm font-medium text-slate-600 hover:text-brand-700 hover:bg-brand-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          Back to shop
        </Link>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8"
        >
          <div className="text-center mb-8">
            {/* Brand mark (same as the header logo) */}
            <Link href="/" aria-label="FreshBasket home" className="inline-flex items-center gap-2 mb-6">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center shadow-sm">
                <Leaf size={18} className="text-white" aria-hidden="true" />
              </span>
              <span className="text-xl font-black text-slate-900 tracking-tight">
                Fresh<span className="text-brand-600">Basket</span>
              </span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {step === 1 ? "Create your account" : "Check your email"}
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              {step === 1 ? "Fresh groceries delivered to your door" : "Enter the code we sent to verify your email"}
            </p>
            {/* Simple step indicator so users know where they are in the 2-step flow */}
            <p className="mt-3 text-xs font-medium text-slate-500">Step {step} of 2</p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm font-medium text-danger-700"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="mb-5 flex items-start gap-2 rounded-lg border border-success-100 bg-success-50 p-3 text-sm font-medium text-success-700"
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              {successMsg}
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            {step === 1 ? (
              <motion.form
                key="step1"
                {...stepMotion}
                onSubmit={handleRegister}
                className="space-y-5"
              >
                <GoogleSignInButton label="Sign up with Google" />

                <div className="space-y-1.5">
                  <label htmlFor="register-name" className={LABEL_CLASS}>Full name</label>
                  <div className="relative">
                    <User className={ICON_CLASS} aria-hidden="true" />
                    <input
                      id="register-name"
                      type="text"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="register-email" className={LABEL_CLASS}>Email address</label>
                  <div className="relative">
                    <Mail className={ICON_CLASS} aria-hidden="true" />
                    <input
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="register-password" className={LABEL_CLASS}>Password</label>
                  <div className="relative">
                    <Lock className={ICON_CLASS} aria-hidden="true" />
                    <input
                      id="register-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      aria-describedby="register-password-hint"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className={INPUT_CLASS}
                    />
                  </div>
                  <p id="register-password-hint" className="text-xs text-slate-500">
                    Use at least 8 characters.
                  </p>
                </div>

                <Button type="submit" size="lg" fullWidth loading={isLoading}>
                  {isLoading ? "Sending code…" : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="step2"
                {...stepMotion}
                onSubmit={handleVerifyOtp}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <label htmlFor="register-otp" className="block text-center text-sm font-medium text-slate-700">
                    6-digit verification code
                  </label>
                  <input
                    id="register-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    maxLength={6}
                    aria-describedby="register-otp-hint"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full rounded-lg border border-slate-300 bg-white py-3 text-center text-2xl font-semibold tracking-[0.5em] text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                  <p id="register-otp-hint" className="text-xs text-slate-500 text-center">
                    Sent to <span className="font-medium text-slate-700">{email}</span>
                  </p>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  disabled={isLoading || otp.length < 6}
                >
                  {isLoading ? "Verifying…" : (
                    <>
                      Verify &amp; log in
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-slate-600">
                  Didn&apos;t get the code?{" "}
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={handleRegister}
                    className="inline-flex h-10 items-center rounded-lg px-1 font-semibold text-brand-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Resend code
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>

          {step === 1 && (
            <p className="mt-6 pt-6 border-t border-slate-100 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-brand-700 hover:underline">
                Log in
              </Link>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
