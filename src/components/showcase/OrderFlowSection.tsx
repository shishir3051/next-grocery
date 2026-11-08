import { Bike, CircleCheck, ClipboardList, PackageOpen, RotateCcw, Truck } from "lucide-react";
import { cn } from "@/lib/cn";
import { display } from "./fonts";
import { PhoneFrame } from "./DeviceFrames";
import { DemoButton, DemoLoginStatus } from "./DemoLogin";
import { Reveal, RevealItem } from "./Reveal";
import { Container, SectionHeader, buttonStyles } from "./primitives";

const STEPS = [
  { icon: ClipboardList, title: "Placed", note: null, text: "The customer checks out and the order appears in the admin panel." },
  { icon: PackageOpen, title: "Processing", note: null, text: "The store confirms the order and packs it." },
  { icon: Truck, title: "Shipped", note: "rider assigned", text: "Assigning a rider marks it shipped and puts it in the rider app." },
  { icon: CircleCheck, title: "Delivered", note: "cash collected", text: "The rider taps Delivered and cash orders are marked paid." },
];

export default function OrderFlowSection() {
  return (
    <section id="flow" aria-labelledby="flow-title" className="bg-background py-20 lg:py-28">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <SectionHeader
              titleId="flow-title"
              eyebrow="Order flow"
              title="From cart to doorstep"
              intro="Orders move through four clear steps, and the rider closes the loop from a phone."
            />
            <div className="mt-8">
              <DemoButton
                role="rider"
                source="flow"
                className={buttonStyles.soft}
                icon={<Bike className="size-4 shrink-0" aria-hidden="true" />}
              >
                Try the rider app
              </DemoButton>
              <DemoLoginStatus source="flow" />
            </div>
          </div>

          <Reveal className="lg:col-span-6">
            <div className="relative grid place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-50 via-white to-accent-50 px-6 py-10 sm:py-12">
              <PhoneFrame
                src="/showcase/rider-mobile.webp"
                alt="FreshBasket rider app on a phone, with an assigned order, the customer’s address and phone, and a Mark as delivered button"
                sizes="224px"
                className="w-52 sm:w-56"
              />
            </div>
          </Reveal>
        </div>

        <ol className="mt-16 grid gap-8 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((step, index) => {
            const last = index === STEPS.length - 1;
            return (
              <RevealItem key={step.title} delay={index * 0.07} className="relative flex gap-4 lg:flex-col lg:gap-5">
                {!last && (
                  <>
                    {/* Connector to the next step: down the left on phones, across on desktop */}
                    <span aria-hidden="true" className="absolute -bottom-8 left-6 top-14 w-px bg-brand-200 lg:hidden" />
                    <span aria-hidden="true" className="absolute -right-2 left-16 top-6 hidden h-px bg-brand-200 lg:block" />
                  </>
                )}
                <span
                  className={cn(
                    "relative grid size-12 shrink-0 place-items-center rounded-2xl ring-1 ring-inset",
                    last ? "bg-success-600 text-white ring-success-600" : "bg-white text-brand-700 shadow-sm ring-brand-200",
                  )}
                >
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500">Step {index + 1}</p>
                  <h3 className={cn(display.className, "mt-1 text-lg font-bold tracking-tight text-slate-900")}>
                    {step.title}
                    {step.note && <span className="ml-1.5 text-sm font-medium text-slate-500">({step.note})</span>}
                  </h3>
                  <p className="mt-1.5 text-base leading-relaxed text-slate-600">{step.text}</p>
                </div>
              </RevealItem>
            );
          })}
        </ol>

        <p className="mt-12 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-base leading-relaxed text-slate-700 shadow-sm">
          <RotateCcw className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden="true" />
          <span>
            <span className="font-semibold text-slate-900">Cancel any order before delivery:</span> stock, coupon use and
            wallet credit are returned automatically.
          </span>
        </p>
      </Container>
    </section>
  );
}
