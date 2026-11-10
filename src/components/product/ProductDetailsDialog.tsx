'use client';

import SafeImage from '@/components/ui/SafeImage';
import { useId, useRef, useState } from 'react';
import { Heart, Minus, Plus, ShoppingCart, Truck, ShieldCheck } from 'lucide-react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { getEffectivePrice, getSavings } from '@/lib/pricing';
import { getCategoryTint } from '@/lib/categoryColors';
import { cn } from '@/lib/cn';

export interface ProductDetails {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number;
  unit: string;
  images?: string[];
  image?: string;
  imageData?: string;
  description?: string;
  isOrganic?: boolean;
  isHalal?: boolean;
  stock: number;
  /** Populated category document, or just its id when not populated. */
  category?: { name?: string } | string | null;
}

/** Stock below this number (but above zero) shows an "Only N left" hint. Same as ProductCard. */
const LOW_STOCK_THRESHOLD = 10;
/** Most units of one product a shopper can add at once (the order API allows 100). */
const MAX_PER_ADD = 20;

// Stepper buttons use aria-disabled (not `disabled`) so keyboard focus stays put at the limits.
const STEP_BUTTON = 'flex items-center justify-center transition-colors aria-disabled:cursor-not-allowed aria-disabled:opacity-40';

interface ProductDetailsDialogProps {
  product: ProductDetails;
  imageUrl: string;
  open: boolean;
  onClose: () => void;
}

/** Product information in a dialog, opened by clicking a product card's image or name. */
export default function ProductDetailsDialog({ product, imageUrl, open, onClose }: ProductDetailsDialogProps) {
  const { addItem, updateQuantity, items } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const headingId = useId();
  const actionsRef = useRef<HTMLDivElement>(null);

  const inCart = items.find(i => i.id === product._id)?.quantity ?? 0;
  const isWishlisted = isInWishlist(product._id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock < LOW_STOCK_THRESHOLD;
  const finalPrice = getEffectivePrice(product);
  const savings = getSavings(product);
  const categoryName = typeof product.category === 'object' && product.category ? product.category.name : undefined;
  const maxAddable = Math.max(0, Math.min(MAX_PER_ADD, product.stock - inCart));
  // What the stepper shows and what gets added; clamped if stock left shrinks while open.
  const shownQty = Math.max(1, Math.min(quantity, maxAddable));

  const focusAddButton = () => actionsRef.current?.querySelector<HTMLButtonElement>('[data-add-to-cart]')?.focus();

  const handleAddToCart = () => {
    if (maxAddable <= 0) return;
    addItem({ ...product, price: finalPrice }, shownQty); // atomic, stock-clamped; confirms with a toast
    setQuantity(1);
    onClose();
  };

  const removeOneFromCart = () => {
    // When the last unit goes, this row disappears: keep keyboard focus inside the dialog.
    if (inCart === 1) requestAnimationFrame(focusAddButton);
    updateQuantity(product._id, -1);
  };

  return (
    <Dialog open={open} onClose={onClose} title={product.name} labelledBy={headingId} hideTitle size="xl">
      <div className="grid md:grid-cols-2">
        {/* Image: capped on phones so the details and actions stay in view */}
        <div className="relative aspect-[4/3] max-h-[40dvh] w-full bg-gradient-to-br from-slate-50 to-brand-50 md:aspect-auto md:max-h-none md:min-h-[420px]">
          <SafeImage
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 448px"
            className={cn('object-cover', isOutOfStock && 'opacity-60 grayscale')}
          />
          {savings > 0 && (
            <span className="absolute left-3 top-3 rounded-lg bg-accent-400 px-2.5 py-1 text-sm font-bold text-slate-900 shadow-sm">
              Save ৳{savings}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <div>
            {categoryName && (
              <p className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span aria-hidden="true" className={cn('h-3 w-1 rounded-full', getCategoryTint(categoryName).marker)} />
                {categoryName}
              </p>
            )}
            <h2 id={headingId} className="pr-10 text-xl font-bold leading-tight text-slate-900 sm:text-2xl">{product.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">{product.unit}</span>
              {product.isOrganic && (
                <span className="rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-medium text-success-700">Organic</span>
              )}
              {product.isHalal && (
                <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">Halal</span>
              )}
            </div>
          </div>

          {/* Price and stock */}
          <div className="flex flex-wrap items-end justify-between gap-3 border-y border-slate-100 py-3">
            <p className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-brand-700">
                {savings > 0 && <span className="sr-only">Sale price </span>}৳{finalPrice}
              </span>
              {savings > 0 && (
                <del className="text-sm text-slate-500"><span className="sr-only">Original price </span>৳{product.price}</del>
              )}
              <span className="text-sm text-slate-500">/ {product.unit}</span>
            </p>
            <p
              className={cn(
                'text-sm font-medium',
                isOutOfStock ? 'text-danger-700' : isLowStock ? 'text-accent-700' : 'text-success-700'
              )}
            >
              {isOutOfStock ? 'Out of stock' : isLowStock ? `Only ${product.stock} left` : 'In stock'}
            </p>
          </div>

          {/* Description */}
          <div>
            <h3 className="mb-1 text-sm font-semibold text-slate-900">About this product</h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {product.description?.trim() || 'Fresh from our partners, quality checked and packed to order.'}
            </p>
          </div>

          <ul className="space-y-1.5 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <Truck size={16} className="text-brand-600" aria-hidden="true" /> Delivered within 60 minutes
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-brand-600" aria-hidden="true" /> Quality checked before dispatch
            </li>
          </ul>

          {/* Actions: sticky at the bottom of the sheet on phones, inline from md up */}
          <div
            ref={actionsRef}
            className="sticky bottom-0 -mx-5 mt-auto space-y-2 border-t border-slate-100 bg-white px-5 pb-1 pt-3 sm:-mx-6 sm:px-6 md:static md:mx-0 md:border-0 md:px-0 md:pb-0 md:pt-2"
          >
            {inCart > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800">
                <span aria-live="polite">
                  <span className="font-semibold tabular-nums">{inCart}</span> in your cart
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={removeOneFromCart}
                    aria-label={`Remove one ${product.name} from cart`}
                    className={cn(STEP_BUTTON, 'h-9 w-9 rounded-lg text-brand-700 hover:bg-brand-100')}
                  >
                    <Minus size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (inCart < product.stock) updateQuantity(product._id, 1); }}
                    aria-disabled={inCart >= product.stock || undefined}
                    aria-label={`Add one more ${product.name} to cart`}
                    className={cn(STEP_BUTTON, 'h-9 w-9 rounded-lg text-brand-700 hover:bg-brand-100')}
                  >
                    <Plus size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {!isOutOfStock && maxAddable > 0 && (
                <div className="flex h-11 items-center rounded-xl border border-slate-300" role="group" aria-label="Quantity to add">
                  <button
                    type="button"
                    onClick={() => { if (shownQty > 1) setQuantity(shownQty - 1); }}
                    aria-disabled={shownQty <= 1 || undefined}
                    aria-label="Decrease quantity"
                    className={cn(STEP_BUTTON, 'h-11 w-10 text-slate-600 hover:text-slate-900')}
                  >
                    <Minus size={16} aria-hidden="true" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                    {shownQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => { if (shownQty < maxAddable) setQuantity(shownQty + 1); }}
                    aria-disabled={shownQty >= maxAddable || undefined}
                    aria-label="Increase quantity"
                    className={cn(STEP_BUTTON, 'h-11 w-10 text-slate-600 hover:text-slate-900')}
                  >
                    <Plus size={16} aria-hidden="true" />
                  </button>
                </div>
              )}
              <Button
                data-add-to-cart=""
                className="flex-1"
                onClick={handleAddToCart}
                disabled={isOutOfStock || maxAddable === 0}
              >
                <ShoppingCart size={18} aria-hidden="true" />
                {isOutOfStock
                  ? 'Out of stock'
                  : maxAddable === 0
                    ? 'All available stock is in your cart'
                    : (
                      <>
                        {/* Short label on phones so it stays on one line */}
                        <span className="sm:hidden">Add</span>
                        <span className="hidden sm:inline">Add to cart</span>
                        <span className="tabular-nums">· ৳{finalPrice * shownQty}</span>
                      </>
                    )}
              </Button>
              <button
                type="button"
                onClick={() => toggleWishlist({ ...product, images: product.images ?? [] })}
                aria-label={`Save ${product.name} to wishlist`}
                aria-pressed={isWishlisted}
                className={cn(
                  'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border transition-colors',
                  isWishlisted ? 'border-brand-200 bg-brand-50 text-brand-600' : 'border-slate-300 text-slate-500 hover:text-brand-600'
                )}
              >
                <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
