'use client';

import { ChevronRight } from 'lucide-react';
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

export default function Sidebar({
  categories,
  activeSlug,
  onSelect,
}: SidebarProps) {
  const [expanded, setExpanded] = useState<string[]>([]);

  const toggle = (slug: string) => {
    setExpanded((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
    );
  };

  return (
    <aside
      className="fixed top-16 left-0 bottom-0 z-20 overflow-y-auto bg-white border-r border-slate-200"
      style={{ width: 'var(--sidebar-width)' }}
    >
      <div className="p-3">
        {/* All Products */}
        <button
          onClick={() => onSelect('all')}
          className={`cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors duration-150 ${
            activeSlug === 'all'
              ? 'bg-teal-100 text-teal-700 font-semibold'
              : 'text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <span
            className={`text-lg flex items-center justify-center w-7 h-7 rounded-lg ${
              activeSlug === 'all'
                ? 'bg-teal-200'
                : 'bg-slate-100'
            }`}
          >
            🛒
          </span>
          <span>All Products</span>
        </button>

        {/* Categories */}
        <div className="pt-2 mt-2 border-t border-slate-100">
          {categories.map((cat) => {
            const isOpen = expanded.includes(cat.slug);
            const hasChildren =
              cat.subcategories && cat.subcategories.length > 0;

            return (
              <div key={cat._id} className="mb-1.5">
                {/* Parent Category */}
                <button
                  onClick={() => {
                    onSelect(cat.slug);
                    if (hasChildren) toggle(cat.slug);
                  }}
                  className={`cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors duration-150 ${
                    activeSlug === cat.slug
                      ? 'bg-teal-100 text-teal-700 font-semibold'
                      : 'text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span
                    className={`text-lg flex items-center justify-center w-7 h-7 rounded-lg ${
                      activeSlug === cat.slug
                        ? 'bg-teal-200'
                        : 'bg-slate-100'
                    }`}
                  >
                    {cat.icon}
                  </span>

                  <span className="flex-1 text-left leading-tight">
                    {cat.name}
                  </span>

                  {hasChildren && (
                    <span
                      className={`transition-transform duration-200 ${
                        isOpen ? 'rotate-90 text-teal-600' : 'text-slate-400'
                      }`}
                    >
                      <ChevronRight size={15} />
                    </span>
                  )}
                </button>

                {/* Subcategories */}
                <AnimatePresence>
                  {hasChildren && isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-6 pl-3 border-l border-slate-200 mt-1 mb-3 space-y-0.5">
                        {cat.subcategories.map((sub, index) => (
                          <motion.button
                            key={sub._id}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -10, opacity: 0 }}
                            transition={{
                              duration: 0.2,
                              delay: index * 0.03,
                            }}
                            onClick={() => onSelect(sub.slug)}
                            className={`cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors duration-150 ${
                              activeSlug === sub.slug
                                ? 'bg-teal-100 text-teal-700 font-semibold'
                                : 'text-slate-500 font-medium hover:bg-slate-100 hover:text-slate-800'
                            }`}
                          >
                            <span
                              className={`transition-all ${
                                activeSlug === sub.slug
                                  ? 'opacity-100 scale-105'
                                  : 'opacity-70'
                              }`}
                            >
                              {sub.icon}
                            </span>

                            <span className="text-left">
                              {sub.name}
                            </span>
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