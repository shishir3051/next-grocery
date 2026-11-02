'use client';
import { useCart } from '@/context/CartContext';
import { Plus, Minus, Heart } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { useWishlist } from '@/context/WishlistContext';
import { getEffectivePrice, getSavings } from '@/lib/pricing';
import { cn } from '@/lib/cn';
import ProductDetailsDialog from './ProductDetailsDialog';

interface Product {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number;
  unit: string;
  images: string[];
  image?: string;
  imageData?: string;
  isOrganic?: boolean;
  isHalal?: boolean;
  stock: number;
  description?: string;
  category?: { name?: string } | string | null;
}

interface ProductCardProps {
  product: Product;
}

/** Stock below this number (but above zero) shows an "Only N left" hint. */
const LOW_STOCK_THRESHOLD = 10;

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, updateQuantity, items } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isAdding, setIsAdding] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const isWishlisted = isInWishlist(product._id);

  const cartItem = items.find(i => i.id === product._id);
  const qty = cartItem?.quantity ?? 0;
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock < LOW_STOCK_THRESHOLD;

  // discountPrice is the sale price, not an amount off (see lib/pricing.ts)
  const finalPrice = getEffectivePrice(product);
  const discountAmount = getSavings(product);
  const imageUrl = product.imageData || (product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400');

  const handleAdd = () => {
    setIsAdding(true);
    addItem({ ...product, price: finalPrice });
    setTimeout(() => setIsAdding(false), 300);
  };

  // The card is always visible: no scroll-triggered entrance animation, only a
  // cheap CSS hover state (shadow + border), so long catalogs never render blank.
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-[box-shadow,border-color] duration-200 hover:border-brand-200 hover:shadow-md">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-50 to-brand-50">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className={cn(
            'object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none',
            isOutOfStock && 'opacity-60 grayscale'
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 240px"
        />

        {/* The whole image opens the details dialog (badges sit above it; the heart stays its own button) */}
        {/* Mouse/touch shortcut only; the product name below is the keyboard and screen-reader path */}
        <button
          type="button"
          onClick={() => setShowDetails(true)}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 z-[5] cursor-pointer"
        />

        {/* Savings badge (deals use the accent colour, never red) */}
        {discountAmount > 0 && (
          <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-lg bg-accent-400 px-2 py-1 text-xs font-bold text-slate-900 shadow-sm">
            Save ৳{discountAmount}
          </span>
        )}

        {isOutOfStock && (
          <span className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-lg bg-slate-900/80 px-2 py-1 text-xs font-semibold text-white">
            Out of stock
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={`Save ${product.name} to wishlist`}
          aria-pressed={isWishlisted}
          className={cn(
            'absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-colors',
            isWishlisted
              ? 'border-brand-200 bg-brand-50 text-brand-600'
              : 'border-white/60 bg-white/90 text-slate-500 hover:bg-white hover:text-brand-600'
          )}
        >
          <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col p-3">
        {/* Meta row: unit + certification chips */}
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-500">{product.unit}</span>
          {product.isOrganic && (
            <span className="rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700">
              Organic
            </span>
          )}
          {product.isHalal && (
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
              Halal
            </span>
          )}
        </div>

        <h3 className="mb-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-slate-800">
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            aria-haspopup="dialog"
            className="block w-full text-left hover:text-brand-700 hover:underline underline-offset-2"
          >
            {/* The clamp must be inside the button: a button is one inline box, so clamping the h3 does nothing */}
            <span className="line-clamp-2">{product.name}</span>
          </button>
        </h3>

        {/* Price row: sale price in brand colour, original price struck through */}
        <div className="mb-3 mt-auto flex items-end justify-between gap-2">
          <p className="flex flex-wrap items-baseline gap-x-1.5 leading-tight">
            <span className="text-base font-bold tracking-tight text-brand-700">
              {discountAmount > 0 && <span className="sr-only">Sale price </span>}
              ৳{finalPrice}
            </span>
            {discountAmount > 0 && (
              <del className="text-xs text-slate-500">
                <span className="sr-only">Original price </span>৳{product.price}
              </del>
            )}
          </p>
          {isLowStock && (
            <span className="whitespace-nowrap text-xs font-medium text-accent-700">
              Only {product.stock} left
            </span>
          )}
        </div>

        {/* Cart control: full-width so it is easy to hit on phones */}
        {isOutOfStock ? (
          <div className="flex h-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-medium text-slate-500">
            Unavailable
          </div>
        ) : qty === 0 ? (
          <button
            type="button"
            onClick={handleAdd}
            aria-label={`Add ${product.name} to cart`}
            className={cn(
              'flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 text-sm font-semibold text-brand-700 transition-colors hover:border-brand-600 hover:bg-brand-600 hover:text-white active:scale-[0.98]',
              isAdding && 'border-brand-600 bg-brand-600 text-white'
            )}
          >
            <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
            Add
          </button>
        ) : (
          <div className="flex h-10 items-center justify-between rounded-lg bg-brand-600 text-white">
            <button
              type="button"
              onClick={() => updateQuantity(product._id, -1)}
              aria-label={`Decrease quantity of ${product.name}`}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-brand-700"
            >
              <Minus size={16} strokeWidth={2.5} aria-hidden="true" />
            </button>
            <span className="text-sm font-semibold tabular-nums" aria-live="polite">
              {qty} <span className="font-normal text-brand-50">in cart</span>
            </span>
            <button
              type="button"
              disabled={qty >= product.stock}
              onClick={() => updateQuantity(product._id, 1)}
              aria-label={`Increase quantity of ${product.name}`}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {showDetails && (
        <ProductDetailsDialog
          product={product}
          imageUrl={imageUrl}
          open={showDetails}
          onClose={() => setShowDetails(false)}
        />
      )}
    </article>
  );
}
