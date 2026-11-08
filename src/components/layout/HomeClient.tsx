'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import ProductGrid from '@/components/product/ProductGrid';
import SmartSearch from '@/components/ai/SmartSearch';
import RecipeSuggestions from '@/components/ai/RecipeSuggestions';
import HeroBanner from '@/components/layout/HeroBanner';
import { useCart } from '@/context/CartContext';
import { useSession } from 'next-auth/react';
import { Sparkles, X, SearchX } from 'lucide-react';
import Button from '@/components/ui/Button';

const FREE_DELIVERY_MIN = 500;

interface HomeClientProps {
  initialProducts: any[];
  initialCategories: any[];
}

// Mirrors the ProductGrid header + ProductCard layout so loading doesn't jump.
function SkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading products">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="skeleton h-7 w-40 rounded-lg" />
        <div className="skeleton h-5 w-16 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="skeleton aspect-[4/3] w-full rounded-none" />
            <div className="space-y-2 p-3">
              <div className="skeleton h-3 w-16 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton mt-3 h-10 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeedBanner({ onSeed, isSeeding }: { onSeed: () => void; isSeeding: boolean }) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-accent-200 bg-accent-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-accent-800">No products found</p>
        <p className="mt-0.5 text-sm text-accent-800">
          Your database is empty. Seed it with sample grocery data (development only).
        </p>
      </div>
      <Button size="sm" onClick={onSeed} loading={isSeeding} className="flex-shrink-0">
        {isSeeding ? 'Seeding…' : 'Seed database'}
      </Button>
    </div>
  );
}

/** Shown when a search, AI search or category returns nothing. */
function EmptyResults({ query, onReset }: { query: string; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <SearchX size={40} className="mb-3 text-slate-400" aria-hidden="true" />
      <h2 className="text-lg font-semibold text-slate-900">No products found</h2>
      <p className="mt-1 max-w-sm text-sm text-slate-600">
        {query
          ? <>We couldn&apos;t find anything for &ldquo;{query}&rdquo;. Try a different word or browse a category.</>
          : 'Nothing matches right now. Try a different search or browse another category.'}
      </p>
      <Button variant="secondary" className="mt-5" onClick={onReset}>
        Show all products
      </Button>
    </div>
  );
}

export default function HomeClient({ initialProducts, initialCategories }: HomeClientProps) {
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [activeSlug, setActiveSlug] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Dhaka');
  const [loading, setLoading] = useState(false); // Initially false because data is pre-fetched
  const [aiResults, setAiResults] = useState<any[] | null>(null);
  const [aiQuery, setAiQuery] = useState(''); // what the AI search was for; shown with its results
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const { items } = useCart();
  const { data: session } = useSession();
  // Seeding wipes the catalog, so only admins in development ever see the button
  // (the API route enforces the same rule on the server).
  const canSeed = process.env.NODE_ENV !== 'production' && session?.user?.role === 'admin';

  // Handle initialization and persisted location
  useEffect(() => {
    // A search submitted from the header on another page arrives as /?q=term
    const initialQuery = new URLSearchParams(window.location.search).get('q');
    if (initialQuery) setSearchQuery(initialQuery);

    // Load persisted location or Auto-Prompt
    const savedLoc = localStorage.getItem('userLocation');
    if (savedLoc) {
      setLocation(savedLoc);
    } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            // Our own geocode endpoint (no third-party call from the browser, cached, rate limited).
            const params = new URLSearchParams({ type: 'reverse', lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) });
            const res = await fetch(`/api/geocode?${params}`);
            const place = res.ok ? (await res.json())?.results?.[0] : null;
            if (place && (place.area || place.city)) {
              const cityName = place.city || 'Dhaka';
              const localArea = place.area || '';
              const locStr = localArea && cityName !== localArea ? `${localArea}, ${cityName}` : cityName;
              setLocation(locStr);
              localStorage.setItem('userLocation', locStr);
            }
          } catch (e) {
            console.error("Auto location fetch failed");
          }
        },
        (err) => console.warn("Auto location denied by user"),
        // City-level accuracy is enough here and avoids a slow, battery-heavy GPS fix
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 }
      );
    }
  }, []);

  // Close the mobile category drawer with Escape
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobileMenuOpen]);

  // Main Data Fetching Effect (Category or Search)
  useEffect(() => {
    // skip the initial mount fetch because we have initial data
    if (activeSlug === 'all' && !searchQuery.trim() && products === initialProducts) {
        return;
    }

    let isCancelled = false;
    setLoading(true);

    const performFetch = async () => {
      try {
        let url = "";
        if (searchQuery.trim()) {
           url = `/api/products?search=${encodeURIComponent(searchQuery)}`;
           setAiResults(null); 
        } else {
           url = activeSlug === 'all' ? '/api/products' : `/api/products?category=${activeSlug}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        
        if (!isCancelled) {
          setProducts(data?.products || []);
          setLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Fetch error:", err);
          setLoading(false);
        }
      }
    };

    const timer = searchQuery.trim() ? setTimeout(performFetch, 300) : null;
    if (!timer) performFetch();

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [activeSlug, searchQuery]);

  /**
   * Switches category and brings the shopper back to the top of the list. Without this,
   * picking a category while scrolled down swaps the products but leaves the view at
   * the bottom of the (now different) list.
   */
  const selectCategory = (slug: string) => {
    setActiveSlug(slug);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  // Reset search when the shopper picks a different category.
  // Skipped on first render so a ?q= search arriving from another page survives.
  const previousSlug = useRef(activeSlug);
  useEffect(() => {
    if (previousSlug.current === activeSlug) return;
    previousSlug.current = activeSlug;
    setSearchQuery('');
    setAiResults(null);
  }, [activeSlug]);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await fetch('/api/seed', { method: 'POST' });
      const catRes = await fetch('/api/categories');
      const catData = await catRes.json();
      setCategories(catData?.categories || []);
      const prodRes = await fetch('/api/products');
      const prodData = await prodRes.json();
      setProducts(prodData?.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSeeding(false);
    }
  };

  const displayedProducts = aiResults ?? products;

  // Group products by category
  const groupedByCategory = useMemo(() => {
    if (searchQuery || aiResults) return null;
    
    // Check if we are in a subcategory
    const isSubcategory = categories.some(c => 
      c.subcategories?.some((s: any) => s.slug === activeSlug)
    );
    
    if (isSubcategory) return null;

    const groups: Record<string, { title: string; products: any[] }> = {};
    displayedProducts.forEach((p: any) => {
      const catName = p.category?.name || 'Other';
      if (!groups[catName]) groups[catName] = { title: catName, products: [] };
      groups[catName].products.push(p);
    });
    return Object.values(groups);
  }, [activeSlug, displayedProducts, searchQuery, aiResults, categories]);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)]">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        location={location}
        onLocationChange={(loc) => {
          setLocation(loc);
          localStorage.setItem('userLocation', loc);
        }}
        onMenuToggle={() => setIsMobileMenuOpen(p => !p)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="flex flex-1" style={{ paddingTop: 'var(--navbar-height)' }}>
        {/* Mobile: tapping the dimmed page closes the category drawer */}
        {isMobileMenuOpen && (
          <button
            type="button"
            aria-label="Close categories"
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-x-0 bottom-0 top-16 z-30 bg-slate-900/40 md:hidden"
          />
        )}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}>
          <Sidebar
            categories={categories}
            activeSlug={activeSlug}
            onSelect={(slug) => {
              selectCategory(slug);
              setIsMobileMenuOpen(false);
            }}
          />
        </div>

        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:ml-[var(--sidebar-width)]">
          <div className="max-w-[1600px] mx-auto">
            {activeSlug === 'all' && !searchQuery && !aiResults && (
              <HeroBanner onSelectCategory={selectCategory} />
            )}

            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <SmartSearch
                onResults={(results, query) => {
                  setAiResults(results);
                  setAiQuery(query);
                  setSearchQuery('');
                }}
                onReset={() => setAiResults(null)}
                hasResults={!!aiResults}
                location={location}
              />
              <RecipeSuggestions />
              {(aiResults || searchQuery) && (
                <Button
                  variant="ghost"
                  onClick={() => { setAiResults(null); setSearchQuery(''); }}
                >
                  <X size={16} aria-hidden="true" />
                  Clear filters
                </Button>
              )}
              {/* Announces result changes to screen readers */}
              <div aria-live="polite" className="flex flex-wrap items-center gap-3">
                {searchQuery && (
                  <p className="text-sm text-slate-600">
                    Results for <span className="font-semibold text-slate-900">&ldquo;{searchQuery}&rdquo;</span>
                  </p>
                )}
                {aiResults && (
                  <p className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Sparkles size={16} className="text-brand-600" aria-hidden="true" />
                    <span>
                      AI found <span className="font-semibold text-slate-900">{aiResults.length}</span> {aiResults.length === 1 ? 'product' : 'products'}
                      {aiQuery && <> for <span className="font-semibold text-slate-900">&ldquo;{aiQuery}&rdquo;</span></>}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {canSeed && !loading && products.length === 0 && !searchQuery && (
              <SeedBanner onSeed={handleSeed} isSeeding={isSeeding} />
            )}

            {loading ? (
              <SkeletonGrid count={10} />
            ) : displayedProducts.length === 0 && (searchQuery || aiResults || activeSlug !== 'all') ? (
              <EmptyResults
                query={searchQuery || (aiResults ? aiQuery : '')}
                onReset={() => {
                  setAiResults(null);
                  setSearchQuery('');
                  setActiveSlug('all');
                }}
              />
            ) : groupedByCategory ? (
              groupedByCategory.map(group => (
                <ProductGrid
                  key={group.title}
                  products={group.products}
                  title={group.title}
                />
              ))
            ) : (
              <ProductGrid
                products={displayedProducts}
                title={
                  aiResults ? 'AI Recommendations' :
                  searchQuery ? `Search: "${searchQuery}"` :
                  (() => {
                    for (const c of categories) {
                      if (c.slug === activeSlug) return c.name;
                      const sub = c.subcategories?.find((s: any) => s.slug === activeSlug);
                      if (sub) return sub.name;
                    }
                    return 'Products';
                  })()
                }
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
