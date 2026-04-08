'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import ProductGrid from '@/components/product/ProductGrid';
import SmartSearch from '@/components/ai/SmartSearch';
import RecipeSuggestions from '@/components/ai/RecipeSuggestions';
import HeroBanner from '@/components/layout/HeroBanner';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, Sparkles } from 'lucide-react';

const FREE_DELIVERY_MIN = 500;



function SkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="skeleton h-7 w-40 rounded-lg" />
        <div className="flex-1 h-px bg-slate-100" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100">
            <div className="skeleton w-full" style={{ paddingTop: '75%' }} />
            <div className="p-3 space-y-2">
              <div className="skeleton h-3 w-16 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-3/4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeedBanner({ onSeed }: { onSeed: () => void }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-amber-800">No products found</p>
        <p className="text-xs text-amber-600 mt-0.5">
          Your database is empty. Click to seed it with real grocery data.
        </p>
      </div>
      <button
        onClick={onSeed}
        className="flex-shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg transition-all"
      >
        Seed Database
      </button>
    </div>
  );
}

export default function HomePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeSlug, setActiveSlug] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Dhaka');
  const [loading, setLoading] = useState(true);
  const [aiResults, setAiResults] = useState<any[] | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const { items } = useCart();

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => setCategories(data?.categories || []))
      .catch(console.error);
  }, []);

  // Fetch products when activeSlug changes
  useEffect(() => {
    setLoading(true);
    setSearchQuery('');
    setAiResults(null);
    const url = activeSlug === 'all' ? '/api/products' : `/api/products?category=${activeSlug}`;
    fetch(url)
      .then(r => r.json())
      .then(data => setProducts(data?.products || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeSlug]);

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Re-fetch for current category
      const url = activeSlug === 'all' ? '/api/products' : `/api/products?category=${activeSlug}`;
      fetch(url)
        .then(r => r.json())
        .then(data => setProducts(data?.products || []))
        .catch(console.error);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`)
        .then(r => r.json())
        .then(data => setProducts(data?.products || []))
        .catch(console.error);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await fetch('/api/seed', { method: 'POST' });
      // Reload data
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

  // Group products by category for "all" view
  const groupedByCategory = useMemo(() => {
    if (activeSlug !== 'all' || searchQuery || aiResults) return null;
    const groups: Record<string, { title: string; products: any[] }> = {};
    displayedProducts.forEach((p: any) => {
      const catName = p.category?.name || 'Other';
      if (!groups[catName]) groups[catName] = { title: catName, products: [] };
      groups[catName].products.push(p);
    });
    return Object.values(groups);
  }, [activeSlug, displayedProducts, searchQuery, aiResults]);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)]">
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        location={location}
        onLocationChange={setLocation}
        onMenuToggle={() => setIsMobileMenuOpen(p => !p)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="flex flex-1" style={{ paddingTop: 'var(--navbar-height)' }}>
        {/* Sidebar — hidden on mobile unless open */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}>
          <Sidebar
            categories={categories}
            activeSlug={activeSlug}
            onSelect={(slug) => {
              setActiveSlug(slug);
              setIsMobileMenuOpen(false);
            }}
          />
        </div>

        {/* Main content area */}
        <main
          className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:ml-[var(--sidebar-width)]"
        >
          {/* Content Wrapper */}
          <div className="max-w-[1600px] mx-auto">
            {/* Hero */}
            {activeSlug === 'all' && !searchQuery && !aiResults && (
              <HeroBanner onSelectCategory={(slug) => setActiveSlug(slug)} />
            )}

            {/* AI Tools Bar */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <SmartSearch
                onResults={(results) => {
                  setAiResults(results);
                  setSearchQuery('');
                }}
                onReset={() => setAiResults(null)}
                hasResults={!!aiResults}
                location={location}
              />
              <RecipeSuggestions />
              {(aiResults || searchQuery) && (
                <button
                  onClick={() => { setAiResults(null); setSearchQuery(''); }}
                  className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all font-medium"
                >
                  ✕ Clear filters
                </button>
              )}
              {searchQuery && (
                <p className="text-sm text-slate-500">
                  Results for <span className="font-semibold text-teal-600">"{searchQuery}"</span>
                </p>
              )}
              {aiResults && (
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <Sparkles size={13} className="text-violet-500" />
                  AI found <span className="font-semibold text-violet-600">{aiResults.length}</span> products
                </p>
              )}
            </div>

            {/* Seed Banner */}
            {!loading && products.length === 0 && !searchQuery && (
              <SeedBanner onSeed={handleSeed} />
            )}

            {/* Product Content */}
            {loading ? (
              <SkeletonGrid count={10} />
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
                  categories.find(c =>
                    c.slug === activeSlug ||
                    c.subcategories?.find((s: any) => s.slug === activeSlug)
                  )?.name
                }
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
