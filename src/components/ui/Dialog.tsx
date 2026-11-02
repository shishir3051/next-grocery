'use client';

import { useEffect, useId, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Accessible modal dialog shared across the app (see docs/design/DESIGN_SYSTEM.md):
 * - rendered in a portal above everything (z-[70], above the header and cart drawer)
 * - role="dialog" + aria-modal + aria-labelledby
 * - Escape and backdrop click close it
 * - focus moves inside on open, Tab is trapped inside, and focus returns to the
 *   element that opened it on close
 * - the page behind does not scroll while it is open
 */
interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Visible title (also the accessible name). */
  title: React.ReactNode;
  /** Hide the title visually but keep it for screen readers (when the content has its own heading). */
  hideTitle?: boolean;
  /** Id of a visible heading inside the content to use as the accessible name (no duplicate title is rendered). */
  labelledBy?: string;
  children: React.ReactNode;
  /** Max width of the panel. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' } as const;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const subscribeNoop = () => () => {};
const useIsClient = () => useSyncExternalStore(subscribeNoop, () => true, () => false);

export default function Dialog({ open, onClose, title, hideTitle = false, labelledBy, children, size = 'md', className }: DialogProps) {
  const isClient = useIsClient();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // Keep the latest onClose without re-running the open/close effect on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Lock page scroll. html has `scrollbar-gutter: stable` (globals.css), so hiding the
    // scrollbar doesn't shift the page or the fixed header sideways.
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    // Focus the first control (or the panel itself).
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.offsetParent !== null);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      // Focus can land outside the panel (e.g. a focused control became disabled): bring it back.
      if (!panel.contains(document.activeElement)) {
        e.preventDefault();
        (e.shiftKey ? lastEl : firstEl).focus();
        return;
      }
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      // The opener may have been removed meanwhile (e.g. un-wishlisting on the wishlist page).
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [open]);

  if (!open || !isClient) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => onCloseRef.current()}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm motion-safe:animate-[fadeIn_150ms_ease-out]"
      />

      {/* Panel: a bottom sheet on phones, a centred card from sm up */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy ?? titleId}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl outline-none sm:rounded-2xl',
          'motion-safe:animate-[dialogIn_180ms_ease-out]',
          SIZES[size],
          className
        )}
      >
        <div className={cn('flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3', hideTitle && 'absolute right-0 top-0 z-10 border-none bg-transparent p-2')}>
          {!labelledBy && (
            <h2 id={titleId} className={cn('text-base font-semibold text-slate-900', hideTitle && 'sr-only')}>
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label="Close"
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800',
              hideTitle && 'bg-white/90 shadow-sm'
            )}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">{children}</div>
      </div>
    </div>,
    document.body
  );
}
