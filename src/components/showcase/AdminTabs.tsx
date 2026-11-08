"use client";

import { useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { BrowserFrame } from "./DeviceFrames";
import { FOCUS_LIGHT } from "./primitives";

const SCREENS = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/admin",
    src: "/showcase/admin-dashboard.webp",
    alt: "FreshBasket admin dashboard with a 7-day sales chart and store stats",
    caption: "Sales of the last 7 days, order and user counts, low-stock products and the latest orders.",
  },
  {
    key: "orders",
    label: "Orders",
    path: "/admin/orders",
    src: "/showcase/admin-orders.webp",
    alt: "FreshBasket admin orders table with order status, payment status and totals",
    caption: "Move each order from pending to delivered, and assign a delivery rider.",
  },
  {
    key: "products",
    label: "Products",
    path: "/admin/products",
    src: "/showcase/admin-products.webp",
    alt: "FreshBasket admin products table",
    caption: "Add and edit products, prices and stock, with image upload or download from a URL.",
  },
  {
    key: "messages",
    label: "Messages",
    path: "/admin/messages",
    src: "/showcase/admin-messages.webp",
    alt: "FreshBasket admin inbox of customer messages from the contact form",
    caption: "Read contact-form messages and reply by email without leaving the panel.",
  },
] as const;

// Below lg the frame spans the whole Container: the viewport minus its 24px (sm+) or 16px gutters.
const SIZES =
  "(min-width: 1280px) 800px, (min-width: 1024px) 62vw, (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)";

/**
 * Admin screenshots behind accessible tabs (WAI-ARIA tabs pattern): arrow keys, Home and End
 * move between tabs. All panels stay mounted and cross-fade, so switching is instant.
 */
export default function AdminTabs() {
  const baseId = useId();
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function selectAndFocus(index: number) {
    const next = (index + SCREENS.length) % SCREENS.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number;
    if (event.key === "ArrowRight") next = index + 1;
    else if (event.key === "ArrowLeft") next = index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = SCREENS.length - 1;
    else return;
    event.preventDefault();
    selectAndFocus(next);
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Admin screens"
        className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 ring-1 ring-inset ring-slate-200 sm:inline-flex"
      >
        {SCREENS.map((screen, index) => {
          const selected = index === active;
          return (
            <button
              key={screen.key}
              ref={node => {
                tabRefs.current[index] = node;
              }}
              id={`${baseId}-tab-${screen.key}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${screen.key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={event => onKeyDown(event, index)}
              className={cn(
                "min-h-11 cursor-pointer rounded-lg! px-4 text-sm font-semibold transition-colors duration-200",
                FOCUS_LIGHT,
                "focus-visible:ring-offset-slate-100",
                selected ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:bg-white/70 hover:text-slate-900",
              )}
            >
              {screen.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid">
        {SCREENS.map((screen, index) => {
          const selected = index === active;
          return (
            <div
              key={screen.key}
              id={`${baseId}-panel-${screen.key}`}
              role="tabpanel"
              aria-labelledby={`${baseId}-tab-${screen.key}`}
              tabIndex={selected ? 0 : -1}
              className={cn(
                "col-start-1 row-start-1 rounded-xl! transition-[opacity,visibility] duration-300",
                FOCUS_LIGHT,
                selected ? "visible opacity-100" : "invisible opacity-0",
              )}
            >
              <BrowserFrame path={screen.path} src={screen.src} alt={screen.alt} sizes={SIZES} />
              <p className="mt-4 text-base leading-relaxed text-slate-600">{screen.caption}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
