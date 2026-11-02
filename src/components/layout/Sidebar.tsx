'use client';

import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { getCategoryTint } from '@/lib/categoryColors';

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

// Shared row styles so "All products", categories and subcategories stay consistent.
const ROW_BASE = 'w-full flex items-center gap-3 px-3 min-h-11 rounded-xl text-sm text-left transition-colors duration-150';
const ROW_ACTIVE = 'bg-brand-50 text-brand-700 font-semibold';
const ROW_IDLE = 'text-slate-700 font-medium hover:bg-slate-100 hover:text-slate-900';

function IconTile({ icon, active, name }: { icon: string; active: boolean; name?: string }) {
  // Each category gets its own soft aisle tint; "All products" uses the brand tint.
  const tint = name ? getCategoryTint(name).tile : 'bg-brand-100 ring-brand-200';
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-base ring-1 ring-inset transition-shadow',
        tint,
        active && 'shadow-sm ring-2'
      )}
    >
      {icon}
    </span>
  );
}

export default function Sidebar({
  categories,
  activeSlug,
  onSelect,
}: SidebarProps) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const reduceMotion = useReducedMotion();

  const toggle = (slug: string) => {
    setExpanded((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : [...prev, slug]
    );
  };

  return (
    // On mobile this is an overlay drawer above the page backdrop (z-40);
    // from md up it is a static rail under the header.
    <aside
      className="fixed top-16 left-0 bottom-0 z-40 overflow-y-auto bg-white border-r border-slate-200 shadow-xl md:z-20 md:shadow-none"
      style={{ width: 'var(--sidebar-width)' }}
    >
      <nav aria-label="Product categories" className="p-3">
        {/* All Products */}
        <button
          type="button"
          onClick={() => onSelect('all')}
          aria-current={activeSlug === 'all' ? 'page' : undefined}
          className={cn(ROW_BASE, activeSlug === 'all' ? ROW_ACTIVE : ROW_IDLE)}
        >
          <IconTile icon="🛒" active={activeSlug === 'all'} />
          <span>All products</span>
        </button>

        {/* Categories */}
        <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2">
          {categories.map((cat) => {
            const isOpen = expanded.includes(cat.slug);
            const isActive = activeSlug === cat.slug;
            const hasChildren =
              cat.subcategories && cat.subcategories.length > 0;
            const panelId = `subcategories-${cat.slug}`;

            return (
              <li key={cat._id}>
                {/* Parent category: selects it and toggles its subcategories */}
                <button
                  type="button"
                  onClick={() => {
                    onSelect(cat.slug);
                    if (hasChildren) toggle(cat.slug);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  aria-expanded={hasChildren ? isOpen : undefined}
                  aria-controls={hasChildren ? panelId : undefined}
                  className={cn(ROW_BASE, 'py-1.5', isActive ? ROW_ACTIVE : ROW_IDLE)}
                >
                  <IconTile icon={cat.icon} active={isActive} name={cat.name} />

                  <span className="flex-1 leading-tight">{cat.name}</span>

                  {hasChildren && (
                    <ChevronRight
                      size={16}
                      aria-hidden="true"
                      className={cn(
                        'flex-shrink-0 transition-transform duration-200',
                        isOpen ? 'rotate-90 text-brand-600' : 'text-slate-400'
                      )}
                    />
                  )}
                </button>

                {/* Subcategories */}
                <AnimatePresence initial={false}>
                  {hasChildren && isOpen && (
                    <motion.div
                      id={panelId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.2 }}
                      className="overflow-hidden"
                    >
                      <ul className="mb-2 ml-6 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
                        {cat.subcategories.map((sub) => {
                          const isSubActive = activeSlug === sub.slug;
                          return (
                            <li key={sub._id}>
                              <button
                                type="button"
                                onClick={() => onSelect(sub.slug)}
                                aria-current={isSubActive ? 'page' : undefined}
                                className={cn(
                                  'w-full flex items-center gap-2.5 px-3 min-h-10 rounded-lg text-sm text-left transition-colors duration-150',
                                  isSubActive
                                    ? ROW_ACTIVE
                                    : 'text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900'
                                )}
                              >
                                <span aria-hidden="true">{sub.icon}</span>
                                <span>{sub.name}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
