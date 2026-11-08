import Link from "next/link";
import { ArrowRight, ArrowUpRight, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/cn";
import { display } from "./fonts";
import { DemoButton, DemoLoginStatus } from "./DemoLogin";
import { BUTTON_LARGE, Container, DarkBackdrop, Eyebrow, NewTabNote, buttonStyles } from "./primitives";

export default function ClosingCta({ buyUrl }: { buyUrl: string }) {
  return (
    <section
      id="get-started"
      aria-labelledby="cta-title"
      className="relative isolate overflow-hidden py-20 text-center text-white lg:py-28"
    >
      <DarkBackdrop variant="bottom" />
      <Container>
        <Eyebrow tone="dark">Ready when you are</Eyebrow>
        <h2
          id="cta-title"
          className={cn(
            display.className,
            "mx-auto mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl lg:leading-[1.05]",
          )}
        >
          Launch your grocery store this week
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-pretty text-slate-300">
          Full source code, setup in about 15 minutes, and 12 months of updates.
        </p>

        <div className="mx-auto mt-10 flex max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center">
          <Link href="/" className={cn(buttonStyles.accent, BUTTON_LARGE)}>
            Open live store
            <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
          </Link>
          <a href={buyUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonStyles.whiteOnDark, BUTTON_LARGE)}>
            Buy on Vibe96
            <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
            <NewTabNote />
          </a>
          <DemoButton
            role="admin"
            source="cta"
            className={cn(buttonStyles.outlineOnDark, BUTTON_LARGE)}
            icon={<LayoutDashboard className="size-4 shrink-0" aria-hidden="true" />}
          >
            Admin demo
          </DemoButton>
        </div>
        <DemoLoginStatus source="cta" tone="dark" />
      </Container>
    </section>
  );
}
