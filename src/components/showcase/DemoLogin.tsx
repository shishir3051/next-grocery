"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useDemoLogin } from "@/components/auth/useDemoLogin";
import { DEMO_ACCOUNTS, type DemoRole } from "@/lib/demo";
import { cn } from "@/lib/cn";
import type { Tone } from "./primitives";

type DemoLoginState = {
  available: boolean;
  loadingRole: DemoRole | null;
  error: string;
  /** The part of the page whose button started the current login: only its status line speaks. */
  source: string | null;
  start: (role: DemoRole, source: string) => void;
};

const DemoLoginContext = createContext<DemoLoginState | null>(null);

/**
 * Shares one useDemoLogin() between every demo button on the page: a single providers
 * request, and while one account is signing in, every other demo button is disabled.
 */
export function DemoLoginProvider({ children }: { children: React.ReactNode }) {
  const { available, login, loadingRole, error } = useDemoLogin();
  const [source, setSource] = useState<string | null>(null);

  const start = (role: DemoRole, from: string) => {
    setSource(from);
    void login(role);
  };

  return (
    <DemoLoginContext.Provider value={{ available, loadingRole, error, source, start }}>
      {children}
    </DemoLoginContext.Provider>
  );
}

type DemoButtonProps = {
  role: DemoRole;
  /** Which part of the page the button sits in; the DemoLoginStatus with the same source reports on it. */
  source: string;
  className?: string;
  /** Leading icon, passed as an element so server components can render it. A spinner replaces it while signing in. */
  icon?: React.ReactNode;
  children: React.ReactNode;
};

/**
 * One-click sign-in to a live-demo account; useDemoLogin() then opens that role's home page.
 *
 * Always a link to /login, so the page works before demo logins are known to be available
 * (and if they never are). Once they are, a plain click signs in instead. The element never
 * changes type, so keyboard and screen-reader focus stays on it when that happens. Clicks
 * meant for a new tab or window still open /login.
 */
export function DemoButton({ role, source, className, icon, children }: DemoButtonProps) {
  const context = useContext(DemoLoginContext);
  const demo = context?.available ? context : null;

  // Several buttons share a role (four open the admin demo), so the spinner goes only on the
  // one that was clicked: same role and same part of the page. All the others are disabled.
  const busy = demo !== null && demo.loadingRole !== null;
  const loading = demo !== null && demo.loadingRole === role && demo.source === source;

  function onClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!demo || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (!busy) demo.start(role, source);
  }

  return (
    <Link
      href="/login"
      prefetch={false}
      // aria-disabled (not removing the link) keeps keyboard focus on it while it works
      aria-disabled={busy || undefined}
      onClick={onClick}
      className={cn(className, busy && (loading ? "cursor-wait" : "cursor-not-allowed opacity-60"))}
    >
      {loading ? <LoaderCircle className="size-4 shrink-0 animate-spin" aria-hidden="true" /> : icon}
      {loading ? "Opening…" : children}
    </Link>
  );
}

/**
 * Polite live region below a group of demo buttons. It announces the sign-in to screen
 * readers and shows the error, if any, to everyone.
 */
export function DemoLoginStatus({ source, tone = "light", className }: { source: string; tone?: Tone; className?: string }) {
  const demo = useContext(DemoLoginContext);
  const mine = demo !== null && demo.source === source;
  const error = mine && demo ? demo.error : "";
  const opening =
    mine && demo && !demo.error && demo.loadingRole
      ? `Opening the ${DEMO_ACCOUNTS[demo.loadingRole].label.toLowerCase()} demo…`
      : "";

  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        error ? "mt-3 text-sm font-medium" : "sr-only",
        tone === "dark" ? "text-danger-200" : "text-danger-700",
        className,
      )}
    >
      {error || opening}
    </p>
  );
}
