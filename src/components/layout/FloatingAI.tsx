"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MessageSquare, X } from "lucide-react";
import ChatWidget from "../ui/ChatWidget";

/**
 * Floating "Ask Fresh AI" launcher that opens the ChatWidget.
 * Calm, on-brand button: no glow, no pulsing rings, no fake notification dot.
 */
export default function FloatingAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    <>
      <div className="pointer-events-none fixed bottom-6 right-6 z-[1000] flex flex-col items-end gap-3">

        {/* Text label (decorative: the button below carries the accessible name) */}
        <AnimatePresence>
          {!isOpen && !isHovered && (
            <motion.div
              aria-hidden="true"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
              className="whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-md"
            >
              Ask Fresh AI
            </motion.div>
          )}
        </AnimatePresence>

        {/* Launcher button */}
        <motion.button
          type="button"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => setIsOpen(prev => !prev)}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          aria-label={isOpen ? "Close chat" : "Ask Fresh AI"}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className={`pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-colors ${
            isOpen ? "bg-slate-800 hover:bg-slate-900" : "bg-brand-600 hover:bg-brand-700"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isOpen ? (
              <motion.span
                key="close"
                initial={reduceMotion ? false : { rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={reduceMotion ? undefined : { rotate: 90, opacity: 0 }}
                className="flex"
              >
                <X size={24} aria-hidden="true" />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={reduceMotion ? false : { rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={reduceMotion ? undefined : { rotate: -90, opacity: 0 }}
                className="flex"
              >
                <MessageSquare size={24} aria-hidden="true" />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <ChatWidget isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
