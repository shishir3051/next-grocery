import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cn } from "@/lib/cn";
import { isDemoModeEnabled } from "@/lib/demo";
import { FOCUS_LIGHT } from "@/components/showcase/primitives";
import ShowcaseNav from "@/components/showcase/ShowcaseNav";
import { DemoLoginProvider } from "@/components/showcase/DemoLogin";
import Hero from "@/components/showcase/Hero";
import AppsSection from "@/components/showcase/AppsSection";
import FeaturesSection from "@/components/showcase/FeaturesSection";
import CheckoutSection from "@/components/showcase/CheckoutSection";
import AiSearchSection from "@/components/showcase/AiSearchSection";
import AdminSection from "@/components/showcase/AdminSection";
import OrderFlowSection from "@/components/showcase/OrderFlowSection";
import SecuritySection from "@/components/showcase/SecuritySection";
import TechSection from "@/components/showcase/TechSection";
import IncludedSection from "@/components/showcase/IncludedSection";
import AiReadySection from "@/components/showcase/AiReadySection";
import ScreenGallery from "@/components/showcase/ScreenGallery";
import ClosingCta from "@/components/showcase/ClosingCta";
import ShowcaseFooter from "@/components/showcase/ShowcaseFooter";

/**
 * /showcase: the product landing page for buyers of the source code (founders, agencies,
 * developers). It exists only on the public live-demo deployment (DEMO_MODE=true), next to
 * the one-click demo logins it links to.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FreshBasket — Grocery E-commerce Platform (Next.js source code)",
  description:
    "Full source code of a grocery e-commerce platform for Bangladesh: a storefront with AI search, checkout with cash on delivery, wallet and SSLCommerz, an admin panel and a delivery-rider app, built with Next.js 16 and MongoDB.",
};

const DEFAULT_BUY_URL = "https://vibe96.com";

/** Only http(s) links reach the page, so a mistyped DEMO_BUY_URL can never become a script URL. */
function isWebUrl(value: string) {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

export default function ShowcasePage() {
  if (!isDemoModeEnabled()) notFound();

  const configuredBuyUrl = process.env.DEMO_BUY_URL || DEFAULT_BUY_URL;
  const buyUrl = isWebUrl(configuredBuyUrl) ? configuredBuyUrl : DEFAULT_BUY_URL;

  return (
    <div className="bg-background text-slate-900">
      <a
        href="#content"
        className={cn(
          "fixed left-4 top-4 z-[60] inline-flex min-h-11 -translate-y-[200%] items-center rounded-xl! bg-white px-4 text-sm font-semibold text-brand-800 shadow-lg transition-transform focus:translate-y-0",
          FOCUS_LIGHT,
        )}
      >
        Skip to content
      </a>

      <ShowcaseNav buyUrl={buyUrl} />

      <DemoLoginProvider>
        {/* Focusable only as the skip link's target; outline-none! beats the global focus outline */}
        <main id="content" tabIndex={-1} className="outline-none!">
          <Hero />
          <AppsSection />
          <FeaturesSection />
          <CheckoutSection />
          <AiSearchSection />
          <AdminSection />
          <OrderFlowSection />
          <SecuritySection />
          <TechSection />
          <IncludedSection />
          <AiReadySection />
          <ScreenGallery />
          <ClosingCta buyUrl={buyUrl} />
        </main>
      </DemoLoginProvider>

      <ShowcaseFooter />
    </div>
  );
}
