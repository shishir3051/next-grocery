'use client';
import { useEffect, useRef } from 'react';
import { useCart } from '@/context/CartContext';
import { X, Trash2, ShoppingCart, Zap, ArrowRight, CheckCircle2, ShieldCheck, Minus, Plus } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const FREE_DELIVERY_THRESHOLD = 500; // ৳500

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, subtotal, isCartOpen, setIsCartOpen } = useCart();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const progress = Math.min((subtotal / FREE_DELIVERY_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_DELIVERY_THRESHOLD - subtotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Move keyboard focus into the drawer when it opens, and give it back to the
  // element that opened it (e.g. the header cart button) when it closes.
  useEffect(() => {
    if (!isCartOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, [isCartOpen]);

  // Escape closes the drawer.
  useEffect(() => {
    if (!isCartOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsCartOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, setIsCartOpen]);

  return (
    <>
      {/* Backdrop: sits above the fixed header (z-50) */}
      {isCartOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/*
        Drawer. When closed it is translated fully off-screen AND made invisible,
        so no shadow strip bleeds onto the page and it can't be tabbed into.
      */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className={cn(
          'fixed inset-y-0 right-0 z-[70] flex w-full max-w-[400px] flex-col bg-white duration-300 ease-out',
          // Tailwind v4 `translate-x-*` uses the CSS `translate` property, so it must be listed here.
          // Opening: visibility flips instantly (so focus() works). Closing: visibility waits for the slide-out.
          isCartOpen
            ? 'visible translate-x-0 shadow-xl transition-[translate,transform]'
            : 'invisible pointer-events-none translate-x-full transition-[translate,transform,visibility]'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-brand-600" aria-hidden="true" />
            <h2 id="cart-drawer-title" className="text-lg font-semibold text-slate-900">My cart</h2>
            {itemCount > 0 && (
              <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">
                {itemCount}
                <span className="sr-only"> items</span>
              </span>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close cart"
            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Free delivery progress */}
        <div className="border-b border-slate-200 bg-brand-50 px-5 py-3">
          {remaining > 0 ? (
            <p className="mb-2 flex items-center gap-1.5 text-sm text-slate-700">
              <Zap size={14} className="text-accent-500" aria-hidden="true" />
              Add <span className="font-semibold text-brand-700">৳{remaining}</span> more for free delivery
            </p>
          ) : (
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-success-700">
              <CheckCircle2 size={16} aria-hidden="true" />
              You&apos;ve unlocked free delivery
            </p>
          )}
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-brand-100"
            role="progressbar"
            aria-label="Progress towards free delivery"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-500',
                remaining > 0 ? 'bg-brand-500' : 'bg-success-500'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
                <ShoppingCart size={28} className="text-brand-600" aria-hidden="true" />
              </div>
              <p className="font-semibold text-slate-800">Your cart is empty</p>
              <p className="mt-1 text-sm text-slate-500">Add items to get started.</p>
              <Button variant="secondary" size="sm" className="mt-5" onClick={() => setIsCartOpen(false)}>
                Continue shopping
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map(item => (
                <li key={item.id} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  {item.image && (
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-50">
                      <Image src={item.imageData || item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=100'} alt={item.name} fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">{item.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{item.unit}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.name} from cart`}
                        className="-mr-2 -mt-2 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-danger-50 hover:text-danger-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                      <p className="text-sm font-bold text-brand-700">৳{(item.price * item.quantity).toFixed(0)}</p>
                      {/* Quantity stepper */}
                      <div className="flex items-center rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="flex h-10 w-10 items-center justify-center rounded-l-lg text-slate-600 transition-colors hover:bg-slate-100"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-slate-900" aria-live="polite">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="flex h-10 w-10 items-center justify-center rounded-r-lg text-brand-700 transition-colors hover:bg-brand-50"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer CTA */}
        {items.length > 0 && (
          <div className="space-y-3 border-t border-slate-200 bg-white p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-base font-semibold text-slate-700">Subtotal</span>
              <span className="text-2xl font-bold text-slate-900">৳{subtotal.toFixed(0)}</span>
            </div>
            <p className="text-xs text-slate-500">Delivery fee and coupons are applied at checkout.</p>

            <Button
              href="/checkout"
              onClick={() => setIsCartOpen(false)}
              size="lg"
              fullWidth
              className="group"
            >
              Proceed to checkout
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Button>

            <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck size={14} aria-hidden="true" />
              Safe and secure checkout
            </p>
          </div>
        )}
      </div>
    </>
  );
}
