import { BadgePercent, ChevronRight, ShieldCheck, ShoppingCart, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";
import { display } from "./fonts";
import { BrowserFrame } from "./DeviceFrames";
import { Reveal, RevealItem } from "./Reveal";
import { Container, SectionHeader } from "./primitives";

const STEPS = [
  { icon: ShoppingCart, title: "Cart", text: "Stock-checked items and delivery fee" },
  { icon: BadgePercent, title: "Coupon", text: "Percentage or fixed coupons with minimum order and usage limits" },
  { icon: Wallet, title: "Pay", text: "Cash on delivery, wallet credit, or cards and mobile banking via SSLCommerz" },
  {
    icon: ShieldCheck,
    title: "Verified",
    text: "Online payments are confirmed with SSLCommerz’s validation API before an order is marked paid",
  },
];

export default function CheckoutSection() {
  return (
    <section id="checkout" aria-labelledby="checkout-title" className="bg-white py-20 lg:py-28">
      <Container>
        <SectionHeader
          titleId="checkout-title"
          eyebrow="Checkout & payments"
          title="Checkout that gets paid"
          intro="Prices and totals are rebuilt on the server, and online payments count only after SSLCommerz confirms them."
          align="center"
        />

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((step, index) => (
            <RevealItem key={step.title} delay={index * 0.07} className="relative flex">
              <article className="flex w-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-full bg-brand-600 font-mono text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <step.icon className="size-5 text-brand-600" aria-hidden="true" />
                </div>
                <h3 className={cn(display.className, "mt-5 text-lg font-bold tracking-tight text-slate-900")}>{step.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-slate-600">{step.text}</p>
              </article>
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-[26px] top-1/2 z-10 hidden size-7 -translate-y-1/2 place-items-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 lg:grid"
                >
                  <ChevronRight className="size-4" />
                </span>
              )}
            </RevealItem>
          ))}
        </ol>

        <Reveal className="mx-auto mt-14 max-w-5xl">
          <BrowserFrame
            path="/checkout"
            src="/showcase/checkout-desktop.webp"
            alt="FreshBasket checkout with the delivery address, coupon field, payment options and order summary"
            sizes="(min-width: 1088px) 1024px, 92vw"
          />
        </Reveal>
      </Container>
    </section>
  );
}
