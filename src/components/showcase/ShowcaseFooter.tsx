import Link from "next/link";
import { cn } from "@/lib/cn";
import Logo from "./Logo";
import { Container, FOCUS_LIGHT } from "./primitives";

const ANCHORS = [
  { href: "#features", label: "Features" },
  { href: "#admin", label: "Admin" },
  { href: "#tech", label: "Tech" },
];

const LINK =
  "inline-flex min-h-11 items-center rounded-lg! px-3 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900";

export default function ShowcaseFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <Container className="flex flex-col gap-8 py-12 md:flex-row md:items-center md:justify-between">
        <div>
          <a href="#top" aria-label="FreshBasket, back to top" className={cn("-m-1 inline-flex rounded-xl! p-1", FOCUS_LIGHT)}>
            <Logo />
          </a>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
            Grocery e-commerce platform built with Next.js and MongoDB.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="-mx-3 flex flex-wrap items-center gap-1">
            {ANCHORS.map(anchor => (
              <li key={anchor.href}>
                <a href={anchor.href} className={cn(LINK, FOCUS_LIGHT)}>
                  {anchor.label}
                </a>
              </li>
            ))}
            <li>
              <Link href="/" className={cn(LINK, FOCUS_LIGHT)}>
                Live store
              </Link>
            </li>
          </ul>
        </nav>
      </Container>

      <div className="border-t border-slate-200">
        <Container className="py-6">
          <p className="text-sm text-slate-500">© 2026 FreshBasket</p>
        </Container>
      </div>
    </footer>
  );
}
