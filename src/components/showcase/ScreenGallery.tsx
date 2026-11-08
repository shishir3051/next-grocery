import Image from "next/image";
import { RevealItem } from "./Reveal";
import { Container, SectionHeader } from "./primitives";

const SCREENS = [
  {
    src: "/showcase/storefront-desktop.webp",
    caption: "Storefront",
    alt: "FreshBasket storefront with the category sidebar and product grid",
  },
  {
    src: "/showcase/product-dialog.webp",
    caption: "Product details",
    alt: "FreshBasket product details dialog with price, stock status and a quantity stepper",
  },
  {
    src: "/showcase/checkout-desktop.webp",
    caption: "Checkout",
    alt: "FreshBasket checkout with the delivery address, coupon, payment options and order summary",
  },
  { src: "/showcase/ai-search.webp", caption: "AI search", alt: "FreshBasket AI smart search results" },
  {
    src: "/showcase/admin-dashboard.webp",
    caption: "Admin dashboard",
    alt: "FreshBasket admin dashboard with a 7-day sales chart",
  },
  {
    src: "/showcase/admin-orders.webp",
    caption: "Orders",
    alt: "FreshBasket admin orders table with order and payment status",
  },
  { src: "/showcase/admin-products.webp", caption: "Products", alt: "FreshBasket admin products table" },
  {
    src: "/showcase/admin-messages.webp",
    caption: "Messages",
    alt: "FreshBasket admin inbox of customer messages",
  },
];

export default function ScreenGallery() {
  return (
    <section id="screens" aria-labelledby="screens-title" className="bg-background py-20 lg:py-28">
      <Container>
        <SectionHeader
          titleId="screens-title"
          eyebrow="Screens"
          title="Every screen, ready today"
          intro="Screenshots from the live demo. Open it to click through each one yourself."
        />

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SCREENS.map((screen, index) => (
            <RevealItem key={screen.src} delay={(index % 4) * 0.07}>
              <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <Image
                  src={screen.src}
                  alt={screen.alt}
                  width={1440}
                  height={900}
                  sizes="(min-width: 1280px) 290px, (min-width: 1024px) 23vw, (min-width: 640px) 46vw, 92vw"
                  loading="lazy"
                  className="block h-auto w-full border-b border-slate-200 bg-slate-100"
                />
                <figcaption className="px-4 py-3 text-sm font-semibold text-slate-800">{screen.caption}</figcaption>
              </figure>
            </RevealItem>
          ))}
        </ul>
      </Container>
    </section>
  );
}
