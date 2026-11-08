import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  Banknote,
  Bike,
  CodeXml,
  Languages,
  LayoutDashboard,
  PackageCheck,
  Rocket,
  ShoppingBasket,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { display } from "./fonts";
import { BrowserFrame, PhoneFrame } from "./DeviceFrames";
import { DemoButton, DemoLoginStatus } from "./DemoLogin";
import { BUTTON_LARGE, Container, DarkBackdrop, FOCUS_DARK, buttonStyles } from "./primitives";

const TRUST_BADGES = [
  { icon: Banknote, label: "Cash on delivery · Wallet · SSLCommerz" },
  { icon: Languages, label: "AI search: English, Banglish & Bangla" },
  { icon: LayoutDashboard, label: "Admin panel + rider app" },
  { icon: Rocket, label: "Deploy on Vercel, VPS or Docker" },
];

const TEXT_BUTTON = cn(
  "inline-flex min-h-11 items-center gap-1.5 rounded-lg! px-3 font-semibold text-brand-200 underline decoration-brand-200/40 underline-offset-4 transition-colors duration-200 hover:bg-white/10 hover:text-white hover:decoration-white/70",
  FOCUS_DARK,
);

export default function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative isolate overflow-hidden text-white">
      <DarkBackdrop />
      <Container className="pb-16 pt-28 sm:pt-32 lg:pb-20 lg:pt-36">
        <div className="grid items-center gap-x-12 gap-y-14 lg:grid-cols-2 xl:gap-x-16">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-brand-100">
              <CodeXml className="size-4 shrink-0 text-brand-300" aria-hidden="true" />
              Full source code · Next.js 16 · MongoDB
            </p>

            <h1
              id="hero-title"
              className={cn(
                display.className,
                "mt-6 text-[2.5rem] font-extrabold leading-[1.05] tracking-tight text-balance sm:text-6xl xl:text-7xl",
              )}
            >
              Online{" "}
              <span className="bg-gradient-to-r from-brand-300 via-brand-200 to-brand-100 bg-clip-text text-transparent">
                Grocery Store
              </span>{" "}
              Platform
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-slate-300">
              A complete grocery e-commerce system for Bangladesh: a fast storefront with AI search, checkout with cash on
              delivery, wallet and SSLCommerz, a full admin panel and a delivery-rider app. Ready to brand and launch.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/" className={cn(buttonStyles.accent, BUTTON_LARGE)}>
                Open live store
                <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
              </Link>
              <DemoButton
                role="admin"
                source="hero"
                className={cn(buttonStyles.outlineOnDark, BUTTON_LARGE)}
                icon={<LayoutDashboard className="size-4 shrink-0" aria-hidden="true" />}
              >
                Admin demo
              </DemoButton>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1 text-sm text-slate-300">
              <span className="pr-1">or try as</span>
              <DemoButton
                role="customer"
                source="hero"
                className={TEXT_BUTTON}
                icon={<ShoppingBasket className="size-4 shrink-0" aria-hidden="true" />}
              >
                Customer
              </DemoButton>
              <DemoButton role="rider" source="hero" className={TEXT_BUTTON} icon={<Bike className="size-4 shrink-0" aria-hidden="true" />}>
                Rider
              </DemoButton>
            </div>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300">
              One-click demo logins, no password. The demo admin is read-only, except for demo orders.
            </p>
            <DemoLoginStatus source="hero" tone="dark" />
          </div>

          <HeroVisual />
        </div>

        <ul className="mt-16 grid gap-x-8 gap-y-4 border-t border-white/10 pt-8 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {TRUST_BADGES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm font-medium text-slate-200">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-200 ring-1 ring-inset ring-white/10">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/** Desktop storefront in a browser window, the phone storefront over its corner, and two status chips. */
function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-2xl pb-[10%] lg:max-w-none">
      <div aria-hidden="true" className="absolute inset-[8%] -z-10 rounded-full bg-brand-400/25 blur-3xl" />

      <BrowserFrame
        tone="dark"
        path="/"
        src="/showcase/storefront-desktop.webp"
        alt="FreshBasket storefront on a desktop browser, with the category sidebar and product grid"
        sizes="(min-width: 1280px) 540px, (min-width: 1024px) 420px, (min-width: 672px) 605px, 90vw"
        preload
        className="w-[90%]"
      />

      <PhoneFrame
        tone="dark"
        src="/showcase/storefront-mobile.webp"
        alt="FreshBasket storefront on a phone"
        sizes="(min-width: 1280px) 150px, (min-width: 1024px) 12vw, (min-width: 672px) 175px, 26vw"
        eager
        className="absolute bottom-0 right-0 w-[26%]"
      />

      <StatusChip
        className="absolute -left-3 top-[14%] hidden sm:flex xl:-left-8"
        icon={
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-success-50 text-success-700">
            <PackageCheck className="size-5" aria-hidden="true" />
          </span>
        }
        title="Order delivered"
        detail="Cash collected"
      />
      <StatusChip
        className="absolute bottom-[2%] left-[6%] hidden sm:flex"
        icon={
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-50 text-accent-700">
            <BadgePercent className="size-5" aria-hidden="true" />
          </span>
        }
        title="WELCOME10"
        detail="10% off applied"
        mono
      />
    </div>
  );
}

type StatusChipProps = {
  icon: React.ReactNode;
  title: string;
  detail: string;
  mono?: boolean;
  className?: string;
};

function StatusChip({ icon, title, detail, mono = false, className }: StatusChipProps) {
  return (
    <div className={cn("items-center gap-3 rounded-xl bg-white py-2.5 pl-2.5 pr-4 shadow-xl ring-1 ring-slate-900/5", className)}>
      {icon}
      <div className="leading-tight">
        <p className={cn("text-sm font-semibold text-slate-900", mono && "font-mono")}>{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
      </div>
    </div>
  );
}
