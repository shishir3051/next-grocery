import { Eye, Gift, LayoutGrid, MapPinned, ShoppingCart, UsersRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { display } from "./fonts";
import { BrowserFrame } from "./DeviceFrames";
import { Reveal, RevealItem } from "./Reveal";
import { Container, SectionHeader } from "./primitives";

const FEATURES = [
  { icon: LayoutGrid, title: "Category browsing", text: "Categories and subcategories, a sidebar, search and a wishlist." },
  { icon: Eye, title: "Product quick view", text: "Sale price, savings, stock left and a quantity stepper." },
  { icon: ShoppingCart, title: "Stock-aware cart", text: "Quantities never exceed stock; the cart is saved on the device." },
  { icon: MapPinned, title: "Delivery location", text: "Pick the address on a map, search places or use the phone’s location." },
  { icon: UsersRound, title: "Accounts", text: "Email sign-up with a 6-digit code, password reset and optional Google sign-in." },
  { icon: Gift, title: "Referral wallet", text: "Invite friends and both get wallet credit to spend at checkout." },
];

export default function FeaturesSection() {
  return (
    <section id="features" aria-labelledby="features-title" className="bg-background py-20 lg:py-28">
      <Container>
        <SectionHeader
          titleId="features-title"
          eyebrow="Storefront"
          title="Everything shoppers expect"
          intro="The storefront covers the whole shopping trip, from finding a product to paying for it, on phones and desktops."
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:items-start">
          <ol className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {FEATURES.map((feature, index) => (
              <RevealItem key={feature.title} delay={(index % 2) * 0.07} className="flex">
                <article className="relative flex w-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
                  <span
                    aria-hidden="true"
                    className={cn(display.className, "absolute right-5 top-4 text-4xl font-extrabold tracking-tight text-slate-100")}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
                    <feature.icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className={cn(display.className, "mt-5 text-lg font-bold tracking-tight text-slate-900")}>{feature.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-slate-600">{feature.text}</p>
                </article>
              </RevealItem>
            ))}
          </ol>

          <Reveal className="lg:sticky lg:top-24 lg:col-span-5">
            <figure>
              <BrowserFrame
                path="/"
                src="/showcase/product-dialog.webp"
                alt="FreshBasket product details dialog with price, stock status, a quantity stepper and an Add to cart button"
                sizes="(min-width: 1280px) 490px, (min-width: 1024px) 40vw, (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)"
              />
              <figcaption className="mt-4 text-sm leading-relaxed text-slate-600">
                Product details open in a dialog over the catalogue, so shoppers keep their place.
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
