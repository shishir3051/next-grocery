"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

/**
 * Shows the global header on every storefront, content and account page.
 * The home page renders its own (stateful) Navbar, and checkout, auth,
 * admin and delivery keep their focused layouts.
 */
const HIDDEN_ON = ["/", "/login", "/register", "/forgot-password", "/checkout"];
// /showcase is the product landing page of the live demo; it has its own nav.
const HIDDEN_PREFIXES = ["/admin", "/delivery", "/showcase"];

export default function SiteHeader() {
  const pathname = usePathname() ?? "/";
  if (HIDDEN_ON.includes(pathname) || HIDDEN_PREFIXES.some(p => pathname.startsWith(p))) return null;

  return (
    <>
      <Navbar />
      {/* Spacer so page content starts below the fixed header */}
      <div aria-hidden="true" className="shrink-0" style={{ height: "var(--navbar-height)" }} />
    </>
  );
}
