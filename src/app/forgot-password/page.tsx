"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, KeyRound, ArrowRight, Eye, EyeOff } from "lucide-react";
import Button from "@/components/ui/Button";
import AuthShell, { AuthNotice, AUTH_INPUT_CLASS, RESET_EMAIL_KEY } from "@/components/auth/AuthShell";

/** Matches OTP_RESEND_COOLDOWN_MS on the server. */
const RESEND_COOLDOWN_SECONDS = 60;
const MIN_PASSWORD_LENGTH = 8;

const LABEL_CLASS = "block text-sm font-medium text-slate-700";
const ICON_CLASS = "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4";

type Step = "request" | "reset";

/**
 * "Forgot password?" flow:
 * 1. Enter your email → we email a 6-digit code (same answer whether or not the account exists).
 * 2. Enter the code and a new password → back to login.
 */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  // Confirms a resend to screen-reader and sighted users (the button label alone is easy to miss).
  const [resent, setResent] = useState(false);
  const subtitleId = useId();

  // Pre-fill the email typed on the login page (passed via sessionStorage, not the URL).
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(RESET_EMAIL_KEY);
      sessionStorage.removeItem(RESET_EMAIL_KEY);
      if (saved) setEmail(saved);
    } catch { /* storage unavailable */ }
  }, []);

  // Count down until another code may be requested.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const requestCode = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't send the code. Please try again.");
        return;
      }
      setResent(step === "reset");
      setStep("reset");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    requestCode();
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Your new password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("The two passwords don't match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't reset your password. Please try again.");
        return;
      }
      router.push("/login?reset=success");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const useDifferentEmail = () => {
    setStep("request");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setResent(false);
  };

  if (step === "request") {
    return (
      <AuthShell
        compact
        title="Reset your password"
        subtitle="Enter your account email and we'll send you a 6-digit code."
        backHref="/login"
        backLabel="Back to log in"
      >
        <form onSubmit={handleRequest} className="space-y-4">
          {error && <AuthNotice tone="error">{error}</AuthNotice>}

          <div className="space-y-1.5">
            <label htmlFor="reset-email" className={LABEL_CLASS}>Email address</label>
            <div className="relative">
              <Mail className={ICON_CLASS} aria-hidden="true" />
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className={AUTH_INPUT_CLASS}
              />
            </div>
          </div>

          <Button type="submit" fullWidth loading={isLoading}>
            {isLoading ? "Sending code…" : (
              <>
                Send code
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      compact
      title="Choose a new password"
      subtitle={
        // Same wording whether or not the account exists (no account discovery).
        <>
          If <span className="font-semibold text-slate-800 break-all">{email}</span> has an account, we&apos;ve sent it a 6-digit code.{" "}
          <button type="button" onClick={useDifferentEmail} aria-label="Change email address" className="font-semibold text-brand-700 hover:underline">
            Change
          </button>
        </>
      }
      backHref="/login"
      backLabel="Back to log in"
      subtitleId={subtitleId}
    >
      <form onSubmit={handleReset} className="space-y-4" noValidate>
        {error && <AuthNotice tone="error">{error}</AuthNotice>}

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="reset-code" className={LABEL_CLASS}>6-digit code</label>
            <button
              type="button"
              // aria-disabled (not disabled) keeps keyboard focus on the button during the cooldown
              onClick={() => { if (cooldown <= 0 && !isLoading) requestCode(); }}
              aria-disabled={cooldown > 0 || isLoading || undefined}
              className="text-xs font-semibold text-brand-700 hover:underline aria-disabled:text-slate-500 aria-disabled:no-underline aria-disabled:cursor-not-allowed"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
          <div className="relative">
            <KeyRound className={ICON_CLASS} aria-hidden="true" />
            <input
              id="reset-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              aria-describedby={`${subtitleId} reset-code-help`}
              className={`${AUTH_INPUT_CLASS} tracking-[0.3em] font-semibold tabular-nums`}
            />
          </div>
          <p id="reset-code-help" className="sr-only">The code expires after 10 minutes.</p>
          <p role="status" className="text-xs text-success-700">
            {resent ? `If ${email} has an account, we've sent it a new code.` : ""}
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reset-password" className={LABEL_CLASS}>New password</label>
          <div className="relative">
            <Lock className={ICON_CLASS} aria-hidden="true" />
            <input
              id="reset-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={`${AUTH_INPUT_CLASS} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              aria-label="Show passwords"
              aria-pressed={showPassword}
              className="absolute right-1 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="reset-password-confirm" className={LABEL_CLASS}>Confirm new password</label>
          <div className="relative">
            <Lock className={ICON_CLASS} aria-hidden="true" />
            <input
              id="reset-password-confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Type it again"
              className={AUTH_INPUT_CLASS}
            />
          </div>
        </div>

        <Button type="submit" fullWidth loading={isLoading} disabled={otp.length !== 6}>
          {isLoading ? "Saving…" : "Reset password"}
        </Button>
      </form>
    </AuthShell>
  );
}
