import { Check, FolderTree, ListChecks, ShieldCheck } from "lucide-react";
import { Reveal } from "./Reveal";
import { Container, SectionHeader } from "./primitives";

const POINTS = [
  { icon: FolderTree, text: "A map of the folders, the commands and the domain rules" },
  { icon: ShieldCheck, text: "The security rules every API route must follow" },
  { icon: ListChecks, text: "Checks to run before finishing: typecheck, lint and build" },
];

const DONE = [
  "Read AGENTS.md (codebase guide and rules)",
  "Updated src/app/checkout/page.tsx",
  "npm run typecheck passed",
];

export default function AiReadySection() {
  return (
    <section id="ai-ready" aria-labelledby="ai-ready-title" className="bg-white py-20 lg:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeader
            titleId="ai-ready-title"
            eyebrow="AI-ready codebase"
            title="Built to extend with AI coding tools"
            intro="AGENTS.md and CLAUDE.md map the codebase and its security rules, so tools like Claude Code, Codex or Cursor can add features safely."
          />
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
          <figure className="overflow-hidden rounded-2xl bg-slate-900 shadow-xl ring-1 ring-slate-900/10">
            <figcaption className="sr-only">Example session: an AI coding tool adds a feature to FreshBasket.</figcaption>
            <div aria-hidden="true" className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
              <span className="flex shrink-0 gap-1.5">
                <span className="size-2.5 rounded-full bg-white/20" />
                <span className="size-2.5 rounded-full bg-white/20" />
                <span className="size-2.5 rounded-full bg-white/20" />
              </span>
              <span className="mx-auto truncate font-mono text-xs text-slate-400">freshbasket — terminal</span>
              <span className="w-[2.625rem] shrink-0" />
            </div>
            <div className="space-y-4 p-5 font-mono text-sm leading-relaxed [overflow-wrap:anywhere] sm:p-7 sm:text-[0.9375rem]">
              <p className="text-white">
                <span className="mr-2 text-accent-300" aria-hidden="true">
                  {">"}
                </span>
                Show the free-delivery progress bar on the checkout page too
              </p>
              <ul className="space-y-2.5 text-slate-300">
                {DONE.map(line => (
                  <li key={line} className="flex gap-2.5">
                    <Check className="mt-[0.2rem] size-4 shrink-0 text-brand-300" aria-hidden="true" />
                    <span>
                      <span className="sr-only">Done: </span>
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
              <p aria-hidden="true" className="flex items-center gap-2 text-slate-400">
                <span className="text-accent-300">{">"}</span>
                <span className="inline-block h-4 w-2 animate-pulse bg-brand-300" />
              </p>
            </div>
          </figure>
        </Reveal>
      </Container>
    </section>
  );
}
