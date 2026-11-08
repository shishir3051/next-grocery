import { Database, FileCode, PanelsTopLeft, Route } from "lucide-react";
import { cn } from "@/lib/cn";
import { display } from "./fonts";
import { Reveal } from "./Reveal";
import { Container, SectionHeader } from "./primitives";

const STACK = [
  { name: "Next.js 16" },
  { name: "React 19" },
  { name: "TypeScript" },
  { name: "MongoDB + Mongoose 9" },
  { name: "NextAuth 4" },
  { name: "Tailwind CSS 4" },
  { name: "Framer Motion" },
  { name: "Leaflet maps" },
  { name: "Google Gemini", optional: true },
  { name: "SSLCommerz", optional: true },
  { name: "Nodemailer" },
];

// Counted in the codebase: .ts/.tsx lines in src/, route.ts files, page.tsx files and Mongoose models.
const STATS = [
  { icon: FileCode, value: "20,000+", label: "lines of TypeScript" },
  { icon: Route, value: "36", label: "API routes" },
  { icon: PanelsTopLeft, value: "32", label: "pages and screens" },
  { icon: Database, value: "10", label: "data models" },
];

export default function TechSection() {
  return (
    <section id="tech" aria-labelledby="tech-title" className="bg-white py-20 lg:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <SectionHeader
            titleId="tech-title"
            eyebrow="Under the hood"
            title="Modern, typed and documented"
            intro="A mainstream stack with strict TypeScript, so any Next.js developer can find their way around quickly."
          />
          <ul aria-label="Technology stack" className="mt-8 flex flex-wrap gap-2">
            {STACK.map(({ name, optional }) => (
              <li
                key={name}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-xs"
              >
                <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-brand-500" />
                {name}
                {optional && <span className="font-normal text-slate-500">(optional)</span>}
              </li>
            ))}
          </ul>
        </div>

        {/* Static numbers (no count-up), so they are right on first paint and with reduced motion */}
        <dl className="grid grid-cols-2 gap-4 lg:col-span-6">
          {STATS.map(({ icon: Icon, value, label }, index) => (
            // Label first in the markup (dt, then dd), number first on screen
            <Reveal
              key={label}
              delay={(index % 2) * 0.07}
              className="flex flex-col-reverse justify-end rounded-2xl border border-slate-200 bg-background p-4 sm:p-6"
            >
              <dt className="mt-1 text-sm font-medium text-slate-600">{label}</dt>
              <dd>
                <Icon className="size-5 text-brand-600" aria-hidden="true" />
                <span
                  className={cn(
                    display.className,
                    // 48px only from xl: at lg the cards are ~215px wide and "20,000+" would run into the padding
                    "mt-4 block text-[1.625rem] leading-tight font-extrabold tracking-tight whitespace-nowrap text-slate-900 tabular-nums sm:text-4xl xl:text-5xl",
                  )}
                >
                  {value}
                </span>
              </dd>
            </Reveal>
          ))}
        </dl>
      </Container>
    </section>
  );
}
