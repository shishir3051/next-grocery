"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import Logo from "./Logo";
import { FOCUS_DARK, FOCUS_LIGHT, NewTabNote } from "./primitives";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#apps", label: "Apps" },
  { href: "#admin", label: "Admin" },
  { href: "#security", label: "Security" },
  { href: "#tech", label: "Tech" },
  { href: "#included", label: "Included" },
] as const;

/** h-16: the bar's height. The page's scroll padding (set below) keeps this much free at the top. */
const BAR_HEIGHT = 64;

/** Tailwind's lg breakpoint, where the section links move from the menu into the bar. */
const DESKTOP_QUERY = "(min-width: 64rem)";

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  window.addEventListener("resize", onChange);
  return () => {
    window.removeEventListener("scroll", onChange);
    window.removeEventListener("resize", onChange);
  };
}

/** Is the dark hero (#top) still behind the bar? Then the bar stays dark and see-through. */
function isOverHero() {
  const hero = document.getElementById("top");
  return hero ? hero.getBoundingClientRect().bottom > BAR_HEIGHT : false;
}

function isScrolled() {
  return window.scrollY > 8;
}

// Radii are marked important (!) so the global focus rule can't square them off; see primitives.tsx.
const BUTTON_SMALL =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl! px-4 text-sm font-semibold transition-colors duration-300";

/**
 * Sticky top bar of the landing page. Dark and translucent over the hero, solid white with a
 * border once the hero has scrolled away. Below lg the section links fold into a menu button.
 * Escape closes the menu and returns focus to the button; a click or Tab outside the bar, or
 * widening the window to lg, closes it too.
 */
export default function ShowcaseNav({ buyUrl }: { buyUrl: string }) {
  const overHero = useSyncExternalStore(subscribe, isOverHero, () => true);
  const scrolled = useSyncExternalStore(subscribe, isScrolled, () => false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const dark = overHero && !menuOpen;
  const focus = dark ? FOCUS_DARK : FOCUS_LIGHT;

  // While this page is open:
  // - Scroll padding as tall as the bar, so anchor jumps and keyboard focus (Tab, Shift+Tab)
  //   never leave their target hidden behind it (WCAG 2.4.11, technique C43).
  // - Smooth scrolling for in-page links, switched on only when one is clicked, so route changes
  //   never animate. globals.css turns it off again for visitors who prefer reduced motion.
  // A layout effect, so the cleanup runs before Next.js scrolls the next page into place.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    const previousPadding = root.style.scrollPaddingTop;
    root.style.scrollPaddingTop = "4rem"; // h-16, in rem so it grows with the bar when text is enlarged
    const onClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('a[href^="#"]')) {
        root.style.scrollBehavior = "smooth";
      }
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      root.style.scrollBehavior = previousBehavior;
      root.style.scrollPaddingTop = previousPadding;
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const header = headerRef.current;
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !header?.contains(event.target)) setMenuOpen(false);
    };
    // Tabbing past the last item: close, so the open panel can't cover the control that gets focus.
    const onFocusOut = (event: FocusEvent) => {
      if (event.relatedTarget instanceof Node && !header?.contains(event.relatedTarget)) setMenuOpen(false);
    };
    // From lg up the button and panel are hidden, so a menu left open would only keep the bar white.
    const onBreakpoint = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    header?.addEventListener("focusout", onFocusOut);
    desktop.addEventListener("change", onBreakpoint);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      header?.removeEventListener("focusout", onFocusOut);
      desktop.removeEventListener("change", onBreakpoint);
    };
  }, [menuOpen]);

  const linkClass = cn(
    "inline-flex min-h-11 items-center rounded-lg! px-3 text-sm font-medium transition-colors duration-300",
    focus,
    dark ? "text-slate-200 hover:bg-white/10 hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  );

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300",
        dark
          ? scrolled
            ? "border-white/10 bg-slate-900/60"
            : "border-transparent bg-slate-900/20"
          : "border-slate-200 bg-white/95 shadow-sm",
      )}
    >
      <nav aria-label="Main">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <a href="#top" aria-label="FreshBasket, back to top" className={cn("-ml-1 shrink-0 rounded-xl! p-1", focus)}>
            <Logo tone={dark ? "dark" : "light"} wordmarkClassName="max-[359px]:sr-only" />
          </a>

          <ul className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {LINKS.map(link => (
              <li key={link.href}>
                <a href={link.href} className={linkClass}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/"
              className={cn(
                BUTTON_SMALL,
                focus,
                dark ? "bg-white text-brand-800 hover:bg-brand-50" : "bg-brand-600 text-white shadow-sm hover:bg-brand-700",
              )}
            >
              Live demo
            </Link>
            <a
              href={buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                BUTTON_SMALL,
                "hidden sm:inline-flex",
                focus,
                dark
                  ? "border border-white/25 text-white hover:border-white/50 hover:bg-white/10"
                  : "border border-slate-300 bg-white text-slate-800 hover:border-slate-400 hover:bg-slate-50",
              )}
            >
              Buy on Vibe96
              <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
              <NewTabNote />
            </a>
            <button
              ref={menuButtonRef}
              type="button"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen(open => !open)}
              className={cn(
                "grid size-11 place-items-center rounded-lg! transition-colors duration-300 lg:hidden",
                focus,
                dark ? "text-white hover:bg-white/10" : "text-slate-700 hover:bg-slate-100",
              )}
            >
              {menuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
              <span className="sr-only">Menu</span>
            </button>
          </div>
        </div>

        <div
          id={menuId}
          hidden={!menuOpen}
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-slate-200 bg-white lg:hidden"
        >
          <ul className="mx-auto grid max-w-7xl gap-1 px-4 py-3 sm:px-6">
            {LINKS.map(link => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex min-h-12 items-center rounded-lg! px-3 text-base font-medium text-slate-700 transition-colors duration-200 hover:bg-slate-50 hover:text-slate-900",
                    FOCUS_LIGHT,
                  )}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mx-auto max-w-7xl px-4 pb-4 sm:hidden">
            <a
              href={buyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(BUTTON_SMALL, "w-full border border-slate-300 bg-white text-slate-800 hover:bg-slate-50", FOCUS_LIGHT)}
            >
              Buy on Vibe96
              <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
              <NewTabNote />
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}
