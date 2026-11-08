"use client";

import { useEffect, useRef } from "react";
import { animate, inView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Seconds to wait once in view. Use 0.07 per column for a 70 ms stagger. */
  delay?: number;
};

const HIDDEN_TRANSFORM = "translateY(16px)";

/**
 * Printing (and Save as PDF) never scrolls the blocks into view, so in print they are forced to
 * their final state: important stylesheet rules beat the hiding inline styles and any running
 * animation.
 */
const PRINT_VISIBLE = "print:opacity-100! print:transform-none!";

/**
 * Fades and lifts an element the first time it scrolls into view (0.5 s, ease-out, once).
 *
 * The server renders everything visible. After hydration only elements that are still below
 * the fold are hidden, then revealed when they scroll in. So nothing on screen ever blinks,
 * the page reads fine without JavaScript and prints in full, and visitors who prefer reduced
 * motion simply get the final layout with no movement.
 */
function useReveal<T extends HTMLElement>(delay: number) {
  const ref = useRef<T>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element || reduceMotion) return;
    if (element.getBoundingClientRect().top < window.innerHeight) return;

    const clear = () => {
      element.style.opacity = "";
      element.style.transform = "";
    };
    element.style.opacity = "0";
    element.style.transform = HIDDEN_TRANSFORM;

    const stop = inView(
      element,
      () => {
        animate(
          element,
          { opacity: [0, 1], transform: [HIDDEN_TRANSFORM, "translateY(0px)"] },
          { duration: 0.5, delay, ease: "easeOut" },
        ).then(clear);
      },
      { margin: "0px 0px -48px 0px" },
    );

    return () => {
      stop();
      clear();
    };
  }, [delay, reduceMotion]);

  return ref;
}

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useReveal<HTMLDivElement>(delay);
  return (
    <div ref={ref} className={cn(className, PRINT_VISIBLE)}>
      {children}
    </div>
  );
}

/** Same as Reveal, for the items of a <ul> or <ol>. */
export function RevealItem({ children, className, delay = 0 }: RevealProps) {
  const ref = useReveal<HTMLLIElement>(delay);
  return (
    <li ref={ref} className={cn(className, PRINT_VISIBLE)}>
      {children}
    </li>
  );
}
