'use client';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChefHat, X, Clock, Loader2, Users, Plus, Check, AlertCircle, RotateCcw, Info, ChevronDown } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Button from '@/components/ui/Button';

// Same limits the API validates, so a big cart never causes a 400.
const MAX_CART_ITEMS = 30;
const MAX_ITEM_LENGTH = 80;
const GENERIC_ERROR = 'Recipe ideas are unavailable right now. Please try again.';

// --- Shape returned by /api/ai/recipes ----------------------------------------------------------

interface RecipeProduct {
  _id: string;
  name: string;
  price: number;
  unit: string;
  image: string | null;
  stock: number;
}

interface Recipe {
  name: string;
  time: string;
  servings: number;
  description: string;
  usesFromCart: string[];
  steps: string[];
  missing: { name: string; product: RecipeProduct | null }[];
}

type Mode = 'ai' | 'curated';
type Status = 'idle' | 'loading' | 'success' | 'error';

/** Cart names as the API expects them: unique, trimmed, length-capped, at most 30. */
function cartNamesFor(items: { name: string }[]): string[] {
  const names = items.map(i => i.name.trim().slice(0, MAX_ITEM_LENGTH)).filter(Boolean);
  return [...new Set(names)].slice(0, MAX_CART_ITEMS);
}

export default function RecipeSuggestions() {
  const { items, addItem } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mode, setMode] = useState<Mode>('ai');
  const [errorMessage, setErrorMessage] = useState(GENERIC_ERROR);
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Cart key of the last successful fetch: reopening with the same cart reuses the result.
  const lastFetchedKeyRef = useRef<string | null>(null);
  // The element that opened the dialog, so focus can go back to it on close (keyboard users).
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const cartNames = useMemo(() => cartNamesFor(items), [items]);
  const cartKey = useMemo(() => cartNames.map(n => n.toLowerCase()).sort().join('\n'), [cartNames]);
  const cartIds = useMemo(() => new Set(items.map(i => i.id)), [items]);

  const fetchRecipes = async () => {
    if (cartNames.length === 0) return;
    abortRef.current?.abort(); // only the latest request may update the dialog
    const controller = new AbortController();
    abortRef.current = controller;
    const requestKey = cartKey;

    setStatus('loading');
    try {
      const res = await fetch('/api/ai/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems: cartNames }),
        signal: controller.signal,
      });
      const data: unknown = await res.json().catch(() => null);
      if (controller.signal.aborted) return;
      const payload = (data ?? {}) as { recipes?: unknown; mode?: unknown; error?: unknown };

      if (!res.ok || !Array.isArray(payload.recipes)) {
        // 400/429 messages are fixed server strings and safe to show; anything else gets the generic text.
        const serverMessage = res.status === 400 || res.status === 429 ? payload.error : null;
        setErrorMessage(typeof serverMessage === 'string' ? serverMessage : GENERIC_ERROR);
        setStatus('error');
        return;
      }

      setRecipes(payload.recipes as Recipe[]);
      setMode(payload.mode === 'curated' ? 'curated' : 'ai');
      setStatus('success');
      lastFetchedKeyRef.current = requestKey;
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error('Recipe suggestions request failed:', err instanceof Error ? err.message : err);
      setErrorMessage(GENERIC_ERROR);
      setStatus('error');
    }
  };

  const handleOpen = () => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setIsOpen(true);
    // Ask again when the cart changed, the last try failed, or the last answer was the no-AI
    // fallback (so AI ideas show up as soon as the service is back). Otherwise reuse the result.
    if (cartKey !== lastFetchedKeyRef.current || status !== 'success' || mode === 'curated') fetchRecipes();
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Drop an unfinished request; the next open starts a fresh one (aborting a finished one is a no-op).
    abortRef.current?.abort();
    setStatus(current => (current === 'loading' ? 'idle' : current));
    returnFocusRef.current?.focus();
    returnFocusRef.current = null;
  }, []);

  const handleAdd = (product: RecipeProduct) => {
    // Matches what ProductCard passes: price is already the effective (sale) price.
    // addItem only shows a toast (the cart drawer stays closed), so the shopper stays in this
    // dialog and can keep adding ingredients.
    addItem({ _id: product._id, name: product.name, price: product.price, unit: product.unit, image: product.image ?? undefined, stock: product.stock });
  };

  // Cancel any in-flight request when the component unmounts
  useEffect(() => () => abortRef.current?.abort(), []);

  // Move focus into the dialog when it opens, and let Escape close it
  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, handleClose]);

  return (
    <>
      {/* Same neutral style as "AI search" so the toolbar reads as one set */}
      <Button variant="secondary" onClick={handleOpen} aria-haspopup="dialog">
        <ChefHat size={16} className="text-brand-600" aria-hidden="true" />
        Recipes
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600" aria-hidden="true">
                  <ChefHat size={18} />
                </div>
                <div>
                  <h2 id={titleId} className="text-base font-semibold text-slate-900">Recipe suggestions</h2>
                  <p className="text-sm text-slate-500">Based on your cart items</p>
                </div>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={handleClose}
                aria-label="Close recipe suggestions"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5" aria-live="polite" aria-busy={status === 'loading'}>
              {cartNames.length === 0 ? (
                <div className="py-10 text-center">
                  <ChefHat size={44} className="mx-auto mb-3 text-slate-300" aria-hidden="true" />
                  <p className="text-sm font-medium text-slate-700">Your cart is empty</p>
                  <p className="mt-1 text-sm text-slate-500">Add a few items and we&apos;ll suggest recipes.</p>
                </div>
              ) : status === 'loading' || status === 'idle' ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10">
                  <Loader2 size={32} className="animate-spin text-brand-600" aria-hidden="true" />
                  <p className="text-sm text-slate-600">Cooking up ideas from your cart…</p>
                </div>
              ) : status === 'error' ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center" role="alert">
                  <AlertCircle size={36} className="text-danger-600" aria-hidden="true" />
                  <p className="max-w-sm text-sm text-slate-700">{errorMessage}</p>
                  <Button variant="secondary" size="sm" onClick={fetchRecipes}>
                    <RotateCcw size={14} aria-hidden="true" />
                    Retry
                  </Button>
                </div>
              ) : recipes.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  No recipe ideas for these items yet. Try adding a few more ingredients.
                </p>
              ) : (
                <>
                  {mode === 'curated' && (
                    <p className="mb-4 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                      <Info size={14} className="mt-0.5 flex-shrink-0 text-slate-500" aria-hidden="true" />
                      Classic home-style recipes picked for your cart. AI suggestions are unavailable right now.
                    </p>
                  )}
                  <ul className="space-y-3">
                    {recipes.map((recipe, i) => (
                      <RecipeCard key={`${recipe.name}-${i}`} recipe={recipe} cartIds={cartIds} onAdd={handleAdd} />
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// --- One recipe ------------------------------------------------------------------------------------

interface RecipeCardProps {
  recipe: Recipe;
  cartIds: Set<string>;
  onAdd: (product: RecipeProduct) => void;
}

function RecipeCard({ recipe, cartIds, onAdd }: RecipeCardProps) {
  const sold = recipe.missing.filter((m): m is { name: string; product: RecipeProduct } => m.product !== null);
  const notSold = recipe.missing.filter(m => m.product === null);

  return (
    <li className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-brand-200">
      <h3 className="text-sm font-semibold text-slate-900">{recipe.name}</h3>

      {/* Time and servings */}
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {recipe.time && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            <Clock size={12} aria-hidden="true" />
            {recipe.time}
          </span>
        )}
        {recipe.servings > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            <Users size={12} aria-hidden="true" />
            Serves {recipe.servings}
          </span>
        )}
      </div>

      {recipe.description && <p className="mt-2 text-sm leading-relaxed text-slate-600">{recipe.description}</p>}

      {/* Cart items this recipe uses */}
      {recipe.usesFromCart.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-semibold text-slate-700">Uses from your cart</p>
          <div className="flex flex-wrap gap-1.5">
            {recipe.usesFromCart.map(name => (
              <span key={name} className="rounded-full border border-success-200 bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing ingredients: ones we sell can be added straight to the cart */}
      {recipe.missing.length > 0 && (
        <div className="mt-3 rounded-lg bg-accent-50 p-3">
          <p className="mb-2 text-xs font-semibold text-accent-800">You may also need</p>
          {sold.length > 0 && (
            <ul className="mb-2 space-y-1.5">
              {sold.map(({ name, product }) => (
                <MissingProductRow key={name} label={name} product={product} inCart={cartIds.has(product._id)} onAdd={onAdd} />
              ))}
            </ul>
          )}
          {notSold.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {notSold.map(({ name }) => (
                <span key={name} className="rounded-full border border-accent-200 bg-white px-2 py-0.5 text-xs text-accent-800">
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Steps stay collapsed so the list is easy to scan */}
      {recipe.steps.length > 0 && (
        <details className="group mt-3">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg text-xs font-semibold text-brand-700 hover:text-brand-800 [&::-webkit-details-marker]:hidden">
            <ChevronDown size={14} className="transition-transform group-open:rotate-180" aria-hidden="true" />
            How to cook ({recipe.steps.length} steps)
          </summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-slate-600">
            {recipe.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </details>
      )}
    </li>
  );
}

interface MissingProductRowProps {
  label: string;
  product: RecipeProduct;
  inCart: boolean;
  onAdd: (product: RecipeProduct) => void;
}

function MissingProductRow({ label, product, inCart, onAdd }: MissingProductRowProps) {
  const inStock = product.stock > 0;

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-800">{product.name}</p>
        <p className="text-xs text-slate-500">
          {label !== product.name && <span>For {label.toLowerCase()} · </span>}
          ৳{product.price} / {product.unit}
        </p>
      </div>
      {inCart ? (
        <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-success-50 px-2.5 py-1 text-xs font-semibold text-success-700">
          <Check size={12} aria-hidden="true" />
          In cart
        </span>
      ) : inStock ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onAdd(product)}
          aria-label={`Add ${product.name} to cart`}
          className="flex-shrink-0"
        >
          <Plus size={14} aria-hidden="true" />
          Add
        </Button>
      ) : (
        <span className="flex-shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">Out of stock</span>
      )}
    </li>
  );
}
