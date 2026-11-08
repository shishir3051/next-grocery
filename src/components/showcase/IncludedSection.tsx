import { BookOpen, CodeXml, Database, Info, Server } from "lucide-react";
import { cn } from "@/lib/cn";
import { display } from "./fonts";
import { RevealItem } from "./Reveal";
import { Container, SectionHeader } from "./primitives";

const ITEMS = [
  { icon: CodeXml, title: "100% source code", text: "Storefront, admin panel, rider app and API." },
  {
    icon: Database,
    title: "Database setup",
    text: "Indexes, a sample catalogue and demo admin, customer and rider accounts in one command.",
  },
  {
    icon: BookOpen,
    title: "Documentation",
    text: "Setup guide, API reference, security model, deployment guide and changelog.",
  },
  { icon: Server, title: "Deploy anywhere", text: "Vercel, a VPS with Node.js, or Docker with optional MongoDB." },
];

export default function IncludedSection() {
  return (
    <section id="included" aria-labelledby="included-title" className="bg-background py-20 lg:py-28">
      <Container>
        <SectionHeader
          titleId="included-title"
          eyebrow="What’s included"
          title="Nothing compiled. Nothing hidden."
          intro="The full, readable source of the app that runs the live demo, ready to rebrand and extend."
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map(({ icon: Icon, title, text }, index) => (
            <RevealItem key={title} delay={(index % 4) * 0.07} className="flex">
              <article className="flex w-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className={cn(display.className, "mt-5 text-lg font-bold tracking-tight text-slate-900")}>{title}</h3>
                <p className="mt-2 text-base leading-relaxed text-slate-600">{text}</p>
              </article>
            </RevealItem>
          ))}
        </ul>

        <p className="mt-8 flex items-start gap-2.5 text-sm leading-relaxed text-slate-600">
          <Info className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden="true" />
          The demo’s products and photos are sample content and not part of the licence. One licence covers one store.
        </p>
      </Container>
    </section>
  );
}
