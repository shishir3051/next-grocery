"use client";

import { Loader2, ShieldCheck, ShoppingBasket, Bike, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { DEMO_ACCOUNTS, type DemoRole } from "@/lib/demo";
import { useDemoLogin } from "./useDemoLogin";

const OPTIONS: { role: DemoRole; label: string; hint: string; icon: LucideIcon }[] = [
  { role: "admin", label: "Admin demo", hint: "Dashboard, products, orders", icon: ShieldCheck },
  { role: "customer", label: "Customer", hint: "Shop and check out", icon: ShoppingBasket },
  { role: "rider", label: "Rider", hint: "Deliver orders", icon: Bike },
];

/** Server messages the panel shows word for word (rate limit, demo accounts not seeded). */
const SHOWN_ERRORS = /too many demo logins|aren't set up/i;
const GENERIC_ERROR = "The demo login isn't available right now. Please try again.";

/**
 * One-click live-demo logins (admin, customer, rider). Renders nothing unless the server
 * runs with DEMO_MODE=true. The admin demo is the filled button, and it also gets a ring
 * when the visitor came from /admin.
 */
export default function DemoLoginPanel({ highlightAdmin = false }: { highlightAdmin?: boolean }) {
  const { available, login, loadingRole, error: rawError } = useDemoLogin();
  if (!available) return null;

  // NextAuth hands back the server's error text unchanged, e.g. a database error naming the
  // database host, so this public page shows only known messages (as the password form does).
  const error = rawError && (SHOWN_ERRORS.test(rawError) ? rawError : GENERIC_ERROR);
  const busy = loadingRole !== null;
  // Screen readers don't always read the focused button's new label, so announce the sign-in too.
  const opening = loadingRole ? `Opening the ${DEMO_ACCOUNTS[loadingRole].label.toLowerCase()} demo…` : "";

  return (
    <section aria-labelledby="demo-login-title" className="rounded-2xl border border-brand-200 bg-brand-50 p-4 sm:p-5">
      <h2 id="demo-login-title" className="text-sm font-semibold text-brand-900">
        Try the live demo: one click, no password
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-brand-800">
        The demo admin can open every page but changes only demo orders, so try the full flow:
        order as the customer, ship it as the admin, deliver it as the rider.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {OPTIONS.map(({ role, label, hint, icon: Icon }) => {
          const isLoading = loadingRole === role;
          // Filled: the pressed button while it signs in, otherwise the admin demo.
          const emphasise = busy ? isLoading : role === "admin";
          // Came from /admin: ring the admin demo too (not while another demo is opening).
          const highlight = highlightAdmin && role === "admin" && emphasise;
          return (
            <button
              key={role}
              type="button"
              // aria-disabled (not disabled) keeps keyboard focus on the pressed button while it signs in
              aria-disabled={busy || undefined}
              aria-busy={isLoading}
              onClick={() => {
                if (!busy) void login(role);
              }}
              className={cn(
                "flex min-h-11 items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
                emphasise
                  ? "border-brand-600 bg-brand-600 text-white hover:bg-brand-700"
                  : "border-brand-200 bg-white text-slate-800 hover:border-brand-400 hover:bg-brand-50",
                // A soft halo, not an offset ring, so keyboard focus still looks different on it
                highlight && "ring-4 ring-brand-300",
                busy && (isLoading ? "cursor-wait" : "cursor-not-allowed opacity-60")
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
              ) : (
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">{isLoading ? "Opening…" : label}</span>
                <span className={cn("block truncate text-xs", emphasise ? "text-brand-100" : "text-slate-500")}>{hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      <p role="status" aria-live="polite" className={cn("text-sm text-danger-700", error ? "mt-3" : "sr-only")}>
        {error || opening}
      </p>
    </section>
  );
}
