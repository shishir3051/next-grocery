import ProductCard from './ProductCard';

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
  if (products.length === 0) return null;

  return (
    <section className="mb-10">
      {title && (
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-teal-100 to-transparent" />
          <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded-full">
            {products.length} items
          </span>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}
