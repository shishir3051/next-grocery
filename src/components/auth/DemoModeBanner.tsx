"use client";

import { useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Info } from "lucide-react";
import { DEMO_READ_ONLY_HEADER, DEMO_READ_ONLY_MESSAGE } from "@/lib/demo";

const COPY = {
  admin: "You're exploring the live demo as the admin. Every page is real, but changes are turned off, except for demo orders: assign one to the Demo Rider, then deliver it as the rider.",
  rider: "You're in the live demo as the rider. Orders the demo admin assigns to you appear here; mark them delivered to finish the flow.",
} as const;

// Phones get one short line so the banner doesn't push the page content down.
const SHORT_COPY: Record<keyof typeof COPY, string> = {
  admin: "Live demo: changes are off, except for demo orders.",
  rider: "Live demo: deliver the orders the demo admin assigns to you.",
};

/**
 * Shown to live-demo accounts in the admin panel and rider app. While mounted it also
 * explains blocked changes: any API answer marked "read-only demo" shows one clear toast
 * (the pages' own error toasts are generic).
 */
export default function DemoModeBanner({ area }: { area: keyof typeof COPY }) {
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args);
      if (response.status === 403 && response.headers.get(DEMO_READ_ONLY_HEADER)) {
        toast(DEMO_READ_ONLY_MESSAGE, { id: "demo-read-only", duration: 5000 });
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <div role="note" className="mb-3 flex items-start gap-2.5 rounded-lg border border-accent-200 bg-accent-50 px-3 py-2 text-sm text-accent-800">
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="leading-relaxed">
        <span className="sm:hidden">{SHORT_COPY[area]}</span>
        <span className="hidden sm:inline">{COPY[area]}</span>{" "}
        <Link href="/showcase" className="font-semibold underline underline-offset-2 hover:text-accent-700">
          About this product
        </Link>
      </p>
    </div>
  );
}
