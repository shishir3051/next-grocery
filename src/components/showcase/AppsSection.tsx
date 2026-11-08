import { ArrowRight, Bike, LayoutDashboard, Route, ShoppingBasket, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DemoRole } from "@/lib/demo";
import { display } from "./fonts";
import { BrowserFrame, PhoneFrame } from "./DeviceFrames";
import { DemoButton, DemoLoginStatus } from "./DemoLogin";
import { RevealItem } from "./Reveal";
import { Container, SectionHeader, buttonStyles } from "./primitives";

type App = {
  number: string;
  role: DemoRole;
  icon: LucideIcon;
  title: string;
  text: string;
  action: string;
  screen: { device: "phone" | "browser"; src: string; alt: string; path?: string };
};

const APPS: App[] = [
  {
    number: "01",
    role: "customer",
    icon: ShoppingBasket,
    title: "Customer storefront",
    text: "Browse categories, search, add to cart and check out in a few taps.",
    action: "Try as customer",
    screen: { device: "phone", src: "/showcase/storefront-mobile.webp", alt: "FreshBasket customer storefront on a phone" },
  },
  {
    number: "02",
    role: "admin",
    icon: LayoutDashboard,
    title: "Admin panel",
    text: "Products, orders, coupons, banners, news, users, messages and settings in one place.",
    action: "Try as admin",
    screen: {
      device: "browser",
      src: "/showcase/admin-dashboard.webp",
      alt: "FreshBasket admin dashboard with a 7-day sales chart",
      path: "/admin",
    },
  },
  {
    number: "03",
    role: "rider",
    icon: Bike,
    title: "Delivery rider",
    text: "Assigned orders with address, phone, map link and a one-tap Delivered button.",
    action: "Try as rider",
    screen: { device: "phone", src: "/showcase/rider-mobile.webp", alt: "FreshBasket rider app on a phone, listing assigned orders" },
  },
];

export default function AppsSection() {
  return (
    <section id="apps" aria-labelledby="apps-title" className="bg-white py-20 lg:py-28">
      <Container>
        <SectionHeader
          titleId="apps-title"
          eyebrow="Three apps"
          title="One store, three apps"
          intro="Shoppers, store managers and delivery riders each get a focused app, all from one Next.js codebase and one MongoDB database."
        />

        <ul className="mt-12 grid gap-6 lg:grid-cols-3">
          {APPS.map((app, index) => (
            <RevealItem key={app.role} delay={index * 0.07} className="flex">
              <article className="flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md sm:flex-row lg:flex-col">
                <AppScreen screen={app.screen} />
                <div className="flex flex-1 flex-col p-6 sm:p-8 lg:p-6 xl:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <span className="rounded-full bg-brand-50 px-2.5 py-1 font-mono text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-200">
                      {app.number}
                    </span>
                    <app.icon className="size-5 text-brand-600" aria-hidden="true" />
                  </div>
                  <h3 className={cn(display.className, "mt-5 text-xl font-bold tracking-tight text-slate-900")}>{app.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-slate-600">{app.text}</p>
                  <div className="mt-auto pt-6">
                    <DemoButton role={app.role} source="apps" className={buttonStyles.soft}>
                      {app.action}
                      <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                    </DemoButton>
                  </div>
                </div>
              </article>
            </RevealItem>
          ))}
        </ul>

        <p className="mt-10 flex items-start gap-3 text-base leading-relaxed text-slate-600">
          <Route className="mt-1 size-5 shrink-0 text-brand-600" aria-hidden="true" />
          <span>
            <span className="font-semibold text-slate-900">Try the whole flow:</span> order as the customer, ship it as the
            admin, deliver it as the rider.
          </span>
        </p>
        <DemoLoginStatus source="apps" />
      </Container>
    </section>
  );
}

/** The top of each card: the app's screen peeking out of a soft stage (cropped at the bottom). */
function AppScreen({ screen }: { screen: App["screen"] }) {
  return (
    <div className="relative h-60 shrink-0 overflow-hidden border-b border-slate-200 bg-gradient-to-b from-brand-50 to-slate-50 sm:h-auto sm:min-h-64 sm:w-2/5 sm:border-b-0 sm:border-r lg:h-60 lg:min-h-0 lg:w-auto lg:border-b lg:border-r-0">
      {screen.device === "phone" ? (
        <PhoneFrame src={screen.src} alt={screen.alt} sizes="160px" className="absolute left-1/2 top-8 w-40 -translate-x-1/2" />
      ) : (
        <BrowserFrame
          src={screen.src}
          alt={screen.alt}
          path={screen.path}
          sizes="(min-width: 1024px) 42vw, (min-width: 640px) 54vw, 130vw"
          className="absolute left-6 top-8 w-[135%]"
        />
      )}
    </div>
  );
}
