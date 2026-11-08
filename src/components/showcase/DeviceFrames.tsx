import Image from "next/image";
import { Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Tone } from "./primitives";

type ScreenshotProps = {
  src: string;
  /** Describes the screen, e.g. "FreshBasket admin dashboard with a 7-day sales chart". */
  alt: string;
  /** Rendered width of the screenshot, so the browser picks the right file from the srcset. */
  sizes: string;
  /** Hero only: preload it as the likely LCP image (Next.js 16 replaced `priority` with `preload`). */
  preload?: boolean;
  /** Above the fold but not the LCP image: load straight away instead of lazily. */
  eager?: boolean;
  /** Ring and shadow strength: subtle on light sections, a light ring on dark ones. */
  tone?: Tone;
  className?: string;
};

function loading(preload: boolean, eager: boolean): "eager" | "lazy" | undefined {
  if (preload) return undefined;
  return eager ? "eager" : "lazy";
}

/** A desktop screenshot (1440×900) in a browser window. Shows a path, never a domain. */
export function BrowserFrame({
  src,
  alt,
  sizes,
  preload = false,
  eager = false,
  tone = "light",
  path = "/",
  className,
}: ScreenshotProps & { path?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-white ring-1",
        tone === "dark" ? "shadow-2xl shadow-black/40 ring-white/15" : "shadow-xl ring-slate-900/10",
        className,
      )}
    >
      <div aria-hidden="true" className="flex items-center gap-3 border-b border-slate-200 bg-slate-100 px-3 py-2 sm:px-4">
        <span className="flex shrink-0 gap-1.5">
          <span className="size-2.5 rounded-full bg-slate-300" />
          <span className="size-2.5 rounded-full bg-slate-300" />
          <span className="size-2.5 rounded-full bg-slate-300" />
        </span>
        <span className="mx-auto flex min-w-0 items-center gap-1.5 rounded-md bg-white px-2.5 py-0.5 font-mono text-xs text-slate-500 ring-1 ring-inset ring-slate-200">
          <Lock className="size-3 shrink-0" />
          <span className="truncate">{path}</span>
        </span>
        {/* Same width as the dots, so the address stays centred */}
        <span className="w-[2.625rem] shrink-0" />
      </div>
      <Image
        src={src}
        alt={alt}
        width={1440}
        height={900}
        sizes={sizes}
        preload={preload}
        fetchPriority={preload ? "high" : undefined}
        loading={loading(preload, eager)}
        className="block h-auto w-full bg-slate-50"
      />
    </div>
  );
}

/**
 * A phone screenshot (390×844) in a phone body. Corner radii are percentages, so it scales fluidly.
 * The screen is 93% as wide as the phone, so `sizes` can simply give the phone's width.
 *
 * The bezel padding sits on an inner wrapper: percentage padding is measured against the
 * containing block's width, and callers size and position the outer element (often absolutely,
 * inside a much wider box). On the wrapper it is always 3.5% of the phone itself, so the bezel
 * stays thin at every size and the inner radii nest inside the outer ones.
 */
export function PhoneFrame({ src, alt, sizes, preload = false, eager = false, tone = "light", className }: ScreenshotProps) {
  return (
    <div
      className={cn(
        "rounded-[17%/8%] bg-slate-900 ring-1",
        tone === "dark" ? "shadow-2xl shadow-black/50 ring-white/20" : "shadow-xl ring-slate-900/10",
        className,
      )}
    >
      <div className="p-[3.5%]">
        <div className="overflow-hidden rounded-[13.5%/6.2%] bg-white">
          <Image
            src={src}
            alt={alt}
            width={390}
            height={844}
            sizes={sizes}
            preload={preload}
            fetchPriority={preload ? "high" : undefined}
            loading={loading(preload, eager)}
            className="block h-auto w-full"
          />
        </div>
      </div>
    </div>
  );
}
