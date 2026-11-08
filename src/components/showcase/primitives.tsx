import { cn } from "@/lib/cn";
import { display } from "./fonts";

/**
 * Small building blocks shared by the /showcase sections. No hooks here, so both server and
 * client components can use them.
 */

export type Tone = "light" | "dark";

/*
 * Keyboard focus: a brand ring on light backgrounds, a white ring on dark ones.
 *
 * globals.css gives every focused link and button `outline: 2px solid brand-600` and
 * `border-radius: 6px` in an unlayered rule, which beats all Tailwind utilities. On the dark
 * bands that outline would be nearly invisible, so the rings below hide it with the important
 * modifier (`!`), and focusable elements here mark their radius important too (`rounded-xl!`),
 * so they keep their shape while focused. The transparent outline still shows in forced-colors mode.
 */
export const FOCUS_LIGHT =
  "focus-visible:outline-hidden! focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2";
export const FOCUS_DARK =
  "focus-visible:outline-hidden! focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900";

const BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl! px-5 text-sm font-semibold transition-colors duration-200";

export const buttonStyles = {
  /** Main action on dark sections: slate-900 on tangerine-400 is 7.8:1. */
  accent: cn(BUTTON, FOCUS_DARK, "bg-accent-400 text-slate-900 shadow-sm hover:bg-accent-300"),
  outlineOnDark: cn(BUTTON, FOCUS_DARK, "border border-white/30 text-white hover:border-white/60 hover:bg-white/10"),
  whiteOnDark: cn(BUTTON, FOCUS_DARK, "bg-white text-brand-800 shadow-sm hover:bg-brand-50"),
  primary: cn(BUTTON, FOCUS_LIGHT, "bg-brand-600 text-white shadow-sm hover:bg-brand-700"),
  soft: cn(
    BUTTON,
    FOCUS_LIGHT,
    "border border-brand-200 bg-brand-50 text-brand-800 hover:border-brand-300 hover:bg-brand-100",
  ),
} as const;

export const BUTTON_LARGE = "min-h-12 px-6 text-base";

/** Page width shared by every section. */
export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Eyebrow({ tone = "light", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.14em]",
        tone === "dark" ? "text-brand-300" : "text-brand-700",
        className,
      )}
    >
      {children}
    </p>
  );
}

type SectionHeaderProps = {
  /** id of the h2; the section points at it with aria-labelledby. */
  titleId: string;
  eyebrow: string;
  title: string;
  intro?: string;
  tone?: Tone;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeader({ titleId, eyebrow, title, intro, tone = "light", align = "left", className }: SectionHeaderProps) {
  const centered = align === "center";
  return (
    <div className={cn("max-w-3xl", centered && "mx-auto text-center", className)}>
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      <h2
        id={titleId}
        className={cn(
          display.className,
          "mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl lg:leading-[1.1]",
          tone === "dark" ? "text-white" : "text-slate-900",
        )}
      >
        {title}
      </h2>
      {intro && (
        <p
          className={cn(
            "mt-5 max-w-2xl text-lg leading-relaxed text-pretty",
            centered && "mx-auto",
            tone === "dark" ? "text-slate-300" : "text-slate-600",
          )}
        >
          {intro}
        </p>
      )}
    </div>
  );
}

/** Screen-reader note for links that open a new tab. */
export function NewTabNote() {
  return <span className="sr-only"> (opens in a new tab)</span>;
}

/**
 * Background of the dark bands (hero, security, closing call to action): deep teal into a
 * near-black sage, a faint grid and two soft glows. Decorative only. The parent needs
 * `relative isolate overflow-hidden`.
 */
export function DarkBackdrop({ variant = "top" }: { variant?: "top" | "bottom" }) {
  const top = variant === "top";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className={cn("absolute inset-0 bg-gradient-to-b", top ? "from-brand-900 to-slate-900" : "from-slate-900 to-brand-900")} />
      <div
        className={cn(
          "absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.05)_1px,transparent_1px)] bg-[size:56px_56px]",
          top
            ? "[mask-image:radial-gradient(ellipse_75%_60%_at_50%_0%,black_40%,transparent_100%)]"
            : "[mask-image:radial-gradient(ellipse_75%_60%_at_50%_100%,black_40%,transparent_100%)]",
        )}
      />
      <div
        className={cn(
          "absolute size-[38rem] rounded-full bg-brand-500/20 blur-3xl",
          top ? "-top-56 right-[-15%]" : "-bottom-56 left-[-15%]",
        )}
      />
      <div
        className={cn(
          "absolute size-[30rem] rounded-full bg-accent-400/10 blur-3xl",
          top ? "-bottom-64 left-[-15%]" : "-top-64 right-[-15%]",
        )}
      />
    </div>
  );
}
