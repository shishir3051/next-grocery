'use client';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
            activeSlug === 'all'
              ? 'bg-teal-50 text-teal-700 font-bold ring-1 ring-inset ring-teal-600/20 shadow-sm'
              : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <span className={`text-lg flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${activeSlug === 'all' ? 'bg-white shadow-sm ring-1 ring-black/5' : 'bg-slate-50 grayscale hover:grayscale-0'}`}>
            🛒
          </span>
          <span>All Products</span>
        </button>

        <div className="pt-2 mt-2 border-t border-slate-100">
          {categories.map(cat => {
            const isOpen = expanded.includes(cat.slug);
            const hasChildren = cat.subcategories && cat.subcategories.length > 0;

            return (
              <div key={cat._id} className="mb-1.5">
                {/* Parent Category */}
                <button
                  onClick={() => {
                    onSelect(cat.slug);
                    if (hasChildren) {
                      toggle(cat.slug);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                    activeSlug === cat.slug
                      ? 'bg-teal-50 text-teal-700 font-bold ring-1 ring-inset ring-teal-600/20 shadow-sm'
                      : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className={`text-lg flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${activeSlug === cat.slug ? 'bg-white shadow-sm ring-1 ring-black/5' : 'bg-slate-50 grayscale hover:grayscale-0'}`}>
                    {cat.icon}
                  </span>
                  <span className={`flex-1 text-left leading-tight ${activeSlug === cat.slug ? 'font-bold' : ''}`}>
                    {cat.name}
                  </span>
                  {hasChildren && (
                    <span className={`${activeSlug === cat.slug ? 'text-teal-600' : 'text-slate-400'} transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                      <ChevronRight size={15} />
                    </span>
                  )}
                </button>

                {/* Subcategories Accordion */}
                <AnimatePresence>
                  {hasChildren && isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="ml-6 pl-3 border-l-2 border-slate-100 mt-1 mb-3 space-y-0.5">
                        {cat.subcategories.map((sub, index) => (
                          <motion.button
                            key={sub._id}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -10, opacity: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.03 }}
                            onClick={() => onSelect(sub.slug)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors duration-200 ${
                              activeSlug === sub.slug
                                ? 'bg-teal-50 text-teal-700 font-bold ring-1 ring-inset ring-teal-600/10 shadow-sm'
                                : 'text-slate-500 font-medium hover:bg-slate-50 hover:text-slate-800'
                            }`}
                          >
                            <span className={`${activeSlug === sub.slug ? 'opacity-100 scale-110 drop-shadow-sm' : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100'} transition-all`}>{sub.icon}</span>
                            <span className="text-left">{sub.name}</span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
