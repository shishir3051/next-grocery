import { ChefHat, Gauge, Search } from "lucide-react";
import { BrowserFrame } from "./DeviceFrames";
import { Reveal } from "./Reveal";
import { Container, SectionHeader } from "./primitives";

const EXAMPLE_QUERIES = ["alu peyaj dim", "milk for tea", "chicken curry", "breakfast for 4"];

const POINTS = [
  { icon: ChefHat, text: "Recipe ideas from the cart, with one-tap add for missing ingredients" },
  { icon: Search, text: "Works without an AI key: keyword search and curated recipes take over" },
  { icon: Gauge, text: "Rate limited and time-boxed, so costs stay predictable" },
];

export default function AiSearchSection() {
  return (
    <section id="ai" aria-labelledby="ai-title" className="bg-background py-20 lg:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeader
            titleId="ai-title"
            eyebrow="AI search & recipes"
            title="Search the way people talk"
            intro="Google Gemini picks real products from your catalogue, in English, Banglish or Bangla."
          />

          <p id="ai-examples" className="mt-8 text-sm font-semibold text-slate-900">
            Shoppers can type
          </p>
          <ul aria-labelledby="ai-examples" className="mt-3 flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map(query => (
              <li
                key={query}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 font-mono text-sm text-slate-800 shadow-xs"
              >
                <Search className="size-3.5 shrink-0 text-brand-600" aria-hidden="true" />
                {query}
              </li>
            ))}
          </ul>

          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
                  <Icon className="size-[18px]" aria-hidden="true" />
                </span>
                <span className="pt-1.5 text-base leading-relaxed text-slate-700">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <Reveal className="lg:col-span-7">
          <BrowserFrame
            path="/"
            src="/showcase/ai-search.webp"
            alt="FreshBasket AI smart search showing catalogue products picked for a shopper’s request"
            sizes="(min-width: 1280px) 680px, (min-width: 1024px) 55vw, (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)"
          />
        </Reveal>
      </Container>
    </section>
  );
}
