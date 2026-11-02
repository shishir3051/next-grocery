"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, Leaf, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";

/** sessionStorage key used to carry the typed email from login to the reset form. */
export const RESET_EMAIL_KEY = "fb-reset-email";

/** Input style for auth forms; left padding leaves room for the field icon. */
export const AUTH_INPUT_CLASS =
  "w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

interface AuthShellProps {
  title: string;
  subtitle: React.ReactNode;
  /** Where the link above the card goes. Defaults to the shop. */
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Tighter spacing and a smaller heading, for multi-field steps that should fit one screen. */
  compact?: boolean;
  /** Id for the subtitle, so a field can reference it with aria-describedby. */
  subtitleId?: string;
}

/**
 * Centered card layout shared by the login and password-reset pages.
 * Auth pages have no global header, so the card carries the brand mark and a way back.
 */
export default function AuthShell({ title, subtitle, backHref = "/", backLabel = "Back to shop", children, footer, compact = false, subtitleId }: AuthShellProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn("min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4", compact ? "py-6" : "py-8")}>
      <div className={cn("w-full", compact ? "max-w-sm" : "max-w-md")}>
        <Link
          href={backHref}
          className={cn(
            "inline-flex h-10 items-center gap-1 rounded-lg px-2 -ml-2 text-sm font-medium text-slate-600 hover:text-brand-700 hover:bg-brand-50 transition-colors",
            compact ? "mb-2" : "mb-4"
          )}
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          {backLabel}
        </Link>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("w-full bg-white rounded-2xl shadow-sm border border-slate-200", compact ? "p-5 sm:p-6" : "p-6 sm:p-8")}
        >
          <div className={cn("text-center", compact ? "mb-5" : "mb-8")}>
            {/* Brand mark (same as the header logo) */}
            <Link href="/" aria-label="FreshBasket home" className={cn("inline-flex items-center gap-2", compact ? "mb-3" : "mb-6")}>
              <span className={cn("rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center shadow-sm", compact ? "w-8 h-8" : "w-9 h-9")}>
                <Leaf size={compact ? 16 : 18} className="text-white" aria-hidden="true" />
              </span>
              <span className={cn("font-black text-slate-900 tracking-tight", compact ? "text-lg" : "text-xl")}>
                Fresh<span className="text-brand-600">Basket</span>
              </span>
            </Link>
            <h1 className={cn("font-bold text-slate-900 tracking-tight", compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl")}>{title}</h1>
            <p id={subtitleId} className={cn("text-sm text-slate-600", compact ? "mt-1" : "mt-2")}>{subtitle}</p>
          </div>

          {children}

          {footer && (
            <div className={cn("border-t border-slate-100 text-center text-sm text-slate-600", compact ? "mt-4 pt-4" : "mt-6 pt-6")}>{footer}</div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

/** Error or success banner for auth forms. */
export function AuthNotice({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  const isError = tone === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div
      role={isError ? "alert" : "status"}
      className={
        isError
          ? "flex items-start gap-2 rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm font-medium text-danger-700"
          : "flex items-start gap-2 rounded-lg border border-success-100 bg-success-50 p-3 text-sm font-medium text-success-700"
      }
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
