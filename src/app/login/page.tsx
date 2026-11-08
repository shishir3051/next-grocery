"use client";

import { useEffect, useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import AuthShell, { AuthNotice, AUTH_INPUT_CLASS, RESET_EMAIL_KEY } from "@/components/auth/AuthShell";
import GoogleSignInButton, { GOOGLE_ERRORS } from "@/components/auth/GoogleSignInButton";
import DemoLoginPanel from "@/components/auth/DemoLoginPanel";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Sent here from /admin (e.g. a reviewer opening the admin panel): highlight the admin demo.
  const [cameFromAdmin, setCameFromAdmin] = useState(false);
  const router = useRouter();

  // After a password reset the reset page sends the user here with ?reset=success;
  // a failed Google sign-in comes back with ?error=<code>.
  // Read once on mount: window.location isn't available during server rendering, and
  // useSearchParams would force a Suspense boundary around the whole page.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL on mount
    setCameFromAdmin(params.get("callbackUrl")?.startsWith("/admin") ?? false);
    if (params.get("reset") === "success") {
      setNotice("Your password has been reset. Log in with your new password.");
    }
    const oauthError = params.get("error");
    if (oauthError) setError(GOOGLE_ERRORS[oauthError] ?? "Sign-in failed. Please try again.");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setNotice("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        // Show the server's message for lockouts and unverified accounts; otherwise generic.
        setError(/too many|verify your email/i.test(res.error) ? res.error : "Invalid email or password");
      } else {
        const session = await getSession();
        if (session?.user?.role === 'admin') {
          router.push("/admin");
        } else if (session?.user?.role === 'delivery') {
          router.push("/delivery");
        } else {
          router.push("/");
        }
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to manage your orders and profile"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-brand-700 hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <DemoLoginPanel highlightAdmin={cameFromAdmin} />

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        {notice && <AuthNotice tone="success">{notice}</AuthNotice>}
        {error && <AuthNotice tone="error">{error}</AuthNotice>}

        <GoogleSignInButton />

        <div className="space-y-1.5">
          <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden="true" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className={AUTH_INPUT_CLASS}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <Link
              href="/forgot-password"
              // Pre-fill the reset form without putting the email in the URL (history, logs)
              onClick={() => { try { sessionStorage.setItem(RESET_EMAIL_KEY, email); } catch { /* storage unavailable */ } }}
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden="true" />
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className={AUTH_INPUT_CLASS}
            />
          </div>
        </div>

        <Button type="submit" size="lg" fullWidth loading={isLoading}>
          {isLoading ? "Logging in…" : (
            <>
              Log in
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
