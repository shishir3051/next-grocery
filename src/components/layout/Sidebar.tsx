'use client';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface SubCategory {
  _id: string;
  name: string;
  slug: string;
  icon: string;
}

interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  subcategories: SubCategory[];
}

interface SidebarProps {
  categories: CategoryItem[];
  activeSlug?: string;
  onSelect: (slug: string) => void;
}

export default function Sidebar({ categories, activeSlug, onSelect }: SidebarProps) {
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggle = (slug: string) => {
    setExpanded(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  return (
    <aside
      className="fixed top-16 left-0 bottom-0 z-20 overflow-y-auto bg-white border-r border-slate-100 shadow-sm"
      style={{ width: 'var(--sidebar-width)' }}
    >
      <div className="p-3">
        {/* All Products */}
        <button
          onClick={() => onSelect('all')}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold mb-1 transition-all ${
            activeSlug === 'all'
              ? 'bg-teal-500 text-white shadow-sm'
              : 'text-slate-700 hover:bg-teal-50 hover:text-teal-700'
          }`}
        >
          <span className="text-lg">🛒</span>
          <span>All Products</span>
        </button>

        <div className="pt-1 mt-1 border-t border-slate-100">
          {categories.map(cat => {
            const isOpen = expanded.includes(cat.slug);
            const hasChildren = cat.subcategories && cat.subcategories.length > 0;

            return (
              <div key={cat._id} className="mb-0.5">
                {/* Parent Category */}
                <button
                  onClick={() => {
                    onSelect(cat.slug);
                    if (hasChildren) {
                      toggle(cat.slug);
                    }
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeSlug === cat.slug
                      ? 'bg-teal-500 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-teal-50 hover:text-teal-700'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="flex-1 text-left leading-tight">{cat.name}</span>
                  {hasChildren && (
                    <span className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                      <ChevronRight size={14} />
                    </span>
                  )}
                </button>

                {/* Subcategories Accordion */}
                {hasChildren && (
                  <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
                    <div className="ml-4 pl-2 border-l-2 border-teal-100 mt-0.5 mb-1">
                      {cat.subcategories.map(sub => (
                        <button
                          key={sub._id}
                          onClick={() => onSelect(sub.slug)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all mb-0.5 ${
                            activeSlug === sub.slug
                              ? 'bg-teal-500 text-white shadow-sm'
                              : 'text-slate-600 hover:bg-teal-50 hover:text-teal-700'
                          }`}
                        >
                          <span>{sub.icon}</span>
                          <span className="text-left">{sub.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
