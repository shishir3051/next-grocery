import { Leaf } from "lucide-react";
import { cn } from "@/lib/cn";
import { display } from "./fonts";

type LogoProps = {
  tone?: "light" | "dark";
  /** Extra classes for the wordmark, e.g. to hide it on very narrow screens. */
  wordmarkClassName?: string;
};

/** The leaf mark and "FreshBasket" wordmark, as in the store header. */
export default function Logo({ tone = "light", wordmarkClassName }: LogoProps) {
  const dark = tone === "dark";
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-sm"
      >
        <Leaf className="size-[18px] text-white" />
      </span>
      <span
        className={cn(
          display.className,
          "text-lg font-extrabold tracking-tight transition-colors duration-300",
          dark ? "text-white" : "text-slate-900",
          wordmarkClassName,
        )}
      >
        Fresh<span className={cn("transition-colors duration-300", dark ? "text-brand-300" : "text-brand-600")}>Basket</span>
      </span>
    </span>
  );
}
