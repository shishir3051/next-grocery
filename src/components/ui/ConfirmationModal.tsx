"use client";

import { useEffect, useId, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Info } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

// Icon tile colours per modal type (design tokens, see docs/design/DESIGN_SYSTEM.md)
const ICON_STYLES = {
  danger: "bg-danger-50 text-danger-600",
  warning: "bg-accent-50 text-accent-600",
  info: "bg-brand-50 text-brand-600",
};

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = 'warning'
}: ConfirmationModalProps) {
  const titleId = useId();
  const messageId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // Move keyboard focus into the modal when it opens.
  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  // Escape closes the modal.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={messageId}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white p-6 text-center shadow-xl sm:p-8"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>

            <div className={cn("mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl", ICON_STYLES[type])}>
              {type === 'info' ? <Info size={28} aria-hidden="true" /> : <AlertTriangle size={28} aria-hidden="true" />}
            </div>

            <h3 id={titleId} className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
            <p id={messageId} className="mb-6 text-sm leading-relaxed text-slate-600">
              {message}
            </p>

            <div className="flex flex-col gap-3">
              <Button
                variant={type === 'danger' ? 'danger' : 'primary'}
                size="lg"
                fullWidth
                onClick={() => { onConfirm(); onClose(); }}
                // Warnings get a dark amber that still passes 4.5:1 contrast with white text
                className={cn(type === 'warning' && "bg-accent-700 hover:bg-accent-800 active:bg-accent-800")}
              >
                {confirmText}
              </Button>
              {/* Callers pass cancelText="" for single-action notices; don't render an empty button */}
              {cancelText && (
                <Button variant="secondary" size="lg" fullWidth onClick={onClose}>
                  {cancelText}
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
