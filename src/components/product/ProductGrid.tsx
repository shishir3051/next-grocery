import { useId } from 'react';
import ProductCard from './ProductCard';
import { cn } from '@/lib/cn';
import { getCategoryTint } from '@/lib/categoryColors';

interface Product {
  _id: string;
  name: string;
  price: number;
  discountPrice?: number;
  unit: string;
  images: string[];
  isOrganic?: boolean;
  isHalal?: boolean;
  stock: number;
}

interface ProductGridProps {
  products: Product[];
  title?: string;
}

export default function ProductGrid({ products, title }: ProductGridProps) {
  const headingId = useId();
  if (products.length === 0) return null;

  const countLabel = `${products.length} ${products.length === 1 ? 'item' : 'items'}`;

  return (
    <section className="mb-10" aria-labelledby={title ? headingId : undefined}>
      {title && (
        <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-slate-200 pb-3">
          <h2 id={headingId} className="flex items-center gap-2.5 text-lg font-semibold text-slate-900 sm:text-xl">
            {/* Category colour marker, matching the sidebar tile */}
            <span aria-hidden="true" className={cn("h-5 w-1.5 rounded-full", getCategoryTint(title).marker)} />
            {title}
          </h2>
          <span className="flex-shrink-0 text-sm text-slate-500">{countLabel}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}
